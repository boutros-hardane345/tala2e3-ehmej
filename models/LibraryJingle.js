import mongoose from 'mongoose';

const libraryJingleSchema = new mongoose.Schema({
  year: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  audioUrl: { type: String, default: '' },
}, { timestamps: true });

libraryJingleSchema.index({ year: -1, createdAt: -1 });

export default mongoose.models.LibraryJingle || mongoose.model('LibraryJingle', libraryJingleSchema);
