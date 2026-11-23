const { createMediaService } = require('../../services/mediaService');

const baseQuery = { page: 1, limit: 10, sortBy: 'createdAt', order: 'desc' };
const makeService = (repository, storage = {}) => createMediaService({ repository, storage });

describe('mediaService.list: pagination', () => {
  test.each([
    [84, 10, 9],
    [80, 10, 8],
    [1, 10, 1],
    [0, 10, 0],
    [51, 50, 2],
  ])('total %i with limit %i -> totalPages %i', async (total, limit, totalPages) => {
    const service = makeService({ find: async () => [], count: async () => total });
    const { pagination } = await service.list({ ...baseQuery, limit });
    expect(pagination.totalPages).toBe(totalPages);
  });

  test('returns the page, limit and total it was asked for', async () => {
    const service = makeService({ find: async () => ['a'], count: async () => 84 });
    expect(await service.list({ ...baseQuery, page: 2 })).toEqual({
      results: ['a'],
      pagination: { total: 84, page: 2, limit: 10, totalPages: 9 },
    });
  });

  test('skip = (page - 1) * limit, and the sort direction follows "order"', async () => {
    const find = jest.fn(async () => []);
    const service = makeService({ find, count: async () => 0 });
    await service.list({ ...baseQuery, page: 3, limit: 20, sortBy: 'title', order: 'asc' });
    expect(find).toHaveBeenCalledWith({}, { sort: { title: 1 }, skip: 40, limit: 20 });
    await service.list({ ...baseQuery, order: 'desc' });
    expect(find).toHaveBeenLastCalledWith({}, { sort: { createdAt: -1 }, skip: 0, limit: 10 });
  });

  test('only filter fields reach the repository', async () => {
    const find = jest.fn(async () => []);
    await makeService({ find, count: async () => 0 }).list({ ...baseQuery, category: 'design', search: 'x' });
    expect(find.mock.calls[0][0]).toEqual({ category: 'design', search: 'x' });
  });

  test('the page query and the count run at the same time (Promise.all)', async () => {
    const events = [];
    const slow = (name, value) => async () => {
      events.push(`${name} started`);
      await new Promise((resolve) => setTimeout(resolve, 20));
      events.push(`${name} done`);
      return value;
    };
    await makeService({ find: slow('find', []), count: slow('count', 0) }).list(baseQuery);
    expect(events.slice(0, 2)).toEqual(['find started', 'count started']); // both started before either finished
  });
});

describe('mediaService: records', () => {
  test('create() builds the record from the saved file, with a relative path', async () => {
    const create = jest.fn(async (data) => data);
    const storage = { publicPath: (name) => `uploads/${name}` };
    const file = { filename: 'abc.png', originalname: 'logo.png', mimetype: 'image/png', size: 123 };
    await makeService({ create }, storage).create(file, { title: 'T', tags: ['a'], category: 'design' });
    expect(create).toHaveBeenCalledWith({
      title: 'T', tags: ['a'], category: 'design', filePath: 'uploads/abc.png', originalName: 'logo.png', mimeType: 'image/png', fileSize: 123,
    });
  });

  test('getById() returns the record, or a 404 AppError', async () => {
    await expect(makeService({ findById: async () => ({ id: 1 }) }).getById('x')).resolves.toEqual({ id: 1 });
    await expect(makeService({ findById: async () => null }).getById('x')).rejects.toMatchObject({ statusCode: 404 });
  });

  test('update() returns the updated record, or a 404', async () => {
    await expect(makeService({ updateById: async () => ({ title: 'N' }) }).update('x', {})).resolves.toEqual({ title: 'N' });
    await expect(makeService({ updateById: async () => null }).update('x', {})).rejects.toMatchObject({ statusCode: 404 });
  });

  test('remove() deletes the record and then its file', async () => {
    const order = [];
    const repository = { deleteById: async () => { order.push('record'); return { filePath: 'uploads/a.png' }; } };
    const storage = { removeStoredFile: async (p) => order.push(`file ${p}`) };
    await makeService(repository, storage).remove('x');
    expect(order).toEqual(['record', 'file uploads/a.png']);
  });

  test('remove() of a missing record is a 404 and touches no file', async () => {
    const removeStoredFile = jest.fn();
    await expect(makeService({ deleteById: async () => null }, { removeStoredFile }).remove('x')).rejects.toMatchObject({ statusCode: 404 });
    expect(removeStoredFile).not.toHaveBeenCalled();
  });
});
