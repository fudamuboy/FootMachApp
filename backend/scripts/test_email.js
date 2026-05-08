const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testEmail() {
    console.log('-------------------------------------------');
    console.log('📧 FINAL EMAIL SERVICE TEST');
    console.log('-------------------------------------------');
    
    const emailTo = process.env.SMTP_USER || 'votre-email@test.com';

    // 1. Test Resend
    if (process.env.RESEND_API_KEY) {
        console.log('🚀 Testing Resend...');
        const resend = new Resend(process.env.RESEND_API_KEY);
        try {
            const data = await resend.emails.send({
                from: process.env.EMAIL_FROM || 'Dokuz On <onboarding@resend.dev>',
                to: emailTo,
                subject: 'Dokuz On - Resend Test',
                html: '<b>Ceci est un test via Resend API.</b>'
            });
            console.log('✅ Resend Success:', data.id);
        } catch (error) {
            console.error('❌ Resend Failed:', error.message);
        }
    } else {
        console.log('ℹ️ Resend API Key missing, skipping Resend test.');
    }

    console.log('\n-------------------------------------------');

    // 2. Test SMTP Fallback
    console.log('📡 Testing SMTP Fallback...');
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE) === "true",
        family: 4,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        await transporter.verify();
        console.log('✅ SMTP Connection verified!');
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || `"Dokuz On Test" <${process.env.SMTP_USER}>`,
            to: emailTo,
            subject: 'Dokuz On - SMTP Test',
            text: 'Test via SMTP'
        });
        console.log('✅ SMTP Email sent:', info.messageId);
    } catch (error) {
        console.error('❌ SMTP Failed:', error.message);
    }
}

testEmail();
