const nodemailer = require('nodemailer');
const dns = require('dns');
const { Resend } = require('resend');

// 1. Resend Config (Primary for Production/Render)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// 2. SMTP Config (Fallback for Local Dev)
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

// Diagnostics
if (resend) {
    console.log('🚀 [MAILER] Resend initialized as primary email service.');
} else {
    console.log('📡 [MAILER] Resend API key missing. Falling back to SMTP.');
    dns.lookup(process.env.SMTP_HOST || 'smtp.gmail.com', { family: 4 }, (err, address) => {
        console.log(`[SMTP DNS IPv4] Resolved ${process.env.SMTP_HOST || 'smtp.gmail.com'} to:`, err ? `Error: ${err.message}` : address);
    });
}

const sendResetEmail = async (email, code) => {
    const subject = 'Votre code de réinitialisation - Dokuz On';
    const html = `
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
    `;

    // Try Resend First if configured
    if (resend) {
        try {
            console.log(`[MAILER] Attempting to send OTP via Resend to: ${email}`);
            const data = await resend.emails.send({
                from: process.env.EMAIL_FROM || 'Dokuz On <onboarding@resend.dev>',
                to: email,
                subject: subject,
                html: html,
            });
            console.log('✅ [MAILER] Resend OTP sent successfully:', data.id);
            return data;
        } catch (error) {
            console.error('❌ [MAILER] Resend Error:', error.message);
            // Fallback to SMTP if Resend fails in some way (optional)
        }
    }

    // Fallback to SMTP (or primary for Local Dev)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('❌ [MAILER] No email service configured (Resend or SMTP)');
        const error = new Error('EMAIL_SERVICE_NOT_CONFIGURED');
        error.code = 'EMAIL_SERVICE_NOT_CONFIGURED';
        throw error;
    }

    const mailOptions = {
        from: `"Dokuz On Support" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject: subject,
        html: html,
    };

    try {
        console.log(`[MAILER] Attempting to send OTP via SMTP to: ${email}`);
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ [MAILER] SMTP Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ [MAILER] SMTP Error:', error.message);
        throw error;
    }
};

module.exports = { sendResetEmail };
