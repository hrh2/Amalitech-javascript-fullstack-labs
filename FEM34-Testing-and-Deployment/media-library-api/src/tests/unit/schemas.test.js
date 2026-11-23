const { createMediaBody, updateMediaBody, mediaIdParams, listMediaQuery } = require('../../validators/mediaSchemas');

const messages = (schema, input) => {
  const result = schema.safeParse(input);
  return result.success ? null : result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
};
const parsed = (schema, input) => schema.parse(input);

describe('createMediaBody', () => {
  test('title only: tags default to [] and category to "other"', () => {
    expect(parsed(createMediaBody, { title: '  Logo  ' })).toEqual({ title: 'Logo', tags: [], category: 'other' });
  });

  test.each([
    ['a,b', ['a', 'b']],
    [' Red , Blue ,, ', ['red', 'blue']],
    [['x', 'Y'], ['x', 'y']],
    [['a,b', 'c'], ['a', 'b', 'c']],
    ['', []],
  ])('tags %j -> %j', (input, expected) => {
    expect(parsed(createMediaBody, { title: 't', tags: input }).tags).toEqual(expected);
  });

  test.each([
    [{}, 'title: Title is required'],
    [{ title: '' }, 'title: Title is required'],
    [{ title: '   ' }, 'title: Title is required'],
    [{ title: 5 }, 'title: Title is required'],
    [{ title: 'a'.repeat(201) }, 'title: Title can be at most 200 characters'],
    [{ title: 't', category: 'memes' }, 'category: category must be one of: marketing, product, design, documentation, other'],
    [{ title: 't', tags: 7 }, 'tags: tags must be an array of text values'],
    [{ title: 't', tags: Array.from({ length: 11 }, (_, i) => `t${i}`) }, 'tags: At most 10 tags'],
    [{ title: 't', tags: ['a'.repeat(31)] }, 'tags.0: A tag can be at most 30 characters'],
  ])('rejects %j', (input, message) => {
    expect(messages(createMediaBody, input)).toContain(message);
  });

  test('drops fields the client must not set (filePath, id...)', () => {
    expect(Object.keys(parsed(createMediaBody, { title: 't', filePath: '/etc/passwd', id: 'x' })).sort()).toEqual(['category', 'tags', 'title']);
  });
});

describe('updateMediaBody', () => {
  test('accepts a single field', () => expect(parsed(updateMediaBody, { category: 'design' })).toEqual({ category: 'design' }));
  test('rejects an empty body', () => expect(messages(updateMediaBody, {})).toEqual([': Send at least one of: title, tags, category']));
  test('a missing tags field is NOT turned into [] (that would wipe the tags)', () => {
    expect(parsed(updateMediaBody, { title: 'x' })).not.toHaveProperty('tags');
  });
});

describe('mediaIdParams', () => {
  test('accepts a 24-character hex id', () => expect(parsed(mediaIdParams, { id: 'a'.repeat(24) })).toEqual({ id: 'a'.repeat(24) }));
  test.each(['', '123', 'z'.repeat(24), 'a'.repeat(25), '1234567890ab'])('rejects "%s"', (id) => {
    expect(messages(mediaIdParams, { id })).not.toBeNull();
  });
});

describe('listMediaQuery', () => {
  test('defaults', () => expect(parsed(listMediaQuery, {})).toEqual({ page: 1, limit: 10, sortBy: 'createdAt', order: 'desc' }));

  test('converts text to numbers and splits tags', () => {
    expect(parsed(listMediaQuery, { page: '2', limit: '50', tags: 'a,b', category: 'design', search: ' hello ', sortBy: 'title', order: 'asc' })).toEqual({
      page: 2, limit: 50, tags: ['a', 'b'], category: 'design', search: 'hello', sortBy: 'title', order: 'asc',
    });
  });

  test.each([
    [{ page: '0' }, 'page: page must be at least 1'],
    [{ page: '-1' }, 'page: page must be at least 1'],
    [{ page: 'abc' }, 'page: page must be a number'],
    [{ page: '1.5' }, 'page: page must be a whole number'],
    [{ page: ['1', '2'] }, 'page: page must be a number'],
    [{ limit: '51' }, 'limit: limit can be at most 50'],
    [{ limit: '0' }, 'limit: limit must be at least 1'],
    [{ category: 'x' }, 'category: category must be one of: marketing, product, design, documentation, other'],
    [{ sortBy: 'password' }, 'sortBy: sortBy must be one of: createdAt, title, fileSize, category'],
    [{ order: 'up' }, 'order: order must be asc or desc'],
    [{ search: '   ' }, 'search: search cannot be empty'],
  ])('rejects %j', (input, message) => {
    expect(messages(listMediaQuery, input)).toContain(message);
  });
});
