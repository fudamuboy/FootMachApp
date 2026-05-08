const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testBrevo() {
    console.log('-------------------------------------------');
    console.log('📡 BREVO SMTP TEST SCRIPT');
    console.log('-------------------------------------------');
    
    const emailTo = process.env.SMTP_USER || 'votre-email@test.com';

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE) === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
    });

    try {
        console.log(`🔍 Testing connection to ${process.env.SMTP_HOST || 'smtp-relay.brevo.com'}...`);
        await transporter.verify();
        console.log('✅ Connection successful!');
        
        console.log(`📧 Sending test email to ${emailTo}...`);
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || `"Dokuz On Test" <${process.env.SMTP_USER}>`,
            to: emailTo,
            subject: 'Dokuz On - Brevo Test',
            text: 'Ceci est un test SMTP via Brevo.'
        });
        console.log('✅ Email sent:', info.messageId);
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testBrevo();
