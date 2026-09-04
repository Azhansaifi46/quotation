import crypto from 'crypto';
import nodemailer from 'nodemailer';

/**
 * Generate a cryptographically secure 6-digit numeric OTP
 */
export function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hash an OTP using SHA-256 with a salt
 */
export function hashOTP(otp) {
  const salt = process.env.OTP_SECRET || 'qoutpro_otp_secure_salt_key_2026';
  return crypto.createHmac('sha256', salt).update(otp.toString().trim()).digest('hex');
}

/**
 * Verify OTP against stored hash using constant-time comparison to prevent timing attacks
 */
export function verifyOTPHash(enteredOtp, storedHash) {
  if (!enteredOtp || !storedHash) return false;
  try {
    const enteredHash = hashOTP(enteredOtp);
    const enteredBuffer = Buffer.from(enteredHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');
    
    if (enteredBuffer.length !== storedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(enteredBuffer, storedBuffer);
  } catch (err) {
    return false;
  }
}

/**
 * Check if real SMTP email sending is configured
 */
export function isSMTPConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

/**
 * Check if real SMS sending is configured (Fast2SMS or Twilio)
 */
export function isSMSConfigured() {
  return Boolean(process.env.FAST2SMS_API_KEY || (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN));
}

/**
 * Dispatch OTP notification (Email / SMS / Console)
 */
export async function sendOTPNotification({ toEmail, toPhone, userName, otp, purpose = 'Verification' }) {
  const timestamp = new Date().toLocaleTimeString();
  
  // 1. Always log prominently to terminal for dev/admin visibility
  console.log('\n' + '='.repeat(60));
  console.log(`🔐 [SECURE OTP DISPATCH] ${purpose.toUpperCase()}`);
  console.log(`👤 User: ${userName || 'Valued User'} (${toEmail} | ${toPhone || 'N/A'})`);
  console.log(`🔑 6-Digit OTP Code: >>> ${otp} <<<`);
  console.log(`⏱️  Valid for: 10 minutes | Dispatched at: ${timestamp}`);
  if (!isSMTPConfigured()) {
    console.log('💡 Note: To deliver to real inbox, set SMTP_USER and SMTP_PASS in backend/.env');
  }
  console.log('='.repeat(60) + '\n');

  let emailSent = false;
  let smsSent = false;

  // 2. Real Email Dispatch via Nodemailer (Gmail, Brevo, Resend, Custom SMTP)
  if (isSMTPConfigured()) {
    try {
      const isGmail = (process.env.SMTP_HOST || '').includes('gmail') || (process.env.SMTP_USER || '').includes('@gmail.com');
      
      const transporter = nodemailer.createTransport(
        isGmail && !process.env.SMTP_HOST
          ? {
              service: 'gmail',
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS, // 16-character App Password
              },
            }
          : {
              host: process.env.SMTP_HOST || 'smtp.gmail.com',
              port: Number(process.env.SMTP_PORT) || 587,
              secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            }
      );

      await transporter.sendMail({
        from: `"${process.env.APP_NAME || 'BillPro SaaS'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `${otp} is your ${purpose} code for ${process.env.APP_NAME || 'BillPro'}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: auto; padding: 32px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #6d28d9; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">BillPro SaaS</h2>
              <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Multi-Business Quotation & Invoicing Suite</p>
            </div>
            
            <p style="color: #1e293b; font-size: 15px; line-height: 1.5;">Hello <strong>${userName || 'User'}</strong>,</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.5;">Your one-time verification code for <strong>${purpose}</strong> is:</p>
            
            <div style="background: #f8fafc; border: 2px dashed #cbd5e1; padding: 20px; border-radius: 12px; text-align: center; margin: 24px 0;">
              <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1e1b4b; font-family: monospace;">${otp}</span>
            </div>
            
            <p style="color: #64748b; font-size: 13px; margin: 0 0 16px 0;">⏱️ This code will expire in <strong>10 minutes</strong>. Never share this code with anyone.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">If you did not request this verification code, please ignore this email.</p>
          </div>
        `,
      });
      emailSent = true;
      console.log(`📧 [EMAIL SENT] Successfully delivered to ${toEmail}`);
    } catch (emailErr) {
      console.error('⚠️ [EMAIL DISPATCH ERROR]:', emailErr.message);
    }
  }

  // 3. Real SMS Dispatch via Fast2SMS (Indian Numbers) or Twilio
  if (toPhone) {
    if (process.env.FAST2SMS_API_KEY) {
      try {
        const cleanNumber = toPhone.replace(/\D/g, '').slice(-10); // 10 digit Indian number
        const fast2smsUrl = `https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&variables_values=${otp}&route=otp&numbers=${cleanNumber}`;
        const response = await fetch(fast2smsUrl);
        const data = await response.json();
        if (data.return) {
          smsSent = true;
          console.log(`📱 [SMS SENT via Fast2SMS] Delivered to ${cleanNumber}`);
        }
      } catch (smsErr) {
        console.warn('⚠️ [SMS FAST2SMS WARNING]:', smsErr.message);
      }
    } else if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
        const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
        const params = new URLSearchParams();
        params.append('To', toPhone.startsWith('+') ? toPhone : `+91${toPhone}`);
        params.append('From', process.env.TWILIO_PHONE_NUMBER);
        params.append('Body', `Your ${process.env.APP_NAME || 'BillPro'} verification code is: ${otp}. Valid for 10 minutes.`);
        
        await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });
        smsSent = true;
        console.log(`📱 [SMS SENT via Twilio] Delivered to ${toPhone}`);
      } catch (smsErr) {
        console.warn('⚠️ [SMS TWILIO WARNING]:', smsErr.message);
      }
    }
  }

  return { success: true, timestamp, emailSent, smsSent };
}

