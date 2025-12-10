const express = require('express');
const QRCode = require('qrcode');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/generate-product-qr
// @desc    Generate QR code for product information
// @access  Private
router.post('/generate-product-qr', auth, [
  body('productName').trim().notEmpty().withMessage('Product name is required'),
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('batchNumber').trim().notEmpty().withMessage('Batch number is required'),
  body('manufacturingDate').optional().isISO8601().withMessage('Invalid manufacturing date format'),
  body('expiryDate').optional().isISO8601().withMessage('Invalid expiry date format'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
      });
    }

    const { productName, companyName, manufacturingDate, expiryDate, batchNumber } = req.body;

    // Format the QR code data
    let qrData = `Product: ${productName}\n`;
    qrData += `Company: ${companyName}\n`;

    if (manufacturingDate) {
      const mfgDate = new Date(manufacturingDate).toLocaleDateString();
      qrData += `Manufactured: ${mfgDate}\n`;
    }

    if (expiryDate) {
      const expDate = new Date(expiryDate).toLocaleDateString();
      qrData += `Expiry: ${expDate}\n`;
    }

    qrData += `Batch No: ${batchNumber}`;

    // Generate QR code as base64 data URL
    const qrCodeData = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 300,
    });

    console.log(`[Product QR] Generated QR code for product: ${productName}, batch: ${batchNumber}`);

    res.json({
      success: true,
      message: 'QR code generated successfully',
      qrCodeData: qrCodeData,
      productInfo: {
        productName,
        companyName,
        manufacturingDate,
        expiryDate,
        batchNumber,
      },
    });

  } catch (error) {
    console.error('[Product QR] Generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code',
      error: error.message,
    });
  }
});

module.exports = router;
