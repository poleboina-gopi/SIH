import mongoose from 'mongoose';

const RuleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  ruleCode: { type: String, required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  severity: { type: String, enum: ['CRITICAL', 'MAJOR', 'MINOR'], default: 'MAJOR' },
  penaltySection: { type: String, required: true },
  fineRange: { type: String, required: true },
  isActive: { type: Boolean, default: true }
});

export const RuleModel = mongoose.models.Rule || mongoose.model('Rule', RuleSchema);
