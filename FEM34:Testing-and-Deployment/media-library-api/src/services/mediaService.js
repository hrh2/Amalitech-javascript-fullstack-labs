// Business logic: the rules of the Media Library. No req/res here (that is the controller's world) and no MongoDB
// calls (that is the repository's). The repository and file storage are passed in so tests can swap them for fakes.
const AppError = require('../utils/AppError');
const { publicPath, removeStoredFile } = require('../utils/fileStorage');
const mediaRepository = require('../repositories/mediaRepository');

function createMediaService({ repository, storage }) {
  async function getOrFail(id) {
    const media = await repository.findById(id);
    if (!media) throw AppError.notFound(`Media item ${id} not found`);
    return media;
  }

  return {
    /** Saves the metadata of a file that Multer has already written to disk. */
    create(file, metadata) {
      return repository.create({
        title: metadata.title,
        tags: metadata.tags,
        category: metadata.category,
        filePath: storage.publicPath(file.filename),
        originalName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
      });
    },

    async list({ page, limit, sortBy, order, ...criteria }) {
      const sort = { [sortBy]: order === 'asc' ? 1 : -1 };
      // The page of records and the total count do not depend on each other, so they run at the same time.
      const [results, total] = await Promise.all([
        repository.find(criteria, { sort, skip: (page - 1) * limit, limit }),
        repository.count(criteria),
      ]);
      return { results, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    },

    getById: getOrFail,

    async update(id, changes) {
      const media = await repository.updateById(id, changes);
      if (!media) throw AppError.notFound(`Media item ${id} not found`);
      return media;
    },

    /** Deletes the record AND its file. */
    async remove(id) {
      const media = await repository.deleteById(id);
      if (!media) throw AppError.notFound(`Media item ${id} not found`);
      await storage.removeStoredFile(media.filePath);
      return media;
    },
  };
}

const mediaService = createMediaService({
  repository: mediaRepository,
  storage: { publicPath, removeStoredFile },
});

module.exports = { mediaService, createMediaService };
