const ITEMS_TO_ADD = 3;
const PRUNE_THRESHOLD = 5;
const OBSERVER_MARGIN = '0px 400px 0px 400px';

const carousel = document.getElementById('carousel');
const itemWidth = () => window.innerWidth;

let minIndex = -3;
let maxIndex = 3;
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
  centerScroll();
}

function addToStart() {
  if (isUpdating) return;
  isUpdating = true;

  const prevScroll = carousel.scrollLeft;

  for (let i = 1; i <= ITEMS_TO_ADD; i++) {
    const el = createItem(minIndex - i);
    carousel.prepend(el);
  }
  minIndex -= ITEMS_TO_ADD;
  carousel.scrollLeft = prevScroll + ITEMS_TO_ADD * itemWidth();
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

  isUpdating = false;
}

function pruneStart() {
  while (minIndex + PRUNE_THRESHOLD < maxIndex - PRUNE_THRESHOLD) {
    carousel.firstChild.remove();
    minIndex++;
    carousel.scrollLeft -= itemWidth();
  }
}

function pruneEnd() {
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
