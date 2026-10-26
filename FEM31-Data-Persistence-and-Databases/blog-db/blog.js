// The data functions the demo (and the tests) use, kept separate from the script that prints things.
const User = require('./models/User');
const Post = require('./models/Post');

const createUser = (data) => User.create(data);

// Links the post to its author by storing the author's _id.
const createPost = ({ title, content, authorId }) => Post.create({ title, content, author: authorId });

// Without populate(): `author` is just the id.
const findPost = (id) => Post.findById(id);

// With populate(): Mongoose runs a second query and replaces the id with the user document.
// The second argument chooses which user fields to bring back.
const findPostWithAuthor = (id) => Post.findById(id).populate('author', 'name email');

const findPostsByAuthor = (authorId) => Post.find({ author: authorId }).sort({ createdAt: 1 });

// The other direction: a user with all of their posts (uses the virtual defined on the User model).
const findUserWithPosts = (id) => User.findById(id).populate('posts');

module.exports = { createUser, createPost, findPost, findPostWithAuthor, findPostsByAuthor, findUserWithPosts };
