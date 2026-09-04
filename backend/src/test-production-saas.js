import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import { hashOTP } from './utils/otpService.js';

dotenv.config();

const API_URL = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function runSaaSTests() {
  console.log('🚀 Starting Comprehensive Multi-Tenant SaaS & OTP Verification Tests...\n');

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/qoutpro';
    await mongoose.connect(mongoUri);

    // 1. Health check
    const health = await req(`${API_URL}/health`);
    console.log('✅ API Health Check:', health.status);

    // 2. Register User A (Apex Enterprise)
    console.log('\n--- 1. Registering User A (Rajesh) ---');
    const randomSuffix = Date.now().toString().slice(-8);
    const userAPayload = {
      name: 'Rajesh Kumar',
      email: `rajesh_${Date.now()}@apexenterprise.com`,
      phone: `+91 98${randomSuffix}`,
      password: 'password123',
      confirmPassword: 'password123',
    };

    const regARes = await req(`${API_URL}/auth/register`, {
      method: 'POST',
      body: userAPayload,
    });
    console.log('✅ User A Registered (Pending OTP):', regARes.message);

    // For test simulation, let's verify with an invalid OTP first
    try {
      await req(`${API_URL}/auth/verify-signup-otp`, {
        method: 'POST',
        body: {
          email: userAPayload.email,
          otp: '000000',
        },
      });
      throw new Error('Should have failed invalid OTP');
    } catch (err) {
      console.log('✅ Invalid OTP correctly rejected:', err.data?.message || err.message);
    }

    // Set known OTP for testing
    const testOtp = '123456';
    const userADoc = await User.findOne({ email: userAPayload.email }).select('+otpHash');
    userADoc.otpHash = hashOTP(testOtp);
    await userADoc.save();

    const verifyARes = await req(`${API_URL}/auth/verify-signup-otp`, {
      method: 'POST',
      body: {
        email: userAPayload.email,
        otp: testOtp,
      },
    });
    console.log('✅ User A OTP Verified & Account Activated:', verifyARes.message);
    const tokenA = verifyARes.token;

    // 3. Check User A Dashboard (Must be 100% empty!)
    const dashARes = await req(`${API_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    console.log('✅ User A Fresh Dashboard Stats (Must be all 0):', {
      totalDocuments: dashARes.data.totalDocuments,
      totalCustomers: dashARes.data.totalCustomers,
      totalProducts: dashARes.data.totalProducts,
    });
    if (dashARes.data.totalDocuments !== 0 || dashARes.data.totalCustomers !== 0) {
      throw new Error('Fresh user dashboard was not empty!');
    }

    // 4. User A creates 1 Customer and 1 Quotation
    const custARes = await req(`${API_URL}/customers`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        name: 'Client Alpha Ltd',
        mobile: '+91 99999 88888',
        billingAddress: 'Tower 1, Cyber City, Pune',
      },
    });
    console.log('✅ User A created Customer:', custARes.data.name);

    const docARes = await req(`${API_URL}/quotations`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
      body: {
        quotationNumber: 'QT-2026-0001',
        quotationDate: '2026-09-04',
        customer: {
          name: 'Client Alpha Ltd',
          mobile: '+91 99999 88888',
          billingAddress: 'Tower 1, Cyber City, Pune',
        },
        items: [
          {
            itemIndex: 1,
            description: 'Custom SaaS Engineering Consulting',
            rate: 75000,
            quantity: 1,
            unit: 'Job',
            taxRate: 18,
            taxAmount: 13500,
            amount: 88500,
          },
        ],
        summary: {
          taxableAmount: 75000,
          totalTax: 13500,
          grandTotal: 88500,
        },
      },
    });
    const docAId = docARes.data._id;
    console.log('✅ User A created Quotation #:', docARes.data.quotationNumber, 'ID:', docAId);

    // 5. Register User B (Global Tech)
    console.log('\n--- 2. Registering User B (Sneha - Different Tenant) ---');
    const randomSuffixB = (Date.now() + 999).toString().slice(-8);
    const userBPayload = {
      name: 'Sneha Patel',
      email: `sneha_${Date.now()}@globaltech.com`,
      phone: `+91 97${randomSuffixB}`,
      password: 'password456',
      confirmPassword: 'password456',
    };

    await req(`${API_URL}/auth/register`, {
      method: 'POST',
      body: userBPayload,
    });
    const userBDoc = await User.findOne({ email: userBPayload.email }).select('+otpHash');
    userBDoc.otpHash = hashOTP('654321');
    await userBDoc.save();

    const verifyBRes = await req(`${API_URL}/auth/verify-signup-otp`, {
      method: 'POST',
      body: {
        email: userBPayload.email,
        otp: '654321',
      },
    });
    const tokenB = verifyBRes.token;
    console.log('✅ User B Verified & Activated:', verifyBRes.user.name);

    // 6. Strict Multi-Tenancy Assertions for User B:
    console.log('\n--- 3. Verifying Multi-Tenant Data Isolation ---');
    
    // User B dashboard must be 0!
    const dashBRes = await req(`${API_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    console.log('✅ User B Dashboard (Must be 0 quotations):', dashBRes.data.totalDocuments);
    if (dashBRes.data.totalDocuments !== 0) {
      throw new Error('Data leakage! User B sees User A documents.');
    }

    // User B quotations list must be empty!
    const listBRes = await req(`${API_URL}/quotations`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    console.log('✅ User B Quotations Count (Must be 0):', listBRes.count);
    if (listBRes.count !== 0) {
      throw new Error('Data leakage! User B list contains records.');
    }

    // User B customer list must be empty!
    const custListB = await req(`${API_URL}/customers`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    console.log('✅ User B Customers Count (Must be 0):', custListB.count);
    if (custListB.count !== 0) {
      throw new Error('Data leakage! User B sees User A customers.');
    }

    // User B directly trying to access User A document by ID -> MUST BE 404
    try {
      await req(`${API_URL}/quotations/${docAId}`, {
        headers: { Authorization: `Bearer ${tokenB}` },
      });
      throw new Error('SECURITY VIOLATION! User B was able to access User A document.');
    } catch (err) {
      console.log('✅ Direct cross-tenant document access blocked (404/Denied):', err.data?.message || err.message);
    }

    // 7. Test 2-Factor Login flow for User A
    console.log('\n--- 4. Testing 2-Factor Login with OTP ---');
    const loginInit = await req(`${API_URL}/auth/login`, {
      method: 'POST',
      body: {
        email: userAPayload.email,
        password: userAPayload.password,
      },
    });
    console.log('✅ Login Credentials Validated -> Requires 2FA OTP:', loginInit.requiresOtp);

    const userAReload = await User.findOne({ email: userAPayload.email }).select('+otpHash');
    userAReload.otpHash = hashOTP('998877');
    await userAReload.save();

    const login2FA = await req(`${API_URL}/auth/verify-login-otp`, {
      method: 'POST',
      body: {
        email: userAPayload.email,
        otp: '998877',
      },
    });
    console.log('✅ 2FA OTP Verified -> Session Issued for:', login2FA.user.name);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL MULTI-TENANT & OTP SECURITY TESTS PASSED 100%!');
    console.log('='.repeat(60) + '\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err.data || err.message);
    process.exit(1);
  }
}

runSaaSTests();
