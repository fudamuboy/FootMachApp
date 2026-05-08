const nodemailer = require('nodemailer');
const dns = require('dns');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: String(process.env.SMTP_SECURE) === 'true', 
    family: 4, // Force IPv4 to avoid ENETUNREACH on Render
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // Adding timeouts to prevent hanging on Render
    connectionTimeout: 10000, // 10s
    greetingTimeout: 10000,   // 10s
    socketTimeout: 20000,     // 20s
});

// Verify IPv4 resolution for debugging on Render
dns.lookup(process.env.SMTP_HOST || 'smtp.gmail.com', { family: 4 }, (err, address) => {
    console.log(`[SMTP DNS IPv4] Resolved ${process.env.SMTP_HOST || 'smtp.gmail.com'} to:`, err ? `Error: ${err.message}` : address);
});

// Log SMTP configuration on initialization (safe)
console.log('[SMTP] Transporter initialized:', {
    host: process.env.SMTP_HOST || 'smtp.gmail.com (fallback)',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: String(process.env.SMTP_SECURE) === 'true',
    userExists: !!process.env.SMTP_USER,
    passExists: !!process.env.SMTP_PASS,
    from: process.env.SMTP_FROM
});

const sendResetEmail = async (email, code) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('❌ [MAILER] SMTP_USER or SMTP_PASS is not configured');
        const error = new Error('SMTP_NOT_CONFIGURED');
        error.code = 'SMTP_NOT_CONFIGURED';
        throw error;
    }

    const mailOptions = {
        from: `"Dokuz On Support" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject: 'Votre code de réinitialisation - Dokuz On',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
                <h2 style="color: #4CAF50; text-align: center;">Réinitialisation de mot de passe</h2>
                <p>Bonjour,</p>
                <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Dokuz On.</p>
                <p>Voici votre code de vérification à 6 chiffres :</p>
                <div style="margin: 30px 0; text-align: center;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1A1A1A; background-color: #f5f5f5; padding: 12px 24px; border-radius: 8px; border: 1px dashed #4CAF50;">
                        ${code}
                    </span>
                </div>
                <p>Ce code est valable pendant 10 minutes. Ne le partagez avec personne.</p>
                <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #999; text-align: center;">L'équipe Dokuz On</p>
            </div>
        `,
    };

    try {
        console.log(`[MAILER] Attempting to send OTP to: ${email}`);
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ [MAILER] Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ [MAILER] Error sending reset email:', {
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response,
            stack: error.stack
        });
        throw error;
    }
};

module.exports = { sendResetEmail };
