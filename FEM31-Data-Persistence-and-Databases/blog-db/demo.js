// npm start: the challenge script.
//   1. connect (db.js)  2. create a User  3. create a Post linked to that user  4. find the Post and .populate('author')
// It first EMPTIES the users and posts collections of the demo database (blog_demo by default), so it can be re-run.
try {
  process.loadEnvFile();
} catch {
  /* no .env file */
}

const { connect, disconnect, getUri } = require('./db');
const User = require('./models/User');
const Post = require('./models/Post');
const blog = require('./blog');

const show = (label, value) => console.log(`\n${label}\n${JSON.stringify(value, null, 2)}`);

async function main() {
  await connect();
  console.log(`Connected to ${getUri()}`);

  await Promise.all([User.deleteMany({}), Post.deleteMany({})]);
  await Promise.all([User.init(), Post.init()]); // make sure the unique/other indexes exist

  const user = await blog.createUser({ name: 'Amina Yusuf', email: 'Amina@Example.com' });
  show('1. Created user (note: the email was lower-cased by the schema)', user);

  const post = await blog.createPost({
    title: 'Why I like Mongoose',
    content: 'Schemas give my flexible documents some structure.',
    authorId: user._id,
  });
  show('2. Created post. `author` holds only the user\'s id:', post);

  const plain = await blog.findPost(post._id);
  show('3a. Found the post WITHOUT populate: author is still just an id', plain);

  const populated = await blog.findPostWithAuthor(post._id);
  show("3b. Found the post WITH .populate('author'): the user's details come along", populated);

  await blog.createPost({ title: 'A second post', content: 'More words.', authorId: user._id });
  const withPosts = await blog.findUserWithPosts(user._id);
  show("4. Bonus: the other direction, a user with their posts (virtual populate)", {
    name: withPosts.name,
    posts: withPosts.posts.map((p) => p.title),
  });

  await disconnect();
}

main().catch(async (error) => {
  console.error(`Failed: ${error.message}`);
  if (error.name === 'MongooseServerSelectionError') console.error('Is mongod running? Start it or set MONGODB_URI.');
  await disconnect().catch(() => {});
  process.exit(1);
});
