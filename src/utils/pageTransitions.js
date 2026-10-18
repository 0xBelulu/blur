// Preserve the page order and animation parameters from the known-good 8c247da.
const PAGE_ORDER = ['landing', 'about', 'archetypes', 'traits', 'questions', 'me', 'identity', 'invite', 'friend', 'together', 'test', 'loading', 'result', 'view', 'compare'];

export const PAGE_VARIANTS = {
  enter: (direction = 1) => ({ opacity: 0, x: direction > 0 ? 60 : -60, scale: 0.97, filter: 'blur(2px)' }),
  center: {
    opacity: 1, x: 0, scale: 1, filter: 'blur(0px)',
    // Motion owns x/scale throughout. Never reset its transform string on completion.
    transitionEnd: { filter: 'none' },
  },
  exit: (direction = 1) => ({ opacity: 0, x: direction > 0 ? -60 : 60, scale: 0.97, filter: 'blur(2px)' }),
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
