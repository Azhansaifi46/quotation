import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import Quotation from '../models/Quotation.js';
import { protect } from '../middleware/auth.js';
import { generateOTP, hashOTP, verifyOTPHash, sendOTPNotification } from '../utils/otpService.js';

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'qoutpro_production_jwt_secret_key_2026_secure',
    { expiresIn: '30d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user account & dispatch verification OTP
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, mobile number, and password are required',
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and Confirm Password do not match',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanPhone = phone.trim();

    // Check if verified user already exists
    let existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: cleanPhone }],
    });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email or mobile number already exists. Please sign in.',
      });
    }

    // Generate secure 6-digit OTP
    const otp = generateOTP();
    const hashed = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user;
    if (existingUser && !existingUser.isVerified) {
      // Re-use and update unverified registration
      existingUser.name = name.trim();
      existingUser.email = normalizedEmail;
      existingUser.phone = cleanPhone;
      existingUser.password = password;
      existingUser.otpHash = hashed;
      existingUser.otpExpiresAt = expiresAt;
      existingUser.otpAttempts = 0;
      existingUser.otpLastSentAt = new Date();
      existingUser.otpPurpose = 'signup';
      user = await existingUser.save();
    } else {
      // Create new unverified user
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        phone: cleanPhone,
        password,
        isVerified: false,
        otpHash: hashed,
        otpExpiresAt: expiresAt,
        otpAttempts: 0,
        otpLastSentAt: new Date(),
        otpPurpose: 'signup',
      });
    }

    // Send OTP notification
    const dispatchResult = await sendOTPNotification({
      toEmail: user.email,
      toPhone: user.phone,
      userName: user.name,
      otp,
      purpose: 'Account Registration Verification',
    });

    res.status(201).json({
      success: true,
      requiresOtp: true,
      email: user.email,
      phone: user.phone,
      message: dispatchResult.emailSent
        ? `A 6-digit verification code has been emailed to ${user.email}`
        : `A 6-digit verification code has been dispatched. (Check console or auto-fill below)`,
      devOtp: (!dispatchResult.emailSent && !dispatchResult.smsSent) ? otp : undefined,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/verify-signup-otp
// @desc    Verify OTP for account activation and issue session token
// @access  Public
router.post('/verify-signup-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and 6-digit verification code are required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select(
      '+otpHash +otpExpiresAt +otpAttempts +otpPurpose'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    if (user.isVerified) {
      const token = generateToken(user._id);
      return res.json({
        success: true,
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          designation: user.designation,
        },
        message: 'Account is already verified. Signed in successfully!',
      });
    }

    // Check attempt limit
    if (user.otpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please click "Resend Code" to get a fresh OTP.',
      });
    }

    // Check expiration
    if (!user.otpExpiresAt || Date.now() > new Date(user.otpExpiresAt).getTime()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please click "Resend Code".',
      });
    }

    // Verify OTP Hash
    const isValid = verifyOTPHash(otp, user.otpHash);
    if (!isValid) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      const remaining = Math.max(0, 5 - user.otpAttempts);
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      });
    }

    // Activate user
    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    user.otpPurpose = undefined;
    await user.save();

    // Initialize clean Settings profile for user if not exists
    await Settings.findOneAndUpdate(
      { userId: user._id },
      {
        $setOnInsert: {
          userId: user._id,
          companyName: `${user.name} Enterprise`,
          ownerName: user.name,
          email: user.email,
          mobile: user.phone,
          businessCategory: 'Services',
          tagline: 'Professional Quotation & Billing Solutions',
        },
      },
      { upsert: true, new: true }
    );

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        designation: user.designation,
      },
      message: 'Account verified and activated successfully! Welcome to BillPro.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Validate credentials and dispatch 2-Factor OTP
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/mobile and password',
      });
    }

    const identifier = email.toLowerCase().trim();

    // Check by email or phone
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    }).select('+password +otpLastSentAt');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your details and try again.',
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your details and try again.',
      });
    }

    // Generate 2FA OTP
    const otp = generateOTP();
    const hashed = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.otpHash = hashed;
    user.otpExpiresAt = expiresAt;
    user.otpAttempts = 0;
    user.otpLastSentAt = new Date();
    user.otpPurpose = user.isVerified ? 'login' : 'signup';
    await user.save();

    // Dispatch OTP
    const dispatchResult = await sendOTPNotification({
      toEmail: user.email,
      toPhone: user.phone,
      userName: user.name,
      otp,
      purpose: user.isVerified ? '2-Factor Login' : 'Account Verification',
    });

    res.json({
      success: true,
      requiresOtp: true,
      isVerified: user.isVerified,
      email: user.email,
      phone: user.phone,
      message: dispatchResult.emailSent
        ? `A 6-digit verification code has been emailed to ${user.email}`
        : `A 6-digit verification code has been dispatched.`,
      devOtp: (!dispatchResult.emailSent && !dispatchResult.smsSent) ? otp : undefined,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/verify-login-otp
// @desc    Verify 2FA OTP & complete login session
// @access  Public
router.post('/verify-login-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select(
      '+otpHash +otpExpiresAt +otpAttempts +otpPurpose'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    // Check attempts
    if (user.otpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many incorrect attempts. Please click "Resend Code" for a new OTP.',
      });
    }

    // Check expiry
    if (!user.otpExpiresAt || Date.now() > new Date(user.otpExpiresAt).getTime()) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please click "Resend Code".',
      });
    }

    // Verify OTP
    const isValid = verifyOTPHash(otp, user.otpHash);
    if (!isValid) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      const remaining = Math.max(0, 5 - user.otpAttempts);
      return res.status(400).json({
        success: false,
        message: `Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      });
    }

    // Mark verified if not already
    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    user.otpPurpose = undefined;
    await user.save();

    // Ensure Settings record exists
    await Settings.findOneAndUpdate(
      { userId: user._id },
      {
        $setOnInsert: {
          userId: user._id,
          companyName: `${user.name} Enterprise`,
          ownerName: user.name,
          email: user.email,
          mobile: user.phone,
          businessCategory: 'Services',
        },
      },
      { upsert: true, new: true }
    );

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        designation: user.designation,
      },
      message: 'Authenticated successfully!',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend a fresh OTP with a 60-second cooldown limit
// @access  Public
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+otpLastSentAt +otpPurpose');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Account not found',
      });
    }

    // Enforce 60-second cooldown
    if (user.otpLastSentAt) {
      const elapsed = Date.now() - new Date(user.otpLastSentAt).getTime();
      if (elapsed < 60000) {
        const remainingSecs = Math.ceil((60000 - elapsed) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSecs}s before requesting a new code.`,
          cooldownRemaining: remainingSecs,
        });
      }
    }

    // Generate new OTP
    const otp = generateOTP();
    const hashed = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.otpHash = hashed;
    user.otpExpiresAt = expiresAt;
    user.otpAttempts = 0;
    user.otpLastSentAt = new Date();
    await user.save();

    // Send OTP
    const dispatchResult = await sendOTPNotification({
      toEmail: user.email,
      toPhone: user.phone,
      userName: user.name,
      otp,
      purpose: user.isVerified ? '2FA Login Verification' : 'Account Verification',
    });

    res.json({
      success: true,
      message: dispatchResult.emailSent
        ? `A fresh verification code has been emailed to ${user.email}`
        : `A fresh verification code has been dispatched.`,
      devOtp: (!dispatchResult.emailSent && !dispatchResult.smsSent) ? otp : undefined,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, email, phone, designation } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (phone) user.phone = phone.trim();
    if (designation) user.designation = designation.trim();

    const updatedUser = await user.save();

    res.json({
      success: true,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        designation: updatedUser.designation,
      },
      message: 'Profile updated successfully!',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match',
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully!',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/auth/demo-login
// @desc    Instantly authenticate into an isolated demo account with pre-seeded demo data
// @access  Public
router.post('/demo-login', async (req, res) => {
  try {
    const demoEmail = 'demo@billprosaas.com';
    let demoUser = await User.findOne({ email: demoEmail });

    if (!demoUser) {
      demoUser = await User.create({
        name: 'Demo Enterprise User',
        email: demoEmail,
        phone: '+91 99999 00000',
        password: 'DemoPassword123!',
        isVerified: true,
        role: 'admin',
        designation: 'Business Owner & Manager',
      });
    }

    // Ensure Settings record exists for demo user
    await Settings.findOneAndUpdate(
      { userId: demoUser._id },
      {
        $set: {
          companyName: 'Apex Electronics & Hardware Solutions',
          ownerName: 'Demo Enterprise User',
          email: 'demo@billprosaas.com',
          mobile: '+91 99999 00000',
          businessCategory: 'Electronics',
          tagline: 'Wholesale & Retail Electronics, Electricals & IT Hardware',
          gstin: '07AAAAA0000A1Z5',
          pan: 'AAAAA0000A',
          state: 'Delhi (07)',
          address: 'Plot 42, Tech Park, Okhla Phase III, New Delhi - 110020',
          bankDetails: {
            bankName: 'HDFC Bank',
            accountNumber: '50200012345678',
            ifscCode: 'HDFC0001234',
            branchName: 'Okhla Phase III',
            accountType: 'Current',
          },
          upiDetails: {
            upiId: 'apexelectronics@okhdfcbank',
            accountName: 'Apex Electronics & Hardware Solutions',
          },
          termsAndConditions: [
            '100% payment on delivery / installation verification.',
            'Standard replacement warranty: 1-Year on-site for hardware.',
            'GST invoice is mandatory for claiming warranty service.',
            'Quotation valid for 30 days from issuance date.',
          ],
        },
      },
      { upsert: true, new: true }
    );

    // Refresh demo documents if old solar ones exist or if 0
    await Quotation.deleteMany({ userId: demoUser._id });
    await Customer.deleteMany({ userId: demoUser._id });
    await Product.deleteMany({ userId: demoUser._id });

    // Demo Customer
    const demoCustomer = await Customer.create({
      userId: demoUser._id,
      name: 'Metro Infotech & Commercial Systems Pvt Ltd',
      mobile: '+91 98765 43210',
      email: 'contact@metroinfotech.in',
      billingAddress: 'Tower B, Cyber City, DLF Phase 2, Gurugram, Haryana - 122002',
      gstin: '07BBBBB1111B2Z6',
      pan: 'BBBBB1111B',
      placeOfSupply: 'Delhi',
      placeOfSupplyCode: '07',
    });

    // Demo Product
    await Product.create({
      userId: demoUser._id,
      name: 'Commercial Online UPS 10kVA (Dual Power)',
      type: 'Product',
      category: 'Electronics',
      hsnSac: '85044090',
      unit: 'Nos',
      rate: 65000,
      gstRate: 18,
      description: 'Heavy duty Online UPS with LCD display, DSP controller and SNMP smart monitoring card.',
    });

    // Demo Quotation
    const todayStr = new Date().toISOString().split('T')[0];
    await Quotation.create({
      userId: demoUser._id,
      documentType: 'Quotation',
      templateId: 'navy',
      quotationNumber: 'QT-DEMO-0001',
      quotationDate: todayStr,
      validUntil: '30 Days',
      placeOfSupply: 'Delhi',
      placeOfSupplyCode: '07',
      isInterState: false,
      status: 'Sent',
      customer: {
        id: demoCustomer._id.toString(),
        name: 'Metro Infotech & Commercial Systems Pvt Ltd',
        mobile: '+91 98765 43210',
        email: 'contact@metroinfotech.in',
        billingAddress: 'Tower B, Cyber City, DLF Phase 2, Gurugram, Haryana - 122002',
        gstin: '07BBBBB1111B2Z6',
        pan: 'BBBBB1111B',
      },
      company: {
        name: 'Apex Electronics & Hardware Solutions',
        ownerName: 'Demo Enterprise User',
        businessCategory: 'Electronics',
        tagline: 'Wholesale & Retail Electronics, Electricals & IT Hardware',
        address: 'Plot 42, Tech Park, Okhla Phase III, New Delhi - 110020',
        mobile: '+91 99999 00000',
        email: 'demo@billprosaas.com',
        gstin: '07AAAAA0000A1Z5',
        pan: 'AAAAA0000A',
      },
      items: [
        {
          itemIndex: 1,
          name: 'Commercial Online UPS 10kVA',
          description: '10kVA Online Double Conversion UPS System with SNMP Card',
          hsnSac: '85044090',
          rate: 65000,
          quantity: 1,
          unit: 'Nos',
          discountPercent: 0,
          discountAmount: 0,
          taxRate: 18,
          taxAmount: 11700,
          amount: 65000,
        },
        {
          itemIndex: 2,
          name: 'CAT6 24-Port Gigabit Network Switch',
          description: 'Managed Layer-2 Gigabit Ethernet Switch (PoE+ 370W)',
          hsnSac: '85176290',
          rate: 14500,
          quantity: 2,
          unit: 'Nos',
          discountPercent: 0,
          discountAmount: 0,
          taxRate: 18,
          taxAmount: 5220,
          amount: 29000,
        },
        {
          itemIndex: 3,
          name: 'Industrial Surge Protection Unit',
          description: '3-Phase Heavy Surge Suppression & PDU System',
          hsnSac: '85363000',
          rate: 6000,
          quantity: 3,
          unit: 'Nos',
          discountPercent: 0,
          discountAmount: 0,
          taxRate: 18,
          taxAmount: 3240,
          amount: 18000,
        },
      ],
      taxRows: [
        { type: 'CGST', rate: 9, taxableAmount: 112000, taxAmount: 10080, description: 'CGST @ 9%' },
        { type: 'SGST', rate: 9, taxableAmount: 112000, taxAmount: 10080, description: 'SGST @ 9%' },
      ],
      summary: {
        subtotal: 112000,
        totalDiscount: 0,
        totalTax: 20160,
        roundOff: 0,
        grandTotal: 132160,
        amountInWords: 'INR One Lakh Thirty-Two Thousand One Hundred Sixty Only',
      },
      paymentDetails: {
        bankName: 'HDFC Bank',
        accountNumber: '50200012345678',
        ifscCode: 'HDFC0001234',
        branchName: 'Okhla Phase III',
        upiId: 'apexelectronics@okhdfcbank',
      },
      terms: [
        '100% payment on delivery / installation verification.',
        'Standard replacement warranty: 1-Year on-site for hardware.',
        'GST invoice is mandatory for claiming warranty service.',
      ],
    });

    const token = generateToken(demoUser._id);

    res.json({
      success: true,
      token,
      user: {
        _id: demoUser._id,
        name: demoUser.name,
        email: demoUser.email,
        phone: demoUser.phone,
        role: demoUser.role,
        designation: demoUser.designation,
      },
      message: 'Logged into Demo Account successfully!',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

