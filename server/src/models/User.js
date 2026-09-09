import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true }, // bcrypt salted hash
  role: { type: String, enum: ['inspector', 'admin'], default: 'inspector' },
  designation: { type: String, default: 'Legal Metrology Officer' },
  badgeNumber: { type: String },
  department: { type: String, default: 'Directorate of Legal Metrology' },
  createdAt: { type: Date, default: Date.now }
});

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
