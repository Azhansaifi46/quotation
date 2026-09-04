import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Quotation from './models/Quotation.js';
import Customer from './models/Customer.js';
import Product from './models/Product.js';
import Settings from './models/Settings.js';
import User from './models/User.js';

dotenv.config();

async function cleanDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/qoutpro';
  console.log(`Connecting to MongoDB at ${uri}...`);

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB.');

    // Remove all old sample/demo records
    const delQuotations = await Quotation.deleteMany({});
    const delCustomers = await Customer.deleteMany({});
    const delProducts = await Product.deleteMany({});
    const delSettings = await Settings.deleteMany({});
    const delUsers = await User.deleteMany({});

    console.log('\n' + '='.repeat(50));
    console.log('🧹 DATABASE PURGE & CLEANUP COMPLETE:');
    console.log(`- Quotations deleted: ${delQuotations.deletedCount}`);
    console.log(`- Customers deleted:  ${delCustomers.deletedCount}`);
    console.log(`- Products deleted:   ${delProducts.deletedCount}`);
    console.log(`- Settings deleted:   ${delSettings.deletedCount}`);
    console.log(`- Users deleted:      ${delUsers.deletedCount}`);
    console.log('='.repeat(50));
    console.log('✨ Production database is now 100% clean and ready for real multi-tenant registrations.\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error cleaning database:', err.message);
    process.exit(1);
  }
}

cleanDatabase();
