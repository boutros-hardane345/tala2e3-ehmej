import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  date: { type: String, default: '' },
  time: { type: String, default: '' },
  type: { type: String, enum: ['upcoming', 'past_activity'], default: 'upcoming' },
  imageUrl: { type: String, default: '' },
  month: { type: String, default: '' },
  year: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Event || mongoose.model('Event', eventSchema);
