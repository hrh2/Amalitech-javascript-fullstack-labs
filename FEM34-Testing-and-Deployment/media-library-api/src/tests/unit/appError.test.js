const AppError = require('../../utils/AppError');

describe('AppError', () => {
  test('carries message, statusCode and details', () => {
    const err = new AppError(400, 'Validation failed', [{ field: 'title', message: 'Title is required' }]);
    expect(err.message).toBe('Validation failed');
    expect(err.statusCode).toBe(400);
    expect(err.details).toEqual([{ field: 'title', message: 'Title is required' }]);
  });

  test('status is "fail" for 4xx and "error" for 5xx', () => {
    expect(new AppError(400, 'x').status).toBe('fail');
    expect(new AppError(404, 'x').status).toBe('fail');
    expect(new AppError(500, 'x').status).toBe('error');
  });

  test('is an operational Error with a stack trace', () => {
    const err = new AppError(404, 'nope');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(err.isOperational).toBe(true);
    expect(err.stack).toContain('nope');
  });

  test('badRequest() and notFound() build 400 and 404 errors', () => {
    expect(AppError.badRequest('bad', [1])).toMatchObject({ statusCode: 400, message: 'bad', details: [1] });
    expect(AppError.notFound('gone')).toMatchObject({ statusCode: 404, message: 'gone' });
  });
});
