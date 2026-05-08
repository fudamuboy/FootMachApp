const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function testSMTP() {
    console.log('-------------------------------------------');
    console.log('📧 SMTP TEST SCRIPT');
    console.log('-------------------------------------------');
    
    const config = {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
    };

    console.log('⚙️ Configuration:', {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.auth.user,
        pass: config.auth.pass ? '********' : 'MISSING'
    });

    if (!config.auth.user || !config.auth.pass) {
        console.error('❌ Error: SMTP_USER or SMTP_PASS is missing in .env');
        process.exit(1);
    }

    const transporter = nodemailer.createTransport(config);

    console.log('⏳ Verifying connection...');
    try {
        await transporter.verify();
        console.log('✅ Connection verified successfully!');
    } catch (error) {
        console.error('❌ Connection verification failed:');
        console.error(error);
        process.exit(1);
    }

    const mailOptions = {
        from: `"SMTP Test" <${process.env.SMTP_FROM || config.auth.user}>`,
        to: config.auth.user, // Send to yourself
        subject: 'Dokuz On SMTP Test',
        text: 'This is a test email from Dokuz On backend diagnostic script.',
        html: '<b>This is a test email from Dokuz On backend diagnostic script.</b>',
    };

    console.log(`⏳ Sending test email to ${config.auth.user}...`);
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
    } catch (error) {
        console.error('❌ Error sending email:');
        console.error({
            name: error.name,
            code: error.code,
            command: error.command,
            response: error.response,
            responseCode: error.responseCode,
            message: error.message
        });
    }
}

testSMTP();
