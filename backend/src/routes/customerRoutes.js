import express from 'express';
import Customer from '../models/Customer.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const escapeRegex = (str) => (str ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '');

// Protect all customer routes
router.use(protect);

// GET all customers belonging to logged in user with optional search
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = { userId: req.user._id };

    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { mobile: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
        { billingAddress: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(query).sort({ updatedAt: -1 });
    res.json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single customer by ID (strictly user's customer)
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found or access denied' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create customer for logged in user
router.post('/', async (req, res) => {
  try {
    const { name, mobile, email, billingAddress, gstin, pan, placeOfSupply, placeOfSupplyCode } = req.body;
    if (!name || !mobile || !billingAddress) {
      return res.status(400).json({ success: false, message: 'Name, Mobile, and Billing Address are required' });
    }

    const customer = await Customer.create({
      userId: req.user._id,
      name: name.trim(),
      mobile: mobile.trim(),
      email: email ? email.trim() : '',
      billingAddress: billingAddress.trim(),
      gstin: gstin ? gstin.trim().toUpperCase() : '',
      pan: pan ? pan.trim().toUpperCase() : '',
      placeOfSupply: placeOfSupply || 'Maharashtra',
      placeOfSupplyCode: placeOfSupplyCode || '27',
    });

    res.status(201).json({ success: true, data: customer, message: 'Customer added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update customer (strictly user's customer)
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { ...req.body, userId: req.user._id },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found or access denied' });
    }

    res.json({ success: true, data: customer, message: 'Customer updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE customer (strictly user's customer)
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found or access denied' });
    }

    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
