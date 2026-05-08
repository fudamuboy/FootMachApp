const nodemailer = require('nodemailer');
const { Resend } = require('resend');

// Resend Initialization (Primary for Production)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// SMTP Fallback (For Local Dev)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE) === "true",
    family: 4, // Force IPv4 for local stability
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
});

// Startup Log
if (resend) {
    console.log('🚀 [MAILER] Resend initialized as primary service.');
} else {
    console.log('📡 [MAILER] SMTP fallback initialized (Resend API Key missing).');
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

    // 1. Try Resend (Production)
    if (resend) {
        try {
            console.log(`🚀 [MAILER] Sending OTP to ${email} via Resend...`);
            const response = await resend.emails.send({
                from: process.env.EMAIL_FROM || 'Dokuz On <onboarding@resend.dev>',
                to: email,
                subject: subject,
                html: html,
            });
            console.log('✅ [MAILER] Resend OTP sent successfully:', response.id || 'Success');
            return response;
        } catch (error) {
            console.error('❌ [MAILER ERROR] Resend failed:', error.message);
            // Fallback to SMTP if Resend fails
        }
    }

    // 2. Fallback to SMTP (Local/Dev)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        const error = new Error('EMAIL_SERVICE_NOT_CONFIGURED');
        error.code = 'EMAIL_SERVICE_NOT_CONFIGURED';
        throw error;
    }

    const mailOptions = {
        from: process.env.SMTP_FROM || `"Dokuz On" <${process.env.SMTP_USER}>`,
        to: email,
        subject: subject,
        html: html,
    };

    try {
        console.log(`📡 [MAILER] Sending OTP to ${email} via SMTP fallback...`);
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ [MAILER] SMTP OTP sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ [MAILER ERROR] SMTP failed:', error.message);
        throw error;
    }
};

module.exports = { sendResetEmail };
