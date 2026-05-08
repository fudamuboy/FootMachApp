const nodemailer = require('nodemailer');
const dns = require('dns');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function diagnose() {
    console.log('-------------------------------------------');
    console.log('🔍 GMAIL SMTP DIAGNOSTIC (RENDER vs LOCAL)');
    console.log('-------------------------------------------');
    
    console.log('📍 Current Environment:', process.env.NODE_ENV || 'development');
    console.log('📍 SMTP_HOST:', process.env.SMTP_HOST || 'smtp.gmail.com');
    console.log('📍 SMTP_PORT:', process.env.SMTP_PORT || '587 (default)');
    console.log('📍 SMTP_USER:', process.env.SMTP_USER ? 'Set (masked)' : 'NOT SET');
    
    // 1. DNS Lookup
    console.log('\n📡 Step 1: DNS Lookup...');
    try {
        const address = await new Promise((resolve, reject) => {
            dns.lookup(process.env.SMTP_HOST || 'smtp.gmail.com', { family: 4 }, (err, addr) => {
                if (err) reject(err); else resolve(addr);
            });
        });
        console.log('✅ DNS (IPv4) resolved to:', address);
    } catch (err) {
        console.error('❌ DNS Lookup failed:', err.message);
    }

    // 2. Test Port 465 (Old Method)
    console.log('\n📡 Step 2: Testing Port 465 (SSL)...');
    await testConnection(465, true);

    // 3. Test Port 587 (New Method - STARTTLS)
    console.log('\n📡 Step 3: Testing Port 587 (STARTTLS)...');
    await testConnection(587, false);
}

async function testConnection(port, secure) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: port,
        secure: secure,
        family: 4,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
    });

    try {
        console.log(`⏳ Connecting to ${port} (secure: ${secure})...`);
        const start = Date.now();
        await transporter.verify();
        const duration = Date.now() - start;
        console.log(`✅ Success! Connection verified in ${duration}ms`);
        
        // Optional: Send test mail
        /*
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: process.env.SMTP_USER,
            subject: `Test SMTP Port ${port}`,
            text: 'Diagnostic test'
        });
        */
    } catch (err) {
        console.error(`❌ Failed on port ${port}:`, err.message);
        if (err.code === 'ETIMEDOUT') console.log('   (Possible firewall or provider block)');
        if (err.code === 'ENETUNREACH') console.log('   (Network unreachable - IPv6 issue?)');
    }
}

diagnose();
