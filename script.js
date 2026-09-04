(function () {
  const placeNameEl = document.getElementById('placeName');
  const placeRevealEl = document.getElementById('placeReveal');
  const placeCardEl = document.getElementById('placeCard');
  const streakValEl = document.getElementById('streakVal');
  const bestValEl = document.getElementById('bestVal');
  const btnGanja = document.getElementById('btnGanja');
  const btnGram = document.getElementById('btnGram');
  const toastEl = document.getElementById('toast');

  const STORAGE_KEY = 'gramNaGanja_bestStreak';

  let pool = [];       // full shuffled queue of {name, isReal, district}
  let current = null;  // current round's item
  let streak = 0;
  let best = Number(localStorage.getItem(STORAGE_KEY)) || 0;
  let locked = false;  // true while showing reveal, blocks input

  bestValEl.textContent = toBanglaDigits(best);

  Promise.all([
    fetch('real.json').then(r => r.json()),
    fetch('fake.json').then(r => r.json())
  ]).then(([realData, fakeData]) => {
    const realItems = realData.map(item => ({
      name: item.name,
      isReal: true,
      district: item.district || null
    }));
    const fakeItems = fakeData.map(name => ({
      name: typeof name === 'string' ? name : name.name,
      isReal: false,
      district: null
    }));
    pool = shuffle(realItems.concat(fakeItems));
    nextRound();
  }).catch(err => {
    placeNameEl.textContent = 'ডেটা লোড করা যায়নি';
    placeRevealEl.textContent = 'real.json / fake.json একই ফোল্ডারে আছে কিনা দেখো, আর সার্ভার থেকে চালাও (file:// থেকে না)।';
    console.error(err);
  });

  btnGanja.addEventListener('click', () => handleGuess(false));
  btnGram.addEventListener('click', () => handleGuess(true));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') handleGuess(true);   // গ্রাম is now on the left
    if (e.key === 'ArrowRight') handleGuess(false);  // গাঁজা is now on the right
  });

  let queue = [];

  function nextRound() {
    if (queue.length === 0) {
      queue = shuffle(pool);
    }
    current = queue.pop();

    placeCardEl.classList.remove('flash-correct', 'flash-wrong');
    placeRevealEl.textContent = '';
    placeRevealEl.className = 'place-reveal';
    placeNameEl.style.opacity = '1';
    placeNameEl.textContent = current.name;
    locked = false;
  }

  function handleGuess(guessedReal) {
    if (locked || !current) return;
    locked = true;

    const correct = guessedReal === current.isReal;

    if (correct) {
      streak += 1;
      if (streak > best) {
        best = streak;
        localStorage.setItem(STORAGE_KEY, String(best));
        showToast('নতুন সেরা স্ট্রিক! 🔥');
      }
      placeCardEl.classList.add('flash-correct');
      placeRevealEl.classList.add('correct');
      placeRevealEl.textContent = current.isReal
        ? `✅ সত্যিই আছে${current.district ? ' — ' + current.district : ''}`
        : '✅ ঠিক ধরেছো, এটা বানানো';
    } else {
      streak = 0;
      placeCardEl.classList.add('flash-wrong');
      placeRevealEl.classList.add('wrong');
      placeRevealEl.textContent = current.isReal
        ? `❌ ভুল! এটা আসল গ্রাম${current.district ? ' — ' + current.district : ''}`
        : '❌ ভুল! এটা আসলে বানানো নাম';
    }

    streakValEl.textContent = toBanglaDigits(streak);
    bestValEl.textContent = toBanglaDigits(best);

    setTimeout(nextRound, 1100);
  }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 1400);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function toBanglaDigits(num) {
    const map = { '0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯' };
    return String(num).split('').map(ch => map[ch] ?? ch).join('');
  }
})();