import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Function to send OTP to Admin/Master Email
export const sendLoginOTP = async (user, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.MASTER_EMAIL,
            subject: `Login OTP Request - ${user.username}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Login OTP Request</h2>
                    <p>A user is attempting to login:</p>
                    <ul>
                        <li><strong>Username:</strong> ${user.username}</li>
                        <li><strong>Role:</strong> ${user.role}</li>
                        <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
                    </ul>
                    <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin: 0; color: #333;">OTP Code:</h3>
                        <p style="font-size: 24px; font-weight: bold; color: #007bff; margin: 10px 0;">${otp}</p>
                        <p style="font-size: 12px; color: #666;">Valid for 5 minutes.</p>
                    </div>
                    <p>Please share this OTP with the user to allow access.</p>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`📧 OTP sent to Master Email (${process.env.MASTER_EMAIL}) for user ${user.username}`);
        return { success: true, messageId: result.messageId };

    } catch (error) {
        console.error('❌ Error sending OTP email:', error);
        throw error;
    }
};
