const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const mailOptions = {
        from: `"Finance Tracker" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Password Reset Request - Finance Tracker',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
                    <h1 style="color: white; margin: 0; text-align: center;">🔐 Password Reset</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
                    <p style="color: #374151; font-size: 16px;">Hi there,</p>
                    <p style="color: #374151; font-size: 16px;">
                        We received a request to reset your password for your Finance Tracker account.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); 
                                  color: white; 
                                  padding: 14px 28px; 
                                  text-decoration: none; 
                                  border-radius: 8px; 
                                  font-weight: bold;
                                  display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #6b7280; font-size: 14px;">
                        This link will expire in <strong>1 hour</strong>.
                    </p>
                    <p style="color: #6b7280; font-size: 14px;">
                        If you didn't request this password reset, please ignore this email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                        Finance Tracker - Manage your finances effortlessly
                    </p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
    }
};

// Verify email configuration
const verifyEmailConfig = async () => {
    try {
        await transporter.verify();
        console.log('✅ Email configuration verified');
        return true;
    } catch (error) {
        console.error('❌ Email configuration error:', error.message);
        return false;
    }
};

// Send bill reminder email
const sendBillReminderEmail = async (email, userName, bills) => {
    const billRows = bills.map(bill => {
        const dueDate = new Date(bill.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        const urgency = daysLeft === 0 ? '🔴 Due Today' : daysLeft === 1 ? '🟠 Tomorrow' : `🟢 ${daysLeft} days`;

        return `
            <tr>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: 600;">${bill.title}</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151;">₹${parseFloat(bill.amount).toLocaleString()}</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151;">${dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #374151;">${urgency}</td>
            </tr>
        `;
    }).join('');

    const totalAmount = bills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);

    const mailOptions = {
        from: `"Finance Tracker" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: `💰 Bill Reminder: ${bills.length} upcoming payment${bills.length > 1 ? 's' : ''} - Finance Tracker`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
                    <h1 style="color: white; margin: 0; text-align: center;">🔔 Bill Reminder</h1>
                </div>
                <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px;">
                    <p style="color: #374151; font-size: 16px;">Hi ${userName},</p>
                    <p style="color: #374151; font-size: 16px;">
                        You have <strong>${bills.length} upcoming bill${bills.length > 1 ? 's' : ''}</strong> that need your attention:
                    </p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <thead>
                            <tr style="background: #f3f4f6;">
                                <th style="padding: 12px 16px; text-align: left; color: #6b7280; font-size: 12px; text-transform: uppercase;">Bill</th>
                                <th style="padding: 12px 16px; text-align: left; color: #6b7280; font-size: 12px; text-transform: uppercase;">Amount</th>
                                <th style="padding: 12px 16px; text-align: left; color: #6b7280; font-size: 12px; text-transform: uppercase;">Due Date</th>
                                <th style="padding: 12px 16px; text-align: left; color: #6b7280; font-size: 12px; text-transform: uppercase;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${billRows}
                        </tbody>
                        <tfoot>
                            <tr style="background: #f3f4f6;">
                                <td style="padding: 12px 16px; font-weight: 700; color: #374151;">Total</td>
                                <td style="padding: 12px 16px; font-weight: 700; color: #6366f1;" colspan="3">₹${totalAmount.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>
                    <p style="color: #6b7280; font-size: 14px;">
                        Log in to your Finance Tracker to manage these payments.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                        Finance Tracker - Manage your finances effortlessly
                    </p>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return { success: true };
    } catch (error) {
        console.error('Bill reminder email error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { sendPasswordResetEmail, verifyEmailConfig, sendBillReminderEmail };
