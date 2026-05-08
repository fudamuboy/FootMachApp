const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testSMTP() {
    console.log('-------------------------------------------');
    console.log('📡 SMTP TEST SCRIPT (Port 587)');
    console.log('-------------------------------------------');
    
    const emailTo = process.env.SMTP_USER || 'kartalboy123@gmail.com';

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: String(process.env.SMTP_SECURE) === 'true',
        family: 4,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
    });

    try {
        console.log('🔍 Verifying SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP Connection verified!');
        
        console.log(`📧 Sending test email to ${emailTo}...`);
        const info = await transporter.sendMail({
            from: `"Dokuz On Test" <${process.env.SMTP_USER}>`,
            to: emailTo,
            subject: 'Dokuz On SMTP Test',
            text: 'Test via SMTP Port 587'
        });
        console.log('✅ SMTP Email sent:', info.messageId);
    } catch (error) {
        console.error('❌ SMTP Failed:', error.message);
        console.error('Full Error:', error);
    }
}

testSMTP();
