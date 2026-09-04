import express from 'express';
import Settings from '../models/Settings.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protect all settings / business profile routes
router.use(protect);

// GET settings / Business Profile for logged-in user
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user._id });
    if (!settings) {
      settings = await Settings.create({
        userId: req.user._id,
        companyName: `${req.user.name} Enterprise`,
        ownerName: req.user.name,
        email: req.user.email,
        mobile: req.user.phone,
        businessCategory: 'Services',
        tagline: 'Professional Quotation & Billing Solutions',
      });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update Business Profile / Settings for logged-in user
router.put('/', async (req, res) => {
  try {
    let settings = await Settings.findOneAndUpdate(
      { userId: req.user._id },
      { ...req.body, userId: req.user._id },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );
    res.json({ success: true, data: settings, message: 'Business Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET next document number by documentType for logged-in user
router.get('/next-number', async (req, res) => {
  try {
    const { type = 'Quotation' } = req.query;
    let settings = await Settings.findOne({ userId: req.user._id });
    if (!settings) {
      settings = await Settings.create({
        userId: req.user._id,
        companyName: `${req.user.name} Enterprise`,
        ownerName: req.user.name,
        email: req.user.email,
        mobile: req.user.phone,
      });
    }

    let prefix = settings.quotationPrefix || 'QT-';
    let currentNum = settings.nextQuotationNumber || 1001;

    if (type === 'Invoice') {
      prefix = settings.invoicePrefix || 'INV-';
      currentNum = settings.nextInvoiceNumber || 1001;
    } else if (type === 'Estimate') {
      prefix = settings.estimatePrefix || 'EST-';
      currentNum = settings.nextEstimateNumber || 1001;
    } else if (type === 'Proforma Invoice') {
      prefix = settings.proformaPrefix || 'PI-';
      currentNum = settings.nextProformaNumber || 1001;
    } else if (type === 'Purchase Order') {
      prefix = settings.poPrefix || 'PO-';
      currentNum = settings.nextPoNumber || 1001;
    } else if (type === 'Receipt') {
      prefix = settings.receiptPrefix || 'REC-';
      currentNum = settings.nextReceiptNumber || 1001;
    }

    const year = new Date().getFullYear();
    const documentNumber = `${prefix}${year}-${String(currentNum).padStart(4, '0')}`;

    res.json({
      success: true,
      documentNumber,
      quotationNumber: documentNumber,
      nextNumber: currentNum,
      prefix,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Backwards compatibility endpoint
router.get('/next-quotation-number', async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user._id });
    if (!settings) {
      settings = await Settings.create({
        userId: req.user._id,
        companyName: `${req.user.name} Enterprise`,
        ownerName: req.user.name,
        email: req.user.email,
        mobile: req.user.phone,
      });
    }
    const currentNum = settings.nextQuotationNumber || 1001;
    const prefix = settings.quotationPrefix || 'QT-';
    const quotationNumber = `${prefix}${new Date().getFullYear()}-${String(currentNum).padStart(4, '0')}`;
    res.json({ success: true, quotationNumber, nextNumber: currentNum });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
