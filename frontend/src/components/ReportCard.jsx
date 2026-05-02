import { useState } from 'react';
import axios from 'axios';

function ReportCard({ report }) {
  const [qrImage, setQrImage] = useState(null);
  const [shareURL, setShareURL] = useState(null);

  const generateQR = async () => {
    try {
      const res = await axios.post(`http://localhost:5000/api/reports/generate-share-link/${report._id}`);
      setQrImage(res.data.qrCode);
      setShareURL(res.data.shareURL);
    } catch (err) {
      alert("QR generation failed");
    }
  };

  return (
    <div className="report-card">
      <h3>{report.title}</h3>
      <button onClick={generateQR}>Generate QR</button>

      {qrImage && (
        <div>
          <p>This QR is valid for 15 minutes</p>
          <img src={qrImage} alt="QR Code" style={{ width: 200 }} />
          <p>Or visit: <a href={shareURL} target="_blank" rel="noreferrer">{shareURL}</a></p>
        </div>
      )}
    </div>
  );
}

export default ReportCard;
