const nodemailer = require('nodemailer');

let transporter;

const getTransporter = async () => {
  if (transporter) return transporter;

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (emailUser && emailPass) {
    console.log('[Mailer] Using SMTP with configured credentials');
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass, // App Password for Gmail
      },
    });
  } else {
    console.log('[Mailer] No Gmail credentials found in .env. Attempting Ethereal testing SMTP setup...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[Mailer] Ethereal SMTP account created: ${testAccount.user}`);
    } catch (err) {
      console.warn('[Mailer] Failed to create Ethereal SMTP account. Falling back to console logging.', err.message);
      transporter = {
        sendMail: async (options) => {
          console.log('\n==================================================');
          console.log(`[Mailer MOCK] TO: ${options.to}`);
          console.log(`[Mailer MOCK] SUBJECT: ${options.subject}`);
          console.log(`[Mailer MOCK] BODY:\n${options.text || options.html}`);
          console.log('==================================================\n');
          return { messageId: 'mock-id' };
        }
      };
    }
  }
  return transporter;
};

const sendMail = async (to, subject, text, html) => {
  try {
    const tx = await getTransporter();
    const info = await tx.sendMail({
      from: process.env.EMAIL_USER || '"Epitome Platform" <noreply@epitomerestaurant.com>',
      to,
      subject,
      text,
      html,
    });
    console.log(`[Mailer] Email dispatched: ${info.messageId}`);
    
    // Log preview URL if using ethereal email
    if (tx.options && tx.options.host === 'smtp.ethereal.email') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[Mailer] Ethereal Email Preview URL: ${previewUrl}`);
    }
    return info;
  } catch (error) {
    console.error(`[Mailer] Dispatch Error: ${error.message}`);
    // Log to console so registration isn't blocked during testing
    console.log('\n==================================================');
    console.log(`[Mailer FAILSAFE LOG] TO: ${to}`);
    console.log(`[Mailer FAILSAFE LOG] SUBJECT: ${subject}`);
    console.log(`[Mailer FAILSAFE LOG] BODY: ${text || html}`);
    console.log('==================================================\n');
    return { messageId: 'failsafe-id' };
  }
};

module.exports = { sendMail };
