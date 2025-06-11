import { useEffect, useState } from 'react'
import axios from 'axios'
import './viewReports.css'

const userId = 107;

export default function ViewReportsPage() {
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [newDescription, setNewDescription] = useState("")
  const [qrData, setQrData] = useState(null) // { qrCode: base64, shareURL: string }
  const [loadingQR, setLoadingQR] = useState(false)
  const [qrError, setQrError] = useState(null)

  const fetchReports = async () => {
    const res = await axios.get(`http://localhost:5000/api/reports/getReports/${userId}`)
    setReports(res.data)
  }

  const deleteReport = async (fileName) => {
    await axios.delete(`http://localhost:5000/api/reports/deleteReport/${userId}/${fileName}`)
    setSelectedReport(null)
    setQrData(null)
    fetchReports()
  }

  const updateDescription = async () => {
    await axios.put(`http://localhost:5000/api/reports/updateDescription/${userId}/${selectedReport.fileName}`, {
      newDescription
    })
    setSelectedReport(null)
    setQrData(null)
    fetchReports()
  }

  // New function to generate QR share link for the selected report
  const generateQR = async () => {
    if (!selectedReport) return
    setLoadingQR(true)
    setQrError(null)
    setQrData(null)

    try {
      setLoadingQR(true);
const res = await axios.post(
  `http://localhost:5000/api/reports/generate-share-link/${selectedReport.fileName}`,
  { userId }   // <-- send userId in body
);
  setQrData(res.data);
    } catch (error) {
      setQrError("Failed to generate QR code. Please try again.")
    } finally {
      setLoadingQR(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  return (
    <div className="reports-container">
      <h1 className="page-title">📄 My Medical Reports</h1>

      <div className="reports-grid">
        {reports.map((report, index) => (
          <div key={index} className="report-card">
            <a href={report.fileUrl} target="_blank" rel="noopener noreferrer">
              <img src={report.fileUrl} alt="Report" className="report-image" />
            </a>

            <p className="report-name">{report.fileName}</p>
            <p className="report-date">{new Date(report.uploadedAt).toLocaleString()}</p>
            <button
              onClick={() => {
                setSelectedReport(report)
                setNewDescription(report.description)
                setQrData(null)     // Reset QR data when switching report
                setQrError(null)    // Reset QR error
              }}
              className="view-btn"
            >
              👁️ View Report
            </button>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedReport && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span className="close-btn" onClick={() => setSelectedReport(null)}>✖️</span>
            <a href={selectedReport.fileUrl} target="_blank" rel="noopener noreferrer">
              <img src={selectedReport.fileUrl} alt="Full Report" className="modal-image" />
            </a>
            <p><b>Uploaded On:</b> {new Date(selectedReport.uploadedAt).toLocaleString()}</p>
            <p><b>File Name:</b> {selectedReport.fileName}</p>
            <p><b>Description:</b></p>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="description-input"
            />
            <div className="modal-buttons">
              <button onClick={updateDescription} className="update-btn">✏️ Update Description</button>
              <button onClick={() => deleteReport(selectedReport.fileName)} className="delete-btn">🗑️ Delete Report</button>
            </div>

            {/* New QR Code Section */}
            <hr style={{ margin: "20px 0" }} />
            <h3>Share Report via QR Code</h3>
            <button onClick={generateQR} disabled={loadingQR} className="qr-generate-btn">
              {loadingQR ? "Generating QR..." : "Generate QR"}
            </button>

            {qrError && <p style={{ color: "red" }}>{qrError}</p>}

            {qrData && (
              <div style={{ marginTop: "15px" }}>
                <img src={qrData.qrCode} alt="QR Code" style={{ width: "180px", height: "180px" }} />
                <p>
                  Share Link: <a href={qrData.shareURL} target="_blank" rel="noopener noreferrer">{qrData.shareURL}</a>
                </p>
                <p style={{ fontSize: "0.9em", color: "#666" }}>
                  * Link will expire as per the configured time
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
