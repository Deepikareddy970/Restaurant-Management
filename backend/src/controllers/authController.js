const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { sendMail } = require('../utils/mailer');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REMEMBER_ME_EXPIRY = '30d';

const generateTokens = (user, rememberMe = false) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'epitome_secret_jwt_key_123',
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET || 'epitome_refresh_jwt_key_456',
    { expiresIn: rememberMe ? REMEMBER_ME_EXPIRY : REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

const verifyGoogleToken = async (idToken) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    console.log('[Google Auth] GOOGLE_CLIENT_ID is not configured in .env. Parsing token in development mode.');
    try {
      const parts = idToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        return {
          email: payload.email,
          name: payload.name || payload.email.split('@')[0],
          googleId: payload.sub || 'google-simulated-id',
        };
      }
    } catch (e) {
      console.error('[Google Auth] Error parsing development Google token payload:', e.message);
    }
    return {
      email: 'google.guest@epitome.com',
      name: 'Google Guest User',
      googleId: 'google-guest-123456',
    };
  }

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  return {
    email: payload.email,
    name: payload.name,
    googleId: payload.sub,
  };
};

// 1. Email Register
const register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Please provide name, email and password.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create 6-digit OTP
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'CUSTOMER',
      status: 'ACTIVE',
    });

    // Send verification email
    const subject = 'Welcome to DineFlow';

    const text = `Hello ${name},

    Welcome to DineFlow.

  Your account has been created successfully.

You can now login using your email and password.
`;

    const html = `
  <div style="font-family: Arial, sans-serif; padding:20px;">
  <h2>Welcome to DineFlow</h2>
  <p>Hello <b>${name}</b>,</p>
  <p>Your account has been created successfully.</p>
  <p>You can now login using your email and password.</p>
</div>
`;

    await sendMail(email, subject, text, html);

    // Log action
    await AuditLog.create({
      userId: newUser._id,
      action: 'USER_REGISTER',
      details: `Registered account for ${email} with status ACTIVE`,
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful. You can now login.',
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// 2. Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.status === 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Account is already verified.' });
    }

    if (!user.otpCode || user.otpCode !== otpCode || new Date() > user.otpExpiresAt) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code.' });
    }

    // Activate user
    user.status = 'ACTIVE';
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    await AuditLog.create({
      userId: user._id,
      action: 'OTP_VERIFICATION',
      details: 'Account successfully verified and activated',
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now login.',
    });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during OTP verification.' });
  }
};

// 3. Email Login
const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }



    if (user.status === 'BLOCKED') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const { accessToken, refreshToken } = generateTokens(user, rememberMe);

    // Save refresh token in user document
    user.refreshToken = refreshToken;
    await user.save();

    await AuditLog.create({
      userId: user._id,
      action: 'USER_LOGIN',
      details: `Logged in using Email${rememberMe ? ' (Remember Me)' : ''}`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// 4. Google OAuth Login
const googleLogin = async (req, res) => {
  try {
    const { idToken, rememberMe } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: 'ID Token from Google is required.' });
    }

    const { email, name, googleId } = await verifyGoogleToken(idToken);

    let user = await User.findOne({ email });

    if (user) {
      if (user.status === 'BLOCKED') {
        return res.status(403).json({ success: false, message: 'Your account has been suspended.' });
      }

      // Link googleId if not already present
      if (!user.googleId) {
        user.googleId = googleId;
        user.status = 'ACTIVE'; // Auto-verify on Google login
      }
    } else {
      // Create user if not registered yet
      user = new User({
        email,
        name,
        googleId,
        role: 'CUSTOMER', // Default role for external OAuth
        status: 'ACTIVE', // Automatically verified through Google
      });
    }

    const { accessToken, refreshToken } = generateTokens(user, rememberMe);
    user.refreshToken = refreshToken;
    await user.save();

    await AuditLog.create({
      userId: user._id,
      action: 'GOOGLE_LOGIN',
      details: 'Logged in using Google OAuth',
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Google login successful.',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
      },
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to authenticate Google user.' });
  }
};

// 5. Refresh Token
const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token is required.' });
    }

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || 'epitome_refresh_jwt_key_456');
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Invalid or revoked refresh token.' });
    }

    if (user.status === 'BLOCKED') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended.' });
    }

    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error('Refresh Token Error:', error);
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
};

// 6. Logout
const logout = async (req, res) => {
  try {
    const { token } = req.body;
    if (token) {
      const user = await User.findOne({ refreshToken: token });
      if (user) {
        user.refreshToken = undefined;
        await user.save();

        await AuditLog.create({
          userId: user._id,
          action: 'USER_LOGOUT',
          details: 'User logged out and invalidated session',
          ipAddress: req.ip,
        });
      }
    }
    return res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during logout.' });
  }
};

// 7. Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide email.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return 200 to prevent user enumeration attacks in production
      return res.status(200).json({ success: true, message: 'If email exists in our records, an OTP has been sent.' });
    }

    // Reuse OTP fields for reset password request
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = otpCode;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    const subject = 'Epitome Platform - Reset Password Request';
    const text = `Hi ${user.name},\n\nWe received a password reset request. Use the following 6-digit OTP code to verify and reset your password:\n\n${otpCode}\n\nThis code expires in 10 minutes.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #6366f1; text-align: center;">Password Reset Request</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>We received a request to reset your password. Please copy the OTP below to complete the verification:</p>
        <div style="font-size: 24px; font-weight: bold; text-align: center; color: #6366f1; letter-spacing: 4px; padding: 15px; background-color: #f5f3ff; border-radius: 6px; margin: 20px 0;">
          ${otpCode}
        </div>
        <p style="font-size: 12px; color: #64748b;">This OTP code will expire in 10 minutes. If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `;

    await sendMail(email, subject, text, html);

    await AuditLog.create({
      userId: user._id,
      action: 'FORGOT_PASSWORD_REQUEST',
      details: 'Initiated password reset OTP',
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Reset password OTP sent to email.',
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during forgot password.' });
  }
};

// 8. Reset Password
const resetPassword = async (req, res) => {
  try {
    const { email, otpCode, newPassword } = req.body;

    if (!email || !otpCode || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!user.otpCode || user.otpCode !== otpCode || new Date() > user.otpExpiresAt) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset OTP.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear OTP fields & revoke sessions
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    user.refreshToken = undefined;
    await user.save();

    await AuditLog.create({
      userId: user._id,
      action: 'RESET_PASSWORD_SUCCESS',
      details: 'Password was successfully reset using OTP code',
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login.',
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({ success: false, message: 'Server error during password reset.' });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
};
