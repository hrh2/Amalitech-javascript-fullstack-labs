const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'name is required'], trim: true, maxlength: 100 },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true, // a unique index: two users cannot share an email
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'email must be a valid email address'],
    },
    // The bcrypt HASH of the password, never the password itself (the lab calls this field "password").
    // select: false keeps it out of every query result unless a query asks for it with .select('+password').
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.password; // belt and braces: never serialised, even if it was selected
        return ret;
      },
    },
  },
);

module.exports = mongoose.model('User', userSchema);
