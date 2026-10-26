const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'title is required'], trim: true },
    content: { type: String, required: [true, 'content is required'] },
    // The crucial part of the challenge: author is NOT a copy of the user, it is the user's _id.
    // `ref: 'User'` tells Mongoose which model that id belongs to, which is what .populate() needs.
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'author is required'] },
  },
  { timestamps: true },
);

postSchema.index({ author: 1 }); // finding "all posts by this author" is the common query

module.exports = mongoose.model('Post', postSchema);
