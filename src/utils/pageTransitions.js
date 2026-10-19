// Preserve page order and numeric slide/scale ownership from the known-good 8c247da.
const PAGE_ORDER = ['landing', 'about', 'archetypes', 'traits', 'questions', 'me', 'identity', 'invite', 'friend', 'together', 'test', 'loading', 'result', 'view', 'compare', 'admin'];

const TRANSITION_BLUR = 'blur(4px)';

export const PAGE_VARIANTS = {
  enter: (direction = 1) => ({ opacity: 0, x: direction > 0 ? 60 : -60, scale: 0.97, filter: TRANSITION_BLUR }),
  center: {
    opacity: 1, x: 0, scale: 1, filter: 'blur(0px)',
    // Restore normal backdrop sampling for glass controls when the page settles.
    // The expensive background is a persistent sibling, outside this filter.
    transitionEnd: { filter: 'none' },
  },
  exit: (direction = 1) => ({ opacity: 0, x: direction > 0 ? -60 : 60, scale: 0.97, filter: TRANSITION_BLUR }),
};

// The same always-mounted surface blurs on exit and clears on entry. Its filter
// stays present at rest, so background compositing does not switch at completion.
export const BACKGROUND_VARIANTS = {
  center: { filter: 'blur(0px)' },
  exit: { filter: TRANSITION_BLUR },
};

export const PAGE_TRANSITION = { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] };

// Personal-space tabs share a page and must not restart its entrance animation.
export const pageKey = (route) => route.screen === 'me' ? 'me' : `${route.screen}/${route.id || ''}`;

export function nextPageRoute(previous, next) {
  // popstate and hashchange may both report the same navigation.
  if (previous.screen === next.screen && previous.id === next.id) return previous;
  const direction = pageKey(previous) === pageKey(next)
    ? previous.direction
    : PAGE_ORDER.indexOf(next.screen) > PAGE_ORDER.indexOf(previous.screen) ? 1 : -1;
  return { ...next, direction };
}
