import { throttle } from './throttle.ts';
import assert from 'node:assert';
import { test, mock } from 'node:test';

test('throttle utility', async (t) => {
  // We use mock timers to avoid actual waiting and make tests deterministic
  mock.timers.enable({ apis: ['Date'] });

  t.after(() => {
    mock.timers.reset();
  });

  await t.test('should execute immediately on the first call', () => {
    let called = 0;
    const throttled = throttle(() => called++, 100);

    throttled();
    assert.strictEqual(called, 1);
  });

  await t.test('should throttle calls within the delay period', () => {
    let called = 0;
    const throttled = throttle(() => called++, 100);

    throttled(); // 0ms - call 1
    mock.timers.tick(50);
    throttled(); // 50ms - throttled
    mock.timers.tick(40);
    throttled(); // 90ms - throttled

    assert.strictEqual(called, 1);
  });

  await t.test('should execute again after the delay period has passed', () => {
    let called = 0;
    const throttled = throttle(() => called++, 100);

    throttled(); // 0ms - call 1
    mock.timers.tick(100);
    throttled(); // 100ms - call 2
    mock.timers.tick(101);
    throttled(); // 201ms - call 3

    assert.strictEqual(called, 3);
  });

  await t.test('should return the result of the last successful call while throttled', () => {
    const throttled = throttle((n: number) => n * 2, 100);

    assert.strictEqual(throttled(1), 2); // 0ms - call 1, result 2
    mock.timers.tick(50);
    assert.strictEqual(throttled(2), 2); // 50ms - throttled, returns 2
    mock.timers.tick(50);
    assert.strictEqual(throttled(3), 6); // 100ms - call 2, result 6
  });

  await t.test('should pass arguments correctly to the throttled function', () => {
    let lastArgs: any[] = [];
    const throttled = throttle((...args: any[]) => {
      lastArgs = args;
    }, 100);

    throttled('a', 'b', 1);
    assert.deepStrictEqual(lastArgs, ['a', 'b', 1]);

    mock.timers.tick(100);
    throttled('next');
    assert.deepStrictEqual(lastArgs, ['next']);
  });
});
