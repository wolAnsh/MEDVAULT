import { useEffect, useState } from 'react'
import axios from 'axios'
import './viewReports.css'

const userId = 107;

export default function ViewReportsPage() {
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [newDescription, setNewDescription] = useState("")

  const fetchReports = async () => {
    const res = await axios.get(`http://localhost:5000/api/reports/getReports/${userId}`)
    setReports(res.data)
  }

  const deleteReport = async (fileName) => {
    await axios.delete(`http://localhost:5000/api/reports/deleteReport/${userId}/${fileName}`)
    setSelectedReport(null)
    fetchReports()
  }

  const updateDescription = async () => {
    await axios.put(`http://localhost:5000/api/reports/updateDescription/${userId}/${selectedReport.fileName}`, {
      newDescription
    })
    setSelectedReport(null)
    fetchReports()
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
            <button onClick={() => {
              setSelectedReport(report)
              setNewDescription(report.description)
            }} className="view-btn">👁️ View Report</button>
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
          </div>
        </div>
      )}
    </div>
  )
}
