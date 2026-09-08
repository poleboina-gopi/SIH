import mongoose from 'mongoose';

const ScanSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  product_id: { type: String, required: true, ref: 'Product' },
  extracted_text: { type: String, default: '' },
  parsed_fields: { type: mongoose.Schema.Types.Mixed, default: {} },
  compliance_status: { type: String, enum: ['COMPLIANT', 'NON_COMPLIANT', 'BORDERLINE'], default: 'BORDERLINE' },
  compliance_score: { type: Number, default: 0 },
  inspector_id: { type: String },
  created_at: { type: Date, default: Date.now }
});

export const ScanModel = mongoose.models.Scan || mongoose.model('Scan', ScanSchema);
