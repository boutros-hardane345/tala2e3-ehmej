import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  dob: { type: String, default: '' },
  age: { type: mongoose.Schema.Types.Mixed, default: '' },
  bloodType: { type: String, default: 'غير معروف' },
  role: { type: String, default: 'عضو' },
  promise: { type: String, default: 'نعم' },
  knights: { type: String, default: 'لا' },
  costume: { type: String, default: 'نعم' },
  commitment: { type: String, default: 'عالٍ' },
  working: { type: String, default: 'نعم' },
}, { timestamps: true });

export default mongoose.models.Member || mongoose.model('Member', memberSchema);
