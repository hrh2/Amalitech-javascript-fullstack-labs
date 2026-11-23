const validate = require('../../middlewares/validate');
const { createMediaBody, mediaIdParams } = require('../../validators/mediaSchemas');

describe('validate middleware', () => {
  test('valid input: clean values on req.validated, next() called with no error', () => {
    const req = { body: { title: ' x ' }, params: { id: 'a'.repeat(24) } };
    const next = jest.fn();
    validate({ body: createMediaBody, params: mediaIdParams })(req, {}, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.validated.body).toEqual({ title: 'x', tags: [], category: 'other' });
    expect(req.validated.params).toEqual({ id: 'a'.repeat(24) });
  });

  test('invalid input: a structured 400 AppError with field-level details', () => {
    const next = jest.fn();
    validate({ body: createMediaBody })({ body: {} }, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toMatchObject({
      statusCode: 400,
      message: 'Validation failed',
      details: [{ field: 'title', message: 'Title is required' }],
    });
  });

  test('problems from several parts are reported together', () => {
    const next = jest.fn();
    validate({ params: mediaIdParams, body: createMediaBody })({ body: {}, params: { id: 'bad' } }, {}, next);
    expect(next.mock.calls[0][0].details.map((d) => d.field).sort()).toEqual(['id', 'title']);
  });

  test('does not set req.validated when validation fails', () => {
    const req = { body: {} };
    validate({ body: createMediaBody })(req, {}, jest.fn());
    expect(req.validated).toBeUndefined();
  });

  test('an undefined body (Express 5 with no body sent) is treated as {}', () => {
    const next = jest.fn();
    validate({ body: createMediaBody })({ body: undefined }, {}, next);
    expect(next.mock.calls[0][0].details).toEqual([{ field: 'title', message: 'Title is required' }]);
  });
});
