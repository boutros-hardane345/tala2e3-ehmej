import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  photo: { type: String, default: '' },
}, { _id: false });

const monthlyActivitySchema = new mongoose.Schema({
  year: { type: String, required: true },
  month: { type: String, required: true },
  monthName: { type: String, default: '' },
  scheduleImage: { type: String, default: '' },
  meetings: [meetingSchema],
}, { timestamps: true });

monthlyActivitySchema.index({ year: 1, month: 1 }, { unique: true });

export default mongoose.models.MonthlyActivity || mongoose.model('MonthlyActivity', monthlyActivitySchema);
