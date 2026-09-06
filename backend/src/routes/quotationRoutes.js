import express from 'express';
import Quotation from '../models/Quotation.js';
import Settings from '../models/Settings.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const escapeRegex = (str) => (str ? str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '');

// Apply protect middleware to ALL quotation routes
router.use(protect);

// GET all documents for logged-in user with search, status filter, and documentType filter
router.get('/', async (req, res) => {
  try {
    const { search, status, documentType, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    // Strict tenant isolation: always filter by authenticated user
    let query = { userId: req.user._id };

    if (search && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      query.$or = [
        { quotationNumber: { $regex: safeSearch, $options: 'i' } },
        { 'customer.name': { $regex: safeSearch, $options: 'i' } },
        { 'customer.mobile': { $regex: safeSearch, $options: 'i' } },
        { 'customer.email': { $regex: safeSearch, $options: 'i' } },
        { placeOfSupply: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (documentType && documentType !== 'All') {
      query.documentType = documentType;
    }

    const sortOption = { [sortBy]: order === 'asc' ? 1 : -1 };
    const documents = await Quotation.find(query).sort(sortOption);

    res.json({ success: true, count: documents.length, data: documents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET Billing & Payment Ledger across all invoices for logged-in user
router.get('/billing/ledger', async (req, res) => {
  try {
    const documents = await Quotation.find({
      userId: req.user._id,
      $or: [
        { 'payments.0': { $exists: true } },
        { documentType: 'Invoice' },
      ],
    }).sort({ updatedAt: -1 });

    const ledgerEntries = [];

    documents.forEach((doc) => {
      if (doc.payments && doc.payments.length > 0) {
        doc.payments.forEach((payment) => {
          ledgerEntries.push({
            paymentId: payment.paymentId,
            receiptNumber: payment.receiptNumber || `REC-${doc.quotationNumber.replace(/[^0-9]/g, '') || '01'}`,
            invoiceId: doc._id,
            invoiceNumber: doc.quotationNumber,
            documentType: doc.documentType || 'Invoice',
            customer: doc.customer,
            company: doc.company,
            paymentDate: payment.paymentDate,
            paymentMode: payment.paymentMode,
            referenceNo: payment.referenceNo,
            notes: payment.notes,
            amount: payment.amount,
            invoiceTotal: doc.summary?.grandTotal || 0,
            paidAmount: doc.paidAmount || 0,
            balanceDue: doc.balanceDue || 0,
            invoiceStatus: doc.status,
            recordedAt: payment.recordedAt,
          });
        });
      }
    });

    ledgerEntries.sort((a, b) => new Date(b.paymentDate || b.recordedAt) - new Date(a.paymentDate || a.recordedAt));

    res.json({
      success: true,
      count: ledgerEntries.length,
      data: ledgerEntries,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single document by ID (strictly belonging to user)
router.get('/:id', async (req, res) => {
  try {
    const document = await Quotation.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found or access denied' });
    }
    res.json({ success: true, data: document });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create document (Quotation / Invoice / Estimate / PO / Receipt)
router.post('/', async (req, res) => {
  try {
    const docData = req.body;

    if (!docData.quotationNumber || !docData.customer?.name) {
      return res.status(400).json({
        success: false,
        message: 'Document Number and Customer Name are required',
      });
    }

    const docType = docData.documentType || 'Quotation';
    const grandTotal = docData.summary?.grandTotal || 0;
    const paidAmount = (docData.payments && docData.payments.length > 0)
      ? docData.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
      : (parseFloat(docData.paidAmount) || 0);
    const balanceDue = (docData.balanceDue !== undefined && docData.balanceDue !== null)
      ? parseFloat(docData.balanceDue)
      : Math.max(0, Math.round((grandTotal - paidAmount) * 100) / 100);
    
    // Explicitly bind to authenticated user
    const newDoc = await Quotation.create({
      ...docData,
      paidAmount,
      balanceDue,
      userId: req.user._id,
    });

    // Auto increment counter in user's specific settings
    const settings = await Settings.findOne({ userId: req.user._id });
    if (settings) {
      if (docType === 'Invoice') settings.nextInvoiceNumber += 1;
      else if (docType === 'Estimate') settings.nextEstimateNumber += 1;
      else if (docType === 'Proforma Invoice') settings.nextProformaNumber += 1;
      else if (docType === 'Purchase Order') settings.nextPoNumber += 1;
      else if (docType === 'Receipt') settings.nextReceiptNumber += 1;
      else settings.nextQuotationNumber += 1;

      await settings.save();
    }

    res.status(201).json({
      success: true,
      data: newDoc,
      message: `${docType} created and saved successfully!`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update document (strictly belonging to user)
router.put('/:id', async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.summary?.grandTotal !== undefined) {
      const grandTotal = updateData.summary.grandTotal || 0;
      const paidAmount = (updateData.payments && updateData.payments.length > 0)
        ? updateData.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
        : (parseFloat(updateData.paidAmount) || 0);
      updateData.paidAmount = paidAmount;
      if (updateData.balanceDue === undefined || updateData.balanceDue === null) {
        updateData.balanceDue = Math.max(0, Math.round((grandTotal - paidAmount) * 100) / 100);
      }
    }

    const updated = await Quotation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { ...updateData, userId: req.user._id },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Document not found or access denied' });
    }

    res.json({
      success: true,
      data: updated,
      message: `${updated.documentType || 'Document'} updated successfully!`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH update status (strictly belonging to user)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const updated = await Quotation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Document not found or access denied' });
    }

    res.json({
      success: true,
      data: updated,
      message: 'Status updated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Record Payment against an invoice/document
router.post('/:id/payments', async (req, res) => {
  try {
    const { amount, paymentDate, paymentMode = 'UPI', referenceNo = '', notes = '' } = req.body;
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }

    const document = await Quotation.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found or access denied' });
    }

    const grandTotal = document.summary?.grandTotal || 0;
    const currentPaid = (document.payments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const newPaid = Math.round((currentPaid + numAmount) * 100) / 100;
    const newBalance = Math.max(0, Math.round((grandTotal - newPaid) * 100) / 100);

    const paymentEntry = {
      paymentId: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      amount: numAmount,
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      paymentMode,
      referenceNo,
      notes,
      recordedAt: new Date(),
    };

    if (!document.payments) {
      document.payments = [];
    }
    document.payments.push(paymentEntry);
    document.paidAmount = newPaid;
    document.balanceDue = newBalance;

    // Auto update status based on balance and due date
    if (newBalance <= 0) {
      document.status = 'Paid';
    } else if (newPaid > 0) {
      document.status = 'Partial';
    }

    await document.save();

    res.status(201).json({
      success: true,
      data: document,
      payment: paymentEntry,
      message: `Payment of ₹${numAmount} recorded successfully!`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE Remove a recorded payment
router.delete('/:id/payments/:paymentId', async (req, res) => {
  try {
    const document = await Quotation.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found or access denied' });
    }

    const prevPayments = document.payments || [];
    const updatedPayments = prevPayments.filter((p) => p.paymentId !== req.params.paymentId);

    if (prevPayments.length === updatedPayments.length) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const grandTotal = document.summary?.grandTotal || 0;
    const newPaid = updatedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const newBalance = Math.max(0, Math.round((grandTotal - newPaid) * 100) / 100);

    document.payments = updatedPayments;
    document.paidAmount = newPaid;
    document.balanceDue = newBalance;

    if (newBalance <= 0 && grandTotal > 0) {
      document.status = 'Paid';
    } else if (newPaid > 0) {
      document.status = 'Partial';
    } else {
      document.status = 'Unpaid';
    }

    await document.save();

    res.json({
      success: true,
      data: document,
      message: 'Payment record removed successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Convert Quotation -> Tax Invoice (scoped to user)
router.post('/:id/convert-to-invoice', async (req, res) => {
  try {
    const original = await Quotation.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!original) {
      return res.status(404).json({ success: false, message: 'Original document not found or access denied' });
    }

    const settings = await Settings.findOne({ userId: req.user._id });
    const nextInvNum = settings?.nextInvoiceNumber || 1001;
    const invPrefix = settings?.invoicePrefix || 'INV-';
    const year = new Date().getFullYear();
    const newInvoiceNumber = `${invPrefix}${year}-${String(nextInvNum).padStart(4, '0')}`;

    const invoiceObj = original.toObject();
    delete invoiceObj._id;
    delete invoiceObj.createdAt;
    delete invoiceObj.updatedAt;

    invoiceObj.userId = req.user._id;
    invoiceObj.documentType = 'Invoice';
    invoiceObj.quotationNumber = newInvoiceNumber;
    invoiceObj.status = 'Unpaid';
    invoiceObj.notes = `Converted from Quotation #${original.quotationNumber}`;

    const newInvoice = await Quotation.create(invoiceObj);

    if (settings) {
      settings.nextInvoiceNumber += 1;
      await settings.save();
    }

    res.status(201).json({
      success: true,
      data: newInvoice,
      message: `Quotation #${original.quotationNumber} successfully converted to Invoice #${newInvoiceNumber}!`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST Duplicate document (scoped to user)
router.post('/:id/duplicate', async (req, res) => {
  try {
    const original = await Quotation.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!original) {
      return res.status(404).json({ success: false, message: 'Document not found or access denied' });
    }

    const docType = original.documentType || 'Quotation';
    const settings = await Settings.findOne({ userId: req.user._id });
    let nextNum = 1001;
    let prefix = 'QT-';

    if (docType === 'Invoice') {
      nextNum = settings?.nextInvoiceNumber || 1001;
      prefix = settings?.invoicePrefix || 'INV-';
    } else if (docType === 'Estimate') {
      nextNum = settings?.nextEstimateNumber || 1001;
      prefix = settings?.estimatePrefix || 'EST-';
    } else if (docType === 'Proforma Invoice') {
      nextNum = settings?.nextProformaNumber || 1001;
      prefix = settings?.proformaPrefix || 'PI-';
    } else if (docType === 'Purchase Order') {
      nextNum = settings?.nextPoNumber || 1001;
      prefix = settings?.poPrefix || 'PO-';
    } else if (docType === 'Receipt') {
      nextNum = settings?.nextReceiptNumber || 1001;
      prefix = settings?.receiptPrefix || 'REC-';
    } else {
      nextNum = settings?.nextQuotationNumber || 1001;
      prefix = settings?.quotationPrefix || 'QT-';
    }

    const year = new Date().getFullYear();
    const newDocNumber = `${prefix}${year}-${String(nextNum).padStart(4, '0')}`;

    const docObj = original.toObject();
    delete docObj._id;
    delete docObj.createdAt;
    delete docObj.updatedAt;

    docObj.userId = req.user._id;
    docObj.quotationNumber = newDocNumber;
    docObj.status = 'Draft';

    const duplicated = await Quotation.create(docObj);

    if (settings) {
      if (docType === 'Invoice') settings.nextInvoiceNumber += 1;
      else if (docType === 'Estimate') settings.nextEstimateNumber += 1;
      else if (docType === 'Proforma Invoice') settings.nextProformaNumber += 1;
      else if (docType === 'Purchase Order') settings.nextPoNumber += 1;
      else if (docType === 'Receipt') settings.nextReceiptNumber += 1;
      else settings.nextQuotationNumber += 1;
      await settings.save();
    }

    res.status(201).json({
      success: true,
      data: duplicated,
      message: `${docType} duplicated successfully as ${newDocNumber}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE document (strictly belonging to user)
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Quotation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Document not found or access denied' });
    }

    res.json({ success: true, message: `${deleted.documentType || 'Document'} deleted successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
