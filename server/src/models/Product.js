import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  product_name: { type: String, required: true },
  brand: { type: String, default: 'Unbranded / Local' },
  category: { type: String, default: 'General Packaged Commodity' },
  image_url: { type: String },
  uploaded_by: { type: String },
  created_at: { type: Date, default: Date.now }
});

export const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);
