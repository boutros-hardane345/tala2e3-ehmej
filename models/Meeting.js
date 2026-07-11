import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  present: { type: Boolean, default: false },
}, { _id: false });

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, default: '' },
  attendance: [attendanceSchema],
}, { timestamps: true });

export default mongoose.models.Meeting || mongoose.model('Meeting', meetingSchema);
