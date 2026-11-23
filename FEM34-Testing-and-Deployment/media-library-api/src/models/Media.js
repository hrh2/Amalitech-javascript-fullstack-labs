const mongoose = require('mongoose');
const { CATEGORIES } = require('../config/constants');

const mediaSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },
    tags: { type: [String], default: [] },
    category: { type: String, enum: CATEGORIES, default: 'other' },
    // File information, filled in from the upload (never from the request body)
    filePath: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true, min: 0 },
  },
  { timestamps: true } // createdAt / updatedAt
);

mediaSchema.index({ title: 'text' }); // powers ?search= (MongoDB full-text search)
mediaSchema.index({ category: 1, createdAt: -1 }); // the common "filter by category, newest first"
mediaSchema.index({ tags: 1 });

// Send "id" instead of "_id" / "__v"
mediaSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Media', mediaSchema);
