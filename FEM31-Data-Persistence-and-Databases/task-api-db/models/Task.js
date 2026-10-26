// The "M" in MVC: the Task schema and model. The schema describes what a task document must look like;
// Mongoose checks it before saving and drops any field that is not listed here.
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
  },
  {
    timestamps: true, // adds createdAt (when the task was created) and updatedAt, kept up to date by Mongoose
    toJSON: {
      versionKey: false, // hide __v
      transform(doc, ret) {
        // MongoDB's primary key is _id (an ObjectId). The API exposes it as a plain string called id.
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

// Listing and filtering by completed is a common query, so index it.
taskSchema.index({ completed: 1 });

module.exports = mongoose.model('Task', taskSchema);
