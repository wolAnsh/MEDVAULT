import { useEffect, useState, useCallback } from 'react'
import api from '../api/config'
import ReportRagChat from './ReportRagChat'
import './viewReports.css'

// ── Decryption Helpers ────────────────────────────────────────────────────────
async function importKey(keyHex) {
  const keyBytes = new Uint8Array(
    keyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
  )
  return await window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    true,
    ['decrypt']
  )
}

async function decryptFileFromUrl(url, keyHex, mimeType) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch encrypted report file.')
  const encryptedBuffer = await res.arrayBuffer()

  const key = await importKey(keyHex)
  const iv = new Uint8Array(encryptedBuffer, 0, 12)
  const ciphertext = new Uint8Array(encryptedBuffer, 12)

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )

  const blob = new Blob([decryptedBuffer], { type: mimeType })
  return URL.createObjectURL(blob)
}

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

  // Decryption & AI states
  const [decryptedUrl, setDecryptedUrl] = useState(null)
  const [decrypting, setDecrypting] = useState(false)
  const [decryptError, setDecryptError] = useState('')
  const [generatingAI, setGeneratingAI] = useState(false)
  const [chatModalOpen, setChatModalOpen] = useState(false)

  // ── Generate / Regenerate AI Summary ────────────────────────────────────────
  const handleGenerateAISummary = async () => {
    if (!selectedReport || generatingAI) return
    setGeneratingAI(true)
    try {
      const fileToFetch = decryptedUrl || selectedReport.fileUrl
      const res = await fetch(fileToFetch)
      if (!res.ok) throw new Error('Could not fetch report file for AI analysis.')
      const blob = await res.blob()

      const aiFormData = new FormData()
      const mimeType = selectedReport.fileType || blob.type || 'image/jpeg'
      const ext = mimeType === 'application/pdf' ? 'pdf' : 'jpg'
      aiFormData.append('file', blob, `report.${ext}`)

      const aiRes = await api.post('/api/reports/analyze', aiFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const newSummary = aiRes.data.summary
      const vitalsSaved = aiRes.data.vitalsSaved

      await api.put(`/api/reports/updateAiSummary/${selectedReport.fileName}`, {
        aiSummary: newSummary
      })

      setSelectedReport(prev => ({ ...prev, aiSummary: newSummary }))
      setReports(prev => prev.map(r => r.fileName === selectedReport.fileName ? { ...r, aiSummary: newSummary } : r))
      
      if (vitalsSaved) {
        addToast('✨ AI Summary generated & vitals auto-logged to your Health Vitals Tracker!', 'success')
      } else {
        addToast('AI Summary generated successfully!', 'success')
      }
    } catch (err) {
      console.error('AI summary error:', err)
      const errMsg = err.response?.data?.message || err.message || 'AI summary generation failed.'
      addToast(errMsg, 'error')
    } finally {
      setGeneratingAI(false)
    }
  }

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
  const openModal = async (report) => {
    setSelectedReport(report)
    setNewDescription(report.description || '')
    setQrData(null)
    setDecryptError('')
    setDecryptedUrl(null)
    setChatModalOpen(false)

    if (report.encryptionKey) {
      setDecrypting(true)
      try {
        const decrypted = await decryptFileFromUrl(report.fileUrl, report.encryptionKey, report.fileType || 'image/jpeg')
        setDecryptedUrl(decrypted)
      } catch (err) {
        console.error('Decryption error:', err)
        setDecryptError('Failed to decrypt report locally. The key may be invalid.')
      } finally {
        setDecrypting(false)
      }
    } else {
      setDecryptedUrl(report.fileUrl)
    }
  }

  const closeModal = () => {
    if (decryptedUrl && selectedReport?.encryptionKey) {
      URL.revokeObjectURL(decryptedUrl)
    }
    setSelectedReport(null)
    setQrData(null)
    setDecryptedUrl(null)
    setChatModalOpen(false)
  }

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = reports.filter(r =>
    r.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isPdf = (url, report) => report?.fileType === 'application/pdf' || url?.toLowerCase().includes('.pdf') || url?.endsWith('/raw/upload')

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
                {isPdf(report.fileUrl, report) ? (
                  <div className="report-pdf-icon">📄</div>
                ) : report.encryptionKey ? (
                  <div className="report-encrypted-icon" style={{
                    fontSize: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    background: 'rgba(255,255,255,0.03)'
                  }}>🔒</div>
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
              {decrypting ? (
                <div className="modal-loading" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 0',
                  color: 'var(--color-text-muted)'
                }}>
                  <div className="spinner" style={{width:32, height:32, borderWidth:3}} />
                  <p style={{marginTop: 12, fontSize: '14px'}}>Decrypting file locally...</p>
                </div>
              ) : decryptError ? (
                <div className="modal-error" style={{
                  padding: '30px',
                  textAlign: 'center',
                  color: '#fca5a5',
                  background: 'rgba(239,68,68,0.1)',
                  borderRadius: '8px'
                }}>
                  <span>⚠️</span> {decryptError}
                </div>
              ) : (
                <>
                  {isPdf(decryptedUrl || selectedReport.fileUrl, selectedReport) ? (
                    <div className="modal-pdf-wrapper" style={{width: '100%', height: '400px'}}>
                      <iframe src={decryptedUrl} title="PDF Viewer" style={{width:'100%', height:'100%', border:'none', borderRadius:'8px'}} />
                    </div>
                  ) : (
                    <img src={decryptedUrl || selectedReport.fileUrl} alt="Report" className="modal-img" />
                  )}
                </>
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

            {/* AI Summary Section */}
            <div className="modal-section ai-summary-section" style={{
              background: 'rgba(14, 165, 233, 0.08)',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid rgba(14, 165, 233, 0.25)',
              marginTop: '15px',
              marginBottom: '15px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <label className="modal-label" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#0ea5e9',
                  fontWeight: '700',
                  margin: 0,
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  🤖 MedVault AI Summary
                </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setChatModalOpen(prev => !prev)}
                      style={{
                        background: chatModalOpen ? 'rgba(99, 102, 241, 0.2)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        color: '#fff',
                        border: chatModalOpen ? '1px solid #818cf8' : 'none',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '12.5px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
                      }}
                    >
                      💬 {chatModalOpen ? 'Hide Chat' : 'Ask RAG AI'}
                    </button>
                    <button
                      onClick={handleGenerateAISummary}
                      disabled={generatingAI || decrypting}
                      style={{
                        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 14px',
                        fontSize: '12.5px',
                        fontWeight: '600',
                        cursor: generatingAI || decrypting ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 8px rgba(14, 165, 233, 0.3)',
                        opacity: generatingAI || decrypting ? 0.7 : 1
                      }}
                    >
                      {generatingAI ? (
                        <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Analyzing...</>
                      ) : selectedReport.aiSummary ? (
                        '🔄 Regenerate'
                      ) : (
                        '✨ Generate AI Summary'
                      )}
                    </button>
                  </div>
              </div>

              {selectedReport.aiSummary ? (
                <div className="ai-summary-text" style={{
                  fontSize: '13.5px',
                  lineHeight: '1.6',
                  color: 'var(--color-text)',
                  whiteSpace: 'pre-line'
                }}>
                  {selectedReport.aiSummary}
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                  No AI summary generated yet. Click "Generate AI Summary" above to analyze this report using Gemini AI.
                </p>
              )}

              {chatModalOpen && (
                <div style={{ marginTop: '16px' }}>
                  <ReportRagChat
                    selectedReport={selectedReport}
                    onClose={() => setChatModalOpen(false)}
                  />
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="modal-actions">
              <button className="modal-btn modal-btn-update" onClick={updateDescription}>
                ✏️ Save
              </button>
              {(decryptedUrl || !selectedReport.encryptionKey) && (
                <a href={decryptedUrl || selectedReport.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="modal-btn modal-btn-view">
                  🔗 Open
                </a>
              )}
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
