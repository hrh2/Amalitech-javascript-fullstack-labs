const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
      minlength: [1, 'title must not be empty'],
      maxlength: [200, 'title must be at most 200 characters'],
    },
    completed: { type: Boolean, default: false },
    // Who owns the task. Set by the server from the logged-in user, never from the request body.
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true, // createdAt / updatedAt
    toJSON: {
      versionKey: false,
      transform(doc, ret) {
        ret.id = ret._id.toString();
        ret.owner = ret.owner.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

taskSchema.index({ owner: 1, completed: 1 });

module.exports = mongoose.model('Task', taskSchema);
