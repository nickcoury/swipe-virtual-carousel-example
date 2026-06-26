const ITEMS_TO_ADD = 5;
const PRUNE_THRESHOLD = 15;
const OBSERVER_MARGIN = '0px 800px 0px 800px';

const carousel = document.getElementById('carousel');
const itemWidth = () => window.innerWidth;

let minIndex = -5;
let maxIndex = 5;
let isUpdating = false;

function dbg(p) { window.__dbgUpdate && window.__dbgUpdate(p); }
function log(t, c) { window.__dbgLog && window.__dbgLog(t, c); }

function createItem(index) {
  const el = document.createElement('div');
  el.className = 'item';
  el.textContent = index;
  el.dataset.index = index;
  return el;
}

function centerScroll() {
  const offset = (0 - minIndex) * itemWidth();
  const containerWidth = carousel.clientWidth;
  carousel.scrollLeft = offset - (containerWidth - itemWidth()) / 2;
}

function renderInitial() {
  for (let i = minIndex; i <= maxIndex; i++) {
    carousel.appendChild(createItem(i));
  }
  reflow();
  centerScroll();
}

function reflow() {
  void carousel.offsetHeight;
}

function addToStart() {
  if (isUpdating) return;
  isUpdating = true;
  dbg({ updating: true });

  const prevScroll = carousel.scrollLeft;
  const newIndices = [];
  for (let i = 1; i <= ITEMS_TO_ADD; i++) {
    const idx = minIndex - i;
    newIndices.push(idx);
    carousel.prepend(createItem(idx));
  }
  minIndex -= ITEMS_TO_ADD;
  reflow();
  carousel.scrollLeft = prevScroll + ITEMS_TO_ADD * itemWidth();
  lastScrollLeft = carousel.scrollLeft;
  pruneEnd();
  log(`+L ${newIndices.join(',')}  min→${minIndex}`, 'add');

  isUpdating = false;
  dbg({ minIdx: minIndex, maxIdx: maxIndex, domCount: carousel.children.length, updating: false });
}

function addToEnd() {
  if (isUpdating) return;
  isUpdating = true;
  dbg({ updating: true });

  const newIndices = [];
  for (let i = 1; i <= ITEMS_TO_ADD; i++) {
    const idx = maxIndex + i;
    newIndices.push(idx);
    carousel.appendChild(createItem(idx));
  }
  maxIndex += ITEMS_TO_ADD;
  pruneStart();
  lastScrollLeft = carousel.scrollLeft;
  log(`+R ${newIndices.join(',')}  max→${maxIndex}`, 'add');

  isUpdating = false;
  dbg({ minIdx: minIndex, maxIdx: maxIndex, domCount: carousel.children.length, updating: false });
}

function pruneStart() {
  const removed = [];
  while (minIndex + PRUNE_THRESHOLD < maxIndex - PRUNE_THRESHOLD) {
    removed.push(carousel.firstChild);
    minIndex++;
  }
  if (removed.length) {
    removed.forEach(el => el.remove());
    reflow();
    carousel.scrollLeft -= removed.length * itemWidth();
    const idxs = removed.map(el => Number(el.dataset.index));
    log(`-L ${idxs.join(',')}  min→${minIndex}`, 'remove');
    dbg({ minIdx: minIndex, domCount: carousel.children.length });
  }
}

function pruneEnd() {
  const removed = [];
  while (maxIndex - PRUNE_THRESHOLD > minIndex + PRUNE_THRESHOLD) {
    removed.push(carousel.lastChild);
    maxIndex--;
  }
  if (removed.length) {
    removed.forEach(el => el.remove());
    const idxs = removed.map(el => Number(el.dataset.index));
    log(`-R ${idxs.join(',')}  max→${maxIndex}`, 'remove');
    dbg({ maxIdx: maxIndex, domCount: carousel.children.length });
  }
}

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (isUpdating) return;
    const el = entry.target;
    const index = Number(el.dataset.index);
    if (!entry.isIntersecting) continue;
    if (index === minIndex) addToStart();
    if (index === maxIndex) addToEnd();
  }
}, {
  root: carousel,
  rootMargin: OBSERVER_MARGIN,
});

function observeEdges() {
  observer.disconnect();
  const children = carousel.children;
  if (children.length > 1) {
    observer.observe(children[0]);
    observer.observe(children[children.length - 1]);
  }
}

const edgeObserver = new MutationObserver(() => observeEdges());
edgeObserver.observe(carousel, { childList: true });

renderInitial();
observeEdges();
dbg({
  minIdx: minIndex, maxIdx: maxIndex, domCount: carousel.children.length,
  updating: false, scrollLeft: 0, scrollRight: 0, totalW: 0, threshold: 0, dir: '—',
});

// --- Edge detection (runs on every scroll event) ---

let lastScrollLeft = carousel.scrollLeft;
const TOUCH_EDGE_BUFFER = 2.5;

carousel.addEventListener('touchstart', () => {
  log('touch DOWN', 'touch');
}, { passive: true });
carousel.addEventListener('touchend', () => {
  log('touch UP', 'touch');
}, { passive: true });
carousel.addEventListener('touchcancel', () => {
  log('touch CANCEL', 'touch');
}, { passive: true });

carousel.addEventListener('scroll', () => {
  if (isUpdating) return;

  const s = carousel.scrollLeft;
  const cw = carousel.clientWidth;
  const totalW = (maxIndex - minIndex + 1) * itemWidth();
  const threshold = TOUCH_EDGE_BUFFER * itemWidth();
  const sr = s + cw;
  const direction = s - lastScrollLeft;
  lastScrollLeft = s;

  dbg({
    scrollLeft: Math.round(s),
    scrollRight: Math.round(sr),
    totalW: Math.round(totalW),
    threshold: Math.round(threshold),
    dir: direction > 0 ? '→' : direction < 0 ? '←' : '—',
  });

  const nearL = direction < 0 && s < threshold;
  const nearR = direction > 0 && sr > totalW - threshold;

  if (nearL || nearR) {
    log(`edge ${nearL ? '←L' : '→R'}  s=${Math.round(s)} sr=${Math.round(sr)} tw=${Math.round(totalW)} thr=${Math.round(threshold)}`, 'scroll');
  }

  if (nearL) {
    addToStart();
  } else if (nearR) {
    addToEnd();
  }
}, { passive: true });
