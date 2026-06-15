const nodemailer = require('nodemailer');

// For testing with ethereal.email (fake email service)
let transporter = null;

const getTransporter = async () => {
    if (!transporter) {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
        console.log('✅ Email service configured');
        console.log(`📧 Test email account: ${testAccount.user}`);
        console.log(`🔗 Preview emails at: https://ethereal.email/messages`);
    }
    return transporter;
};

const sendEmail = async (to, subject, htmlContent) => {
    try {
        const transporter = await getTransporter();
        
        const mailOptions = {
            from: '"Marketplace Notifications" <noreply@marketplace.com>',
            to: to,
            subject: subject,
            html: htmlContent
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Email sent:', info.messageId);
        console.log('🔗 Preview URL:', nodemailer.getTestMessageUrl(info));
        
        return { success: true, previewUrl: nodemailer.getTestMessageUrl(info) };
    } catch (error) {
        console.error('❌ Email error:', error.message);
        return { success: false, error: error.message };
    }
};

module.exports = { sendEmail };