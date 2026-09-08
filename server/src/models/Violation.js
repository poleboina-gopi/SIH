import mongoose from 'mongoose';

const ViolationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  scan_id: { type: String, required: true, ref: 'Scan' },
  rule_code: { type: String, required: true },
  rule_id: { type: String },
  violation_type: { type: String, required: true },
  severity: { type: String, enum: ['CRITICAL', 'MAJOR', 'MINOR'], default: 'MAJOR' },
  description: { type: String, required: true },
  statutory_provision: { type: String, required: true },
  suggested_action: { type: String },
  penalty_fine: { type: String, default: '₹25,000' },
  field: { type: String }
});

export const ViolationModel = mongoose.models.Violation || mongoose.model('Violation', ViolationSchema);
