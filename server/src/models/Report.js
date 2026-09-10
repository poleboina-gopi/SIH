import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  scan_id: { type: String, required: true, ref: 'Scan' },
  report_number: { type: String, required: true, unique: true },
  product_id: { type: String },
  status: { type: String, enum: ['COMPLIANT', 'NON_COMPLIANT', 'BORDERLINE'], default: 'BORDERLINE' },
  score: { type: Number, default: 0 },
  inspector_id: { type: String },
  inspector_name: { type: String, default: 'Food Safety Officer' },
  generated_at: { type: Date, default: Date.now },
  rule_checks_matrix: { type: Array, default: [] },
  rule_checks_summary: { type: mongoose.Schema.Types.Mixed, default: {} },
  statutory_notice: { type: mongoose.Schema.Types.Mixed, default: null }
}, { strict: false });

export const ReportModel = mongoose.models.Report || mongoose.model('Report', ReportSchema);
