const catchAsync = require('../../utils/catchAsync');

describe('catchAsync', () => {
  test('a rejected promise is forwarded to next(error)', async () => {
    const boom = new Error('boom');
    const next = jest.fn();
    await catchAsync(async () => { throw boom; })({}, {}, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(boom);
  });

  test('a handler that rejects with a non-Error is still forwarded', async () => {
    const next = jest.fn();
    await catchAsync(() => Promise.reject('plain text'))({}, {}, next);
    expect(next).toHaveBeenCalledWith('plain text');
  });

  test('next() is not called when the handler succeeds', async () => {
    const next = jest.fn();
    await catchAsync(async () => {})({}, {}, next);
    expect(next).not.toHaveBeenCalled();
  });

  test('passes req, res and next to the handler', async () => {
    const handler = jest.fn();
    const args = [{ a: 1 }, { b: 2 }, jest.fn()];
    await catchAsync(handler)(...args);
    expect(handler).toHaveBeenCalledWith(...args);
  });
});
