import express from 'express';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const escapeRegex = (str) => (str ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '');

// Protect all product catalog routes
router.use(protect);

// GET all products belonging to logged in user with optional search and category
router.get('/', async (req, res) => {
  try {
    const { search, category, type } = req.query;
    let query = { userId: req.user._id };

    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
        { hsnSac: { $regex: safeSearch, $options: 'i' } },
        { sku: { $regex: safeSearch, $options: 'i' } },
        { category: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (type && type !== 'All') {
      query.type = type;
    }

    const products = await Product.find(query).sort({ name: 1 });
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single product by ID (strictly user's product)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or access denied' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create product for logged in user
router.post('/', async (req, res) => {
  try {
    const { name, type, sku, description, hsnSac, rate, unit, gstRate, category, stock } = req.body;
    if (!name || rate === undefined) {
      return res.status(400).json({ success: false, message: 'Product name and rate are required' });
    }

    const product = await Product.create({
      userId: req.user._id,
      name: name.trim(),
      type: type || 'Product',
      sku: sku ? sku.trim() : '',
      description: description ? description.trim() : '',
      hsnSac: hsnSac ? hsnSac.trim() : '',
      rate: Number(rate) || 0,
      unit: unit || 'Nos',
      gstRate: Number(gstRate) || 18,
      category: category || 'General',
      stock: Number(stock) || 0,
    });

    res.status(201).json({ success: true, data: product, message: 'Item added to catalog successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update product (strictly user's product)
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { ...req.body, userId: req.user._id },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or access denied' });
    }

    res.json({ success: true, data: product, message: 'Item updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE product (strictly user's product)
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or access denied' });
    }

    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
