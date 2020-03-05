const QrcodeTerminal = require('qrcode-terminal');

// QR Scan
async function onScan(qrCode, status) {
    console.log('onScan Event!');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCode)}`);
    QrcodeTerminal.generate('This will be a small QRCode, eh!', {small: true}, function (qrCode) {
        console.log(qrCode)
    });
}

module.exports = onScan;