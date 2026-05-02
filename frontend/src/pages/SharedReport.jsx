import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000'

function SharedReport() {
  const { token } = useParams()
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/reports/shared/${token}`)
        setReport(res.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load this report.')
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [token])

  const isPdf = (url) => url?.toLowerCase().includes('.pdf')

  // ── Deterrents ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Block PrintScreen, Ctrl+P (Print), Ctrl+S (Save), Ctrl+U (Source)
      if (
        e.key === 'PrintScreen' ||
        ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's' || e.key === 'u'))
      ) {
        e.preventDefault()
        alert('Security Notice: Printing and saving is disabled for this document.')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleContextMenu = (e) => e.preventDefault()

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.loadingIcon}>⏳</div>
          <p style={styles.loadingText}>Loading shared report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.errorIcon}>🔒</div>
          <h2 style={styles.errorTitle}>Access Unavailable</h2>
          <p style={styles.errorText}>{error}</p>
          <p style={styles.errorHint}>
            This link may have expired or been revoked by the owner.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page} onContextMenu={handleContextMenu}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <span>🏥</span>
            <span style={styles.logoText}>MedVault</span>
          </div>
          <div style={styles.badge}>🔒 Secure View</div>
        </div>

        {/* Report preview with security overlay */}
        <div style={styles.previewContainer}>
          {isPdf(report.fileUrl) ? (
            <div style={styles.pdfEmbed}>
              <iframe
                src={`${report.fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                title="Medical Report"
                style={styles.pdfFrame}
              />
            </div>
          ) : (
            <div style={styles.imageWrap}>
              <img src={report.fileUrl} alt="Medical Report" style={styles.image} />
              {/* Transparent overlay to prevent "Save Image As" via drag/click */}
              <div style={styles.securityOverlay} />
            </div>
          )}
          <div style={styles.watermark}>PROTECTED DOCUMENT • DO NOT SHARE</div>
        </div>

        {/* Details */}
        <div style={styles.details}>
          {report.description && (
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Description</span>
              <span style={styles.detailValue}>{report.description}</span>
            </div>
          )}
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Uploaded</span>
            <span style={styles.detailValue}>
              {new Date(report.uploadedAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Security Notice */}
        <div style={styles.notice}>
          🔐 <strong>Privacy Protection Active:</strong><br/>
          Right-click and printing are disabled. This document is intended for authorized viewing only.
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0f1e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: "'Inter', sans-serif",
    userSelect: 'none', // Prevent text selection
    WebkitUserSelect: 'none',
  },
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(12px)',
    borderRadius: '24px',
    padding: '36px',
    maxWidth: '600px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    position: 'relative',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '18px',
    fontWeight: '800',
  },
  logoText: {
    background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  badge: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    color: '#fca5a5',
    padding: '5px 12px',
    borderRadius: '99px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  previewContainer: {
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
    background: '#000',
  },
  imageWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    maxHeight: '380px',
    objectFit: 'contain',
    display: 'block',
  },
  securityOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'transparent',
    zIndex: 10,
  },
  pdfEmbed: {
    background: '#f1f5f9',
  },
  pdfFrame: {
    width: '100%',
    height: '450px',
    border: 'none',
    display: 'block',
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-30deg)',
    color: 'rgba(255,255,255,0.15)',
    fontSize: '24px',
    fontWeight: '800',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    zIndex: 5,
    textTransform: 'uppercase',
    letterSpacing: '4px',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    paddingTop: '16px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13.5px',
    gap: '12px',
  },
  detailLabel: {
    color: '#64748b',
    flexShrink: 0,
  },
  detailValue: {
    color: '#e2e8f0',
    fontWeight: '500',
    textAlign: 'right',
  },
  notice: {
    background: 'rgba(14,165,233,0.07)',
    border: '1px solid rgba(14,165,233,0.2)',
    color: '#7dd3fc',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '12.5px',
    lineHeight: '1.5',
  },
  loadingIcon: { fontSize: '40px', textAlign: 'center' },
  loadingText: { color: '#94a3b8', textAlign: 'center', fontSize: '15px' },
  errorIcon: { fontSize: '48px', textAlign: 'center' },
  errorTitle: { color: '#f1f5f9', fontSize: '22px', fontWeight: '700', textAlign: 'center' },
  errorText: { color: '#fca5a5', textAlign: 'center', fontSize: '14px' },
  errorHint: { color: '#64748b', textAlign: 'center', fontSize: '13px' },
}

export default SharedReport
