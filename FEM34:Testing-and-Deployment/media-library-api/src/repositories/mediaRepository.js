// The ONLY layer that talks to MongoDB. It receives plain values and returns documents; it knows nothing about
// HTTP, files on disk or business rules.
const Media = require('../models/Media');

/** Turns the plain filter values into a MongoDB query. */
function buildQuery({ category, tags, search } = {}) {
  const query = {};
  if (category) query.category = category;
  if (tags && tags.length > 0) query.tags = { $in: tags }; // has at least one of the tags
  if (search) query.$text = { $search: search };
  return query;
}

const mediaRepository = {
  create(data) {
    return Media.create(data);
  },

  findById(id) {
    return Media.findById(id);
  },

  /** One page of results. sort is e.g. { title: 1 }; _id is added so equal values keep a stable order between pages. */
  find(criteria, { sort, skip, limit }) {
    return Media.find(buildQuery(criteria)).sort({ ...sort, _id: 1 }).skip(skip).limit(limit);
  },

  count(criteria) {
    return Media.countDocuments(buildQuery(criteria));
  },

  /** Returns the updated document, or null when the id does not exist. */
  updateById(id, changes) {
    return Media.findByIdAndUpdate(id, changes, { returnDocument: 'after', runValidators: true });
  },

  /** Returns the deleted document (so the caller can remove its file), or null. */
  deleteById(id) {
    return Media.findByIdAndDelete(id);
  },
};

module.exports = mediaRepository;
