import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Product', 'Service'],
      default: 'Product',
    },
    sku: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    hsnSac: {
      type: String,
      default: '',
      trim: true,
    },
    rate: {
      type: Number,
      required: true,
      default: 0,
    },
    unit: {
      type: String,
      default: 'Nos',
      trim: true,
    },
    gstRate: {
      type: Number,
      default: 18,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);
