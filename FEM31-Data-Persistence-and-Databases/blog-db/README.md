# blog-db (FEM31 hands-on challenge: the "Blog" database)

A data layer for a blog with **Mongoose**: users, posts, a reference between them, and `.populate('author')`.

## Run it

```bash
npm install
npm start    # needs MongoDB on 127.0.0.1:27017 (or set MONGODB_URI)
npm test     # 12 tests against a separate database, blog_test (dropped afterwards)
```

`npm start` **empties the users and posts collections of the demo database `blog_demo`** and then: creates a user,
creates a post linked to that user, finds the post without `populate` (author is just an id) and with
`.populate('author')` (author is the user's details), and finally loads a user with all their posts.

## Files

```
db.js            the connection (the challenge's "db.js")
models/User.js   name, email (required, unique, lower-cased, format-checked); virtual `posts`
models/Post.js   title, content, author: ObjectId with ref 'User'
blog.js          the create/find functions (including the populate queries)
demo.js          the script the challenge asks for (prints every step)
test/            automated tests
```

Notes: `../notes/FEM31-Data-Persistence-with-MongoDB.md`.
