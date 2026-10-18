import assert from 'node:assert/strict';
import test from 'node:test';
import { nextPageRoute, pageKey, PAGE_VARIANTS } from '../src/utils/pageTransitions.js';

test('all three home actions slide forward, and returning home reverses the direction', () => {
  const home = { screen: 'landing', direction: 1 };
  for (const screen of ['test', 'about', 'me']) {
    const destination = nextPageRoute(home, { screen });
    assert.notEqual(pageKey(destination), pageKey(home));
    assert.equal(destination.direction, 1);
    assert.ok(PAGE_VARIANTS.enter(destination.direction).x > 0);
    assert.ok(PAGE_VARIANTS.exit(destination.direction).x < 0);
    const back = nextPageRoute(destination, { screen: 'landing' });
    assert.equal(back.direction, -1);
    assert.ok(PAGE_VARIANTS.enter(back.direction).x < 0);
    assert.ok(PAGE_VARIANTS.exit(back.direction).x > 0);
  }
});

test('duplicate navigation notifications preserve the accepted route and its direction', () => {
  const current = { screen: 'test', direction: 1 };
  const back = nextPageRoute(current, { screen: 'landing' });
  assert.equal(back.direction, -1);
  assert.equal(nextPageRoute(back, { screen: 'landing' }), back);
  assert.equal(nextPageRoute(nextPageRoute(back, { screen: 'landing' }), { screen: 'landing' }), back);
});

test('personal tabs keep the same transition instance, while different records change it', () => {
  const profile = { screen: 'me', id: 'profile', direction: 1 };
  const friends = nextPageRoute(profile, { screen: 'me', id: 'friends' });
  assert.equal(friends.id, 'friends');
  assert.equal(pageKey(friends), pageKey(profile));
  assert.equal(friends.direction, profile.direction);
  assert.notEqual(pageKey({ screen: 'result', id: 'a' }), pageKey({ screen: 'result', id: 'b' }));
});

test('queued navigation derives direction from the preceding accepted route without mutating it', () => {
  const initial = Object.freeze({ screen: 'landing', direction: 1 });
  const testPage = nextPageRoute(initial, { screen: 'test' });
  const aboutPage = nextPageRoute(testPage, { screen: 'about' });
  const myPage = nextPageRoute(aboutPage, { screen: 'me' });
  assert.equal(testPage.direction, 1);
  assert.equal(aboutPage.direction, -1);
  assert.equal(myPage.direction, 1);
  assert.deepEqual(initial, { screen: 'landing', direction: 1 });
});

test('transition completion keeps numeric transform ownership so it cannot reset the slide', () => {
  const center = PAGE_VARIANTS.center;
  for (const direction of [-1, 1]) {
    for (const target of [PAGE_VARIANTS.enter(direction), center, PAGE_VARIANTS.exit(direction)]) {
      assert.equal(typeof target.x, 'number');
      assert.equal(typeof target.scale, 'number');
      assert.equal(target.transform, undefined);
    }
  }
  assert.equal(center.x, 0);
  assert.equal(center.scale, 1);
  assert.equal(center.transitionEnd.transform, undefined);
  assert.equal(center.transitionEnd.filter, 'none');
});
