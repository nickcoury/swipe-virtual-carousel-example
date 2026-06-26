# Virtualized Scroll-Snap Carousel Bug Reproduction

Minimal reproduction of browser scroll-position / scroll-momentum loss when
modifying DOM elements during an active scroll-snap animation in a virtualized
horizontal carousel.

## The Bug

In a horizontally scrollable container with `scroll-snap-type: x mandatory`,
elements are dynamically added/removed at the edges as the user scrolls
(virtualization). On certain browsers, when the scroll momentum carries the
user past a snap point while DOM mutations are happening at the edge, the
browser may:

- Drop the remaining scroll momentum (scroll stops abruptly)
- Reset the scroll position to the current snap target
- Partially flicker the content

The goal is to find a minimal, clean test case that either works reliably
across all browsers or demonstrates the bug so it can be filed against the
offending browser engine.

## Structure

- `index.html` — single-page app entry point
- `style.css` — layout, scroll snap, item styling
- `script.js` — virtualization, IntersectionObserver, edge management

## How It Works

A horizontal carousel fills the middle 50 % of the viewport (25 % top/bottom
padding). Each item is `50vw × 50vh` with `scroll-snap-align: center`. Seven
items are active at a time, indexed from –3 to +3, with 0 centered initially.

As you scroll:
1. **IntersectionObserver** monitors the first and last rendered items with a
   generous rootMargin buffer.
2. When an edge item enters the observation zone, 3 new items are appended or
   prepended and `scrollLeft` is adjusted to prevent visual jumps.
3. Items farther than 5 positions from the current extreme are pruned to keep
   the DOM balanced.

## Testing

Open `index.html` in each browser, then flick-scroll rapidly in one direction.
Observe whether the carousel continues smoothly or stops abruptly.

| Browser | Expected | Observed |
|---------|----------|----------|
| Chrome  | Smooth  |          |
| Firefox | Smooth  |          |
| Safari  | Smooth  |          |

## Notes

- No build tools, no frameworks — pure HTML / CSS / JS.
- The `IntersectionObserver` rootMargin is set wide enough to trigger
  additions well before the edge becomes visible.
- Scroll position is manually adjusted when prepending items.
