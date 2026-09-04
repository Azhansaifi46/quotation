import express from 'express';
import Quotation from '../models/Quotation.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Protect dashboard routes
router.use(protect);

router.get('/stats', async (req, res) => {
  try {
    const userQuery = { userId: req.user._id };

    const totalDocuments = await Quotation.countDocuments(userQuery);
    const totalQuotations = await Quotation.countDocuments({
      ...userQuery,
      $or: [{ documentType: 'Quotation' }, { documentType: { $exists: false } }],
    });
    const totalInvoices = await Quotation.countDocuments({ ...userQuery, documentType: 'Invoice' });
    const totalEstimates = await Quotation.countDocuments({ ...userQuery, documentType: 'Estimate' });
    const totalCustomers = await Customer.countDocuments(userQuery);
    const totalProducts = await Product.countDocuments(userQuery);

    const allDocs = await Quotation.find(userQuery, 'documentType summary.grandTotal status createdAt');

    const totalValue = allDocs.reduce(
      (sum, q) => sum + (q.summary?.grandTotal || 0),
      0
    );

    const invoiceRevenue = allDocs
      .filter((q) => q.documentType === 'Invoice' && (q.status === 'Paid' || q.status === 'Approved'))
      .reduce((sum, q) => sum + (q.summary?.grandTotal || 0), 0);

    const statusCounts = {
      Draft: 0,
      Sent: 0,
      Approved: 0,
      Paid: 0,
      Partial: 0,
      Overdue: 0,
      Rejected: 0,
      Expired: 0,
    };

    allDocs.forEach((q) => {
      if (statusCounts[q.status] !== undefined) {
        statusCounts[q.status]++;
      }
    });

    const recentDocuments = await Quotation.find(userQuery)
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({
      success: true,
      data: {
        totalDocuments,
        totalQuotations,
        totalInvoices,
        totalEstimates,
        totalCustomers,
        totalProducts,
        totalValue,
        invoiceRevenue,
        statusCounts,
        recentQuotations: recentDocuments,
        recentDocuments,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
