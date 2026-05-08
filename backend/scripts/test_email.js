const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testEmailService() {
    console.log('-------------------------------------------');
    console.log('📧 EMAIL SERVICE TEST SCRIPT');
    console.log('-------------------------------------------');
    
    const emailTo = process.env.SMTP_USER || 'kartalboy123@gmail.com';

    // 1. Test Resend
    if (process.env.RESEND_API_KEY) {
        console.log('🚀 Testing Resend...');
        const resend = new Resend(process.env.RESEND_API_KEY);
        try {
            const data = await resend.emails.send({
                from: process.env.EMAIL_FROM || 'Dokuz On <onboarding@resend.dev>',
                to: emailTo,
                subject: 'Dokuz On Resend Test',
                html: '<b>This is a test email via Resend.</b>'
            });
            console.log('✅ Resend Success:', data.id);
        } catch (error) {
            console.error('❌ Resend Failed:', error.message);
        }
    } else {
        console.log('ℹ️ Resend API Key missing, skipping Resend test.');
    }

    console.log('\n-------------------------------------------');

    // 2. Test SMTP
    console.log('📡 Testing SMTP...');
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '465'),
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
        await transporter.verify();
        console.log('✅ SMTP Connection verified!');
        
        const info = await transporter.sendMail({
            from: `"SMTP Test" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: emailTo,
            subject: 'Dokuz On SMTP Test',
            text: 'Test via SMTP'
        });
        console.log('✅ SMTP Email sent:', info.messageId);
    } catch (error) {
        console.error('❌ SMTP Failed:', error.message);
    }
}

testEmailService();
