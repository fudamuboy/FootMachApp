const nodemailer = require('nodemailer');

// Brevo SMTP Configuration (Stable on Render)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE) === "true", // usually false for 587
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Startup Check
console.log('📡 [MAILER] SMTP Initialized (Brevo/Relay Mode):', {
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER ? 'Configured' : 'MISSING'
});

const sendResetEmail = async (email, code) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('❌ [MAILER] SMTP_USER or SMTP_PASS missing');
        const error = new Error('SMTP_NOT_CONFIGURED');
        error.code = 'SMTP_NOT_CONFIGURED';
        throw error;
    }

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

    const mailOptions = {
        from: process.env.SMTP_FROM || `"Dokuz On" <${process.env.SMTP_USER}>`,
        to: email,
        subject: subject,
        html: html,
    };

    try {
        console.log(`[MAILER] Sending OTP to ${email}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ [MAILER] OTP sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ [MAILER ERROR]:', error.message);
        throw error;
    }
};

module.exports = { sendResetEmail };
