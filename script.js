const ITEMS_TO_ADD = 5;
const PRUNE_THRESHOLD = 10;
const OBSERVER_MARGIN = '0px 400px 0px 400px';

const carousel = document.getElementById('carousel');
const itemWidth = () => window.innerWidth;

let minIndex = -5;
let maxIndex = 5;
let isUpdating = false;

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

  const prevScroll = carousel.scrollLeft;

  for (let i = 1; i <= ITEMS_TO_ADD; i++) {
    carousel.prepend(createItem(minIndex - i));
  }
  minIndex -= ITEMS_TO_ADD;
  reflow();
  carousel.scrollLeft = prevScroll + ITEMS_TO_ADD * itemWidth();
  lastScrollLeft = carousel.scrollLeft;
  pruneEnd();

  isUpdating = false;
}

function addToEnd() {
  if (isUpdating) return;
  isUpdating = true;

  for (let i = 1; i <= ITEMS_TO_ADD; i++) {
    carousel.appendChild(createItem(maxIndex + i));
  }
  maxIndex += ITEMS_TO_ADD;
  pruneStart();
  lastScrollLeft = carousel.scrollLeft;

  isUpdating = false;
}

function pruneStart() {
  if (isTouching) return;
  while (minIndex + PRUNE_THRESHOLD < maxIndex - PRUNE_THRESHOLD) {
    carousel.firstChild.remove();
    minIndex++;
    reflow();
    carousel.scrollLeft -= itemWidth();
  }
}

function pruneEnd() {
  if (isTouching) return;
  while (maxIndex - PRUNE_THRESHOLD > minIndex + PRUNE_THRESHOLD) {
    carousel.lastChild.remove();
    maxIndex--;
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

// --- Touch-aware proactive edge loading ---

let isTouching = false;
let lastScrollLeft = carousel.scrollLeft;
const TOUCH_EDGE_BUFFER = 2.5;

carousel.addEventListener('touchstart', () => { isTouching = true; }, { passive: true });
carousel.addEventListener('touchend', () => { isTouching = false; }, { passive: true });
carousel.addEventListener('touchcancel', () => { isTouching = false; }, { passive: true });

carousel.addEventListener('scroll', () => {
  if (isUpdating) return;

  if (!isTouching) {
    lastScrollLeft = carousel.scrollLeft;
    return;
  }

  const direction = carousel.scrollLeft - lastScrollLeft;
  lastScrollLeft = carousel.scrollLeft;

  const s = carousel.scrollLeft;
  const cw = carousel.clientWidth;
  const totalW = (maxIndex - minIndex + 1) * itemWidth();
  const threshold = TOUCH_EDGE_BUFFER * itemWidth();

  if (direction < 0 && s < threshold) {
    addToStart();
  } else if (direction > 0 && s + cw > totalW - threshold) {
    addToEnd();
  }
}, { passive: true });
