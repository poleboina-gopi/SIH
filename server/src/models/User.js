import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['inspector', 'admin'], default: 'inspector' },
  designation: { type: String, default: 'Legal Metrology Officer' },
  badgeNumber: { type: String },
  department: { type: String, default: 'Directorate of Legal Metrology' },
  createdAt: { type: Date, default: Date.now }
});

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
