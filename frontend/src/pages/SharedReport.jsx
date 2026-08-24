import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000'

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

function SharedReport() {
  const { token } = useParams()
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // Decryption states
  const [decryptedUrl, setDecryptedUrl] = useState(null)
  const [decrypting, setDecrypting] = useState(false)
  const [decryptError, setDecryptError] = useState('')

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/reports/shared/${token}`)
        const reportData = res.data
        setReport(reportData)

        // Parse key from URL hash fragment (e.g. #key=xxxx)
        const hash = window.location.hash
        const params = new URLSearchParams(hash.substring(1))
        const keyHex = params.get('key')

        if (reportData.encryptionKey) {
          if (!keyHex) {
            setDecryptError('Decryption key missing. Shared links for E2EE reports require the key parameter in the URL hash.')
            setLoading(false)
            return
          }
          setDecrypting(true)
          try {
            const decrypted = await decryptFileFromUrl(reportData.fileUrl, keyHex, reportData.fileType || 'image/jpeg')
            setDecryptedUrl(decrypted)
          } catch (err) {
            console.error('Decryption error:', err)
            setDecryptError('Failed to decrypt the medical document locally. The link key might be incorrect.')
          } finally {
            setDecrypting(false)
          }
        } else {
          // Legacy/unencrypted report
          setDecryptedUrl(reportData.fileUrl)
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load this report.')
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [token])

  const isPdf = (url, reportData) => reportData?.fileType === 'application/pdf' || url?.toLowerCase().includes('.pdf')

  // ── Deterrents ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
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
          {decrypting ? (
            <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>
              <div style={styles.spinner} />
              <p>Decrypting secure medical document...</p>
            </div>
          ) : decryptError ? (
            <div style={{ padding: '40px', color: '#fca5a5', textAlign: 'center' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <p style={{ marginTop: '10px' }}>{decryptError}</p>
            </div>
          ) : (
            <>
              {isPdf(decryptedUrl || report.fileUrl, report) ? (
                <div style={styles.pdfEmbed}>
                  <iframe
                    src={`${decryptedUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    title="Medical Report"
                    style={styles.pdfFrame}
                  />
                </div>
              ) : (
                <div style={styles.imageWrap}>
                  <img src={decryptedUrl} alt="Medical Report" style={styles.image} />
                  {/* Transparent overlay to prevent "Save Image As" via drag/click */}
                  <div style={styles.securityOverlay} />
                </div>
              )}
            </>
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

        {/* AI Summary */}
        {report.aiSummary && (
          <div style={{
            background: 'rgba(14, 165, 233, 0.08)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(14, 165, 233, 0.2)',
            marginTop: '10px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#0ea5e9',
              fontWeight: '700',
              marginBottom: '8px',
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              🤖 MedVault AI Summary
            </div>
            <div style={{
              fontSize: '13.5px',
              lineHeight: '1.6',
              color: '#e2e8f0',
              whiteSpace: 'pre-line'
            }}>
              {report.aiSummary}
            </div>
          </div>
        )}

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
