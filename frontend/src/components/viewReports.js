import { useEffect, useState, useCallback } from 'react'
import api from '../api/config'
import './viewReports.css'

// ── Toast helper ──────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([])
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])
  return { toasts, addToast }
}

// ── Expiry countdown ──────────────────────────────────────────────────────────
function useCountdown(expiresAt) {
  const [secondsLeft, setSecondsLeft] = useState(null)
  useEffect(() => {
    if (!expiresAt) return
    const calc = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000))
      setSecondsLeft(diff)
    }
    calc()
    const interval = setInterval(calc, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  if (secondsLeft === null) return null
  if (secondsLeft === 0) return '⏰ Expired'
  const m = Math.floor(secondsLeft / 60)
  const s = secondsLeft % 60
  return `${m}m ${s.toString().padStart(2, '0')}s remaining`
}

// ── Sub-component: QR countdown display ──────────────────────────────────────
function QRCountdown({ expiresAt }) {
  const label = useCountdown(expiresAt)
  if (!label) return null
  const expired = label === '⏰ Expired'
  return (
    <div className={`qr-countdown ${expired ? 'expired' : ''}`}>
      <span>⏱</span> {label}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ViewReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState(null)
  const [newDescription, setNewDescription] = useState('')
  const [qrData, setQrData] = useState(null)
  const [loadingQR, setLoadingQR] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [copied, setCopied] = useState(false)
  const { toasts, addToast } = useToast()

  // ── Fetch reports ───────────────────────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/reports/getReports')
      setReports(res.data)
    } catch (err) {
      addToast('Failed to load reports.', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { fetchReports() }, [fetchReports])

  // ── Delete ──────────────────────────────────────────────────────────────────
  const deleteReport = async () => {
    if (!selectedReport) return
    if (!window.confirm('Delete this report permanently?')) return
    try {
      await api.delete(`/api/reports/deleteReport/${selectedReport.fileName}`)
      addToast('Report deleted.', 'success')
      closeModal()
      fetchReports()
    } catch (err) {
      addToast('Delete failed.', 'error')
    }
  }

  // ── Update description ──────────────────────────────────────────────────────
  const updateDescription = async () => {
    try {
      await api.put(`/api/reports/updateDescription/${selectedReport.fileName}`, {
        newDescription
      })
      addToast('Description updated!', 'success')
      closeModal()
      fetchReports()
    } catch (err) {
      addToast('Update failed.', 'error')
    }
  }

  // ── Generate QR ─────────────────────────────────────────────────────────────
  const generateQR = async () => {
    if (!selectedReport || loadingQR) return
    setLoadingQR(true)
    setQrData(null)
    try {
      const res = await api.post(
        `/api/reports/generate-share-link/${selectedReport.fileName}`
      )
      setQrData(res.data)
      addToast('QR code generated!', 'success')
    } catch (err) {
      addToast('Failed to generate QR code.', 'error')
    } finally {
      setLoadingQR(false)
    }
  }

  // ── Copy share URL ──────────────────────────────────────────────────────────
  const copyLink = async () => {
    if (!qrData?.shareURL) return
    try {
      await navigator.clipboard.writeText(qrData.shareURL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      addToast('Copy failed — please copy manually.', 'error')
    }
  }

  // ── Download QR as PNG ──────────────────────────────────────────────────────
  const downloadQR = () => {
    if (!qrData?.qrCode) return
    const link = document.createElement('a')
    link.href = qrData.qrCode
    link.download = `medvault-qr-${selectedReport.fileName}.png`
    link.click()
  }

  // ── Open / close modal ──────────────────────────────────────────────────────
  const openModal = (report) => {
    setSelectedReport(report)
    setNewDescription(report.description || '')
    setQrData(null)
  }
  const closeModal = () => {
    setSelectedReport(null)
    setQrData(null)
  }

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = reports.filter(r =>
    r.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isPdf = (url) => url?.toLowerCase().includes('.pdf') || url?.endsWith('/raw/upload')

  return (
    <div className="reports-page">
      {/* ── Toasts ─────────────────────────────────────────────────────────── */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === 'success' && '✅ '}
            {t.type === 'error' && '❌ '}
            {t.type === 'info' && 'ℹ️ '}
            {t.message}
          </div>
        ))}
      </div>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="reports-header">
        <div>
          <a href="/home" className="reports-back">← Dashboard</a>
          <h1 className="reports-title">My Medical Reports</h1>
          <p className="reports-subtitle">
            {reports.length} record{reports.length !== 1 ? 's' : ''} stored securely
          </p>
        </div>
        <a href="/upload" className="reports-upload-btn">+ Upload Report</a>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div className="reports-search-wrap">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search by name or description..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="reports-search"
        />
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="reports-loading">
          <div className="spinner" style={{width:32, height:32, borderWidth:3}} />
          <p>Loading reports...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="reports-empty">
          <div className="empty-icon">📭</div>
          <h3>{searchQuery ? 'No matches found' : 'No reports yet'}</h3>
          <p>{searchQuery ? 'Try a different search term.' : 'Upload your first medical record to get started.'}</p>
          {!searchQuery && <a href="/upload" className="reports-upload-btn">Upload Now</a>}
        </div>
      ) : (
        <div className="reports-grid">
          {filtered.map((report, index) => (
            <div key={index} className="report-card glass">
              {/* Thumbnail */}
              <div className="report-thumb" onClick={() => openModal(report)}>
                {isPdf(report.fileUrl) ? (
                  <div className="report-pdf-icon">📄</div>
                ) : (
                  <img src={report.fileUrl} alt={report.fileName} className="report-img" />
                )}
                <div className="report-thumb-overlay">
                  <span>View</span>
                </div>
              </div>

              {/* Info */}
              <div className="report-info">
                <p className="report-name" title={report.fileName}>
                  {report.fileName.split('_').slice(2).join('_') || report.fileName}
                </p>
                {report.description && (
                  <p className="report-desc">{report.description}</p>
                )}
                <p className="report-date">
                  🕒 {new Date(report.uploadedAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </p>
                <button className="report-view-btn" onClick={() => openModal(report)}>
                  View Report
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      {selectedReport && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-box glass">
            <button className="modal-close" onClick={closeModal} aria-label="Close">✕</button>

            {/* Report preview */}
            <div className="modal-preview">
              {isPdf(selectedReport.fileUrl) ? (
                <div className="modal-pdf-thumb">📄 PDF Document</div>
              ) : (
                <img src={selectedReport.fileUrl} alt="Report" className="modal-img" />
              )}
            </div>

            {/* Meta */}
            <div className="modal-meta">
              <div className="modal-meta-row">
                <span>📁 File</span>
                <span>{selectedReport.fileName}</span>
              </div>
              <div className="modal-meta-row">
                <span>📅 Uploaded</span>
                <span>{new Date(selectedReport.uploadedAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Description edit */}
            <div className="modal-section">
              <label className="modal-label">Description</label>
              <input
                type="text"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                className="modal-input"
                placeholder="Add a description..."
              />
            </div>

            {/* Action buttons */}
            <div className="modal-actions">
              <button className="modal-btn modal-btn-update" onClick={updateDescription}>
                ✏️ Save
              </button>
              <a href={selectedReport.fileUrl} target="_blank" rel="noopener noreferrer"
                className="modal-btn modal-btn-view">
                🔗 Open
              </a>
              <button className="modal-btn modal-btn-delete" onClick={deleteReport}>
                🗑️ Delete
              </button>
            </div>

            {/* QR Section */}
            <div className="modal-qr-section">
              <div className="modal-qr-header">
                <div>
                  <h3 className="modal-qr-title">Share via QR Code</h3>
                  <p className="modal-qr-subtitle">Generate a secure, time-limited share link</p>
                </div>
                <button
                  className="qr-generate-btn"
                  onClick={generateQR}
                  disabled={loadingQR}
                >
                  {loadingQR
                    ? <><span className="spinner" /> Generating...</>
                    : qrData ? '🔄 Regenerate' : '⚡ Generate QR'
                  }
                </button>
              </div>

              {qrData && (
                <div className="qr-result">
                  {/* QR Image */}
                  <div className="qr-image-wrap">
                    <img src={qrData.qrCode} alt="QR Code" className="qr-image" />
                  </div>

                  {/* Countdown */}
                  <QRCountdown expiresAt={qrData.expiresAt} />

                  {/* Share URL */}
                  <div className="qr-url-wrap">
                    <span className="qr-url-text">{qrData.shareURL}</span>
                    <button
                      className={`qr-copy-btn ${copied ? 'copied' : ''}`}
                      onClick={copyLink}
                    >
                      {copied ? '✓ Copied!' : '📋 Copy'}
                    </button>
                  </div>

                  {/* Download */}
                  <button className="qr-download-btn" onClick={downloadQR}>
                    ⬇️ Download QR Image
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
