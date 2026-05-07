const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Mock: Verify In-App Purchase Receipt (Apple/Google)
// Plus tard: intégrer 'node-apple-receipt-verify' ou google play api
router.post('/verify-purchase', authMiddleware, async (req, res) => {
    try {
        const { receiptData, productId, platform } = req.body;
        const userId = req.user.id;

        if (!productId) {
            return res.status(400).json({ errorCode: 'MISSING_PRODUCT_ID', message: 'Product ID is missing.' });
        }

        // Logic here to verify receipt with Apple/Google...
        // For now, we mock a successful verification based on productId
        const isValid = true; // Mock true

        if (!isValid) {
            return res.status(400).json({ errorCode: 'INVALID_RECEIPT', message: 'The purchase receipt is invalid.' });
        }

        let plan = 'monthly';
        let durationDays = 30;

        if (productId === 'dokuzon_premium_yearly') {
            plan = 'yearly';
            durationDays = 365;
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + durationDays);

        await db.query(
            `UPDATE users 
             SET is_premium = true, 
                 premium_source = 'paid', 
                 premium_plan = $1, 
                 premium_expires_at = $2 
             WHERE id = $3`,
            [plan, expiresAt, userId]
        );

        res.json({ 
            success: true, 
            message: 'Purchase verified successfully.',
            premium_expires_at: expiresAt,
            plan
        });
    } catch (error) {
        console.error('Error verifying purchase:', error);
        res.status(500).json({ errorCode: 'SERVER_ERROR', message: 'Server error during purchase verification' });
    }
});

// Mock: Restore purchases
router.post('/restore-purchase', authMiddleware, async (req, res) => {
    try {
        // Logic to check old receipts...
        res.json({ success: true, message: 'Purchases restored successfully (Mock)' });
    } catch (error) {
        res.status(500).json({ errorCode: 'SERVER_ERROR', message: 'Error restoring purchases' });
    }
});

module.exports = router;
