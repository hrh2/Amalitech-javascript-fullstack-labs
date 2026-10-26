// A SEPARATE database: the tests delete everything, so they must never touch blog_demo.
process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/blog_test';

const { test, describe, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { connect, disconnect, getUri } = require('../db');
const User = require('../models/User');
const Post = require('../models/Post');
const blog = require('../blog');

if (!new URL(getUri()).pathname.slice(1).endsWith('_test')) {
  throw new Error('Refusing to run: the test database name must end with "_test".');
}

before(async () => {
  await connect();
  await Promise.all([User.init(), Post.init()]);
});
beforeEach(() => Promise.all([User.deleteMany({}), Post.deleteMany({})]));
after(async () => {
  await mongoose.connection.dropDatabase();
  await disconnect();
});

// assert.rejects wants the check function to return exactly true.
const hasError = (path) => (e) => {
  assert.equal(e.name, 'ValidationError');
  assert.ok(e.errors[path], `expected a validation error for "${path}"`);
  return true;
};

const amina = () => blog.createUser({ name: 'Amina', email: 'amina@example.com' });

describe('User', () => {
  test('is saved with a generated ObjectId, a trimmed name and a lower-cased email', async () => {
    const user = await blog.createUser({ name: '  Amina  ', email: ' Amina@Example.COM ' });
    assert.ok(mongoose.isValidObjectId(user._id));
    assert.equal(user.name, 'Amina');
    assert.equal(user.email, 'amina@example.com');
  });

  test('requires a name and a valid-looking email', async () => {
    await assert.rejects(blog.createUser({ email: 'a@b.co' }), hasError('name'));
    await assert.rejects(blog.createUser({ name: 'A' }), hasError('email'));
    await assert.rejects(blog.createUser({ name: 'A', email: 'not-an-email' }), (e) => {
      assert.match(e.errors.email.message, /name@example\.com/);
      return true;
    });
  });

  test('two users cannot share an email (unique index, error code 11000), even with different capitals', async () => {
    await amina();
    await assert.rejects(blog.createUser({ name: 'Other', email: 'AMINA@example.com' }), { code: 11000 });
    assert.equal(await User.countDocuments(), 1);
  });
});

describe('Post', () => {
  test('stores the author as the user\'s _id (an ObjectId), not a copy of the user', async () => {
    const user = await amina();
    const post = await blog.createPost({ title: 'T', content: 'C', authorId: user._id });
    assert.ok(post.author instanceof mongoose.Types.ObjectId);
    assert.ok(post.author.equals(user._id));
    const raw = await mongoose.connection.collection('posts').findOne({ _id: post._id });
    assert.equal(raw.author._bsontype, 'ObjectId'); // a reference (an id) in the database, not an embedded user document
    assert.ok(raw.author.equals(user._id));
  });

  test('requires title, content and author', async () => {
    const user = await amina();
    await assert.rejects(blog.createPost({ content: 'C', authorId: user._id }), hasError('title'));
    await assert.rejects(blog.createPost({ title: 'T', authorId: user._id }), hasError('content'));
    await assert.rejects(blog.createPost({ title: 'T', content: 'C' }), hasError('author'));
  });

  test('rejects an author that is not a valid ObjectId (CastError inside a ValidationError)', async () => {
    await assert.rejects(blog.createPost({ title: 'T', content: 'C', authorId: 'not-an-id' }), hasError('author'));
  });

  test('has createdAt and updatedAt timestamps', async () => {
    const user = await amina();
    const post = await blog.createPost({ title: 'T', content: 'C', authorId: user._id });
    assert.ok(post.createdAt instanceof Date && post.updatedAt instanceof Date);
  });
});

describe('populate', () => {
  test('without populate the author is only an id; with populate the user\'s details are loaded', async () => {
    const user = await amina();
    const { _id } = await blog.createPost({ title: 'T', content: 'C', authorId: user._id });

    const plain = await blog.findPost(_id);
    assert.ok(plain.author instanceof mongoose.Types.ObjectId);
    assert.equal(plain.author.name, undefined);

    const populated = await blog.findPostWithAuthor(_id);
    assert.equal(populated.author.name, 'Amina');
    assert.equal(populated.author.email, 'amina@example.com');
    assert.ok(populated.author._id.equals(user._id));
  });

  test('the second argument of populate selects which user fields come back', async () => {
    const user = await amina();
    const { _id } = await blog.createPost({ title: 'T', content: 'C', authorId: user._id });
    const populated = (await blog.findPostWithAuthor(_id)).toObject();
    assert.deepEqual(Object.keys(populated.author).filter((k) => k !== 'id').sort(), ['_id', 'email', 'name']); // no __v; `id` is just the virtual
  });

  test('if the author has since been deleted, populate gives null instead of throwing', async () => {
    const user = await amina();
    const { _id } = await blog.createPost({ title: 'T', content: 'C', authorId: user._id });
    await User.deleteOne({ _id: user._id });
    assert.equal((await blog.findPostWithAuthor(_id)).author, null);
  });

  test('finds all posts of one author, oldest first, and none of another author\'s', async () => {
    const a = await amina();
    const b = await blog.createUser({ name: 'Bola', email: 'bola@example.com' });
    await blog.createPost({ title: 'A1', content: 'x', authorId: a._id });
    await blog.createPost({ title: 'B1', content: 'x', authorId: b._id });
    await blog.createPost({ title: 'A2', content: 'x', authorId: a._id });
    assert.deepEqual((await blog.findPostsByAuthor(a._id)).map((p) => p.title), ['A1', 'A2']);
  });

  test('virtual populate: a user with all of their posts', async () => {
    const user = await amina();
    await blog.createPost({ title: 'One', content: 'x', authorId: user._id });
    await blog.createPost({ title: 'Two', content: 'x', authorId: user._id });
    const withPosts = await blog.findUserWithPosts(user._id);
    assert.deepEqual(withPosts.posts.map((p) => p.title).sort(), ['One', 'Two']);
    // the user document in the database does not contain the posts
    const raw = await mongoose.connection.collection('users').findOne({ _id: user._id });
    assert.equal(raw.posts, undefined);
  });
});
