const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true, // a unique INDEX in MongoDB: two users cannot share an email
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'email must look like name@example.com'],
    },
  },
  {
    // virtuals (like `posts` below) are only included in JSON when asked for
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// A VIRTUAL populate: a user does not store its posts. Mongoose can look them up on demand
// by matching each Post's `author` to this user's _id (a one-to-many relationship).
userSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'author',
});

module.exports = mongoose.model('User', userSchema);
