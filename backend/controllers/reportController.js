const UserReports = require('../models/UserReports');
const SharedLink = require('../models/SharedLink');
const { generateQRCode } = require('../utils/qrcodeGenerator');
const crypto = require('crypto');

const generateShareLink = async (req, res) => {
  try {
    const { userId } = req.body;
    const { fileName } = req.params;

    const userReports = await UserReports.findOne({ userId });
    if (!userReports) return res.status(404).json({ message: 'User reports not found' });

    const report = userReports.reports.find(r => r.fileName === fileName);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

    await SharedLink.create({ userId, fileName, token, expiresAt });

    const shareURL = `http://localhost:3000/shared/${token}`;
    const qrCode = await generateQRCode(shareURL);

    res.json({ qrCode, shareURL });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


const accessSharedReport = async (req, res) => {
  try {
    const { token } = req.params;

    const link = await SharedLink.findOne({ token });
    if (!link) return res.status(404).json({ message: 'Invalid link' });
    if (new Date() > link.expiresAt) return res.status(410).json({ message: 'Link expired' });

    const userReports = await UserReports.findOne({ userId: link.userId });
    if (!userReports) return res.status(404).json({ message: 'User reports not found' });

    const report = userReports.reports.find(r => r.fileName === link.fileName);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { generateShareLink, accessSharedReport };
