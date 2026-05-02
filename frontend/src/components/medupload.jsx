import { useState, useCallback } from 'react'
import api, { getCurrentUser } from '../api/config'
import './medupload.css'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE_MB = 10

export default function UploadPage() {
  const [file, setFile] = useState(null)
  const [description, setDescription] = useState('')
  const [uploadUrl, setUploadUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const user = getCurrentUser()

  const validateFile = (f) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      return 'Only JPG, PNG, WebP, and PDF files are allowed.'
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File size must be under ${MAX_SIZE_MB}MB.`
    }
    return null
  }

  const selectFile = (f) => {
    const err = validateFile(f)
    if (err) { setError(err); return }
    setFile(f)
    setError('')
    setUploadUrl('')
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (!f) return
    const err = validateFile(f)
    if (err) { setError(err); return }
    setFile(f)
    setError('')
    setUploadUrl('')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleUpload = async () => {
    if (!file) { setError('Please select a file first.'); return }
    if (!user) { setError('You must be logged in.'); return }

    setUploading(true)
    setProgress(0)
    setError('')

    try {
      const userId = user.id
      const uniqueId = Date.now()
      const filename = `${userId}_${uniqueId}`
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'MEDVAULT_reports')
      formData.append('folder', `user_${userId}`)
      formData.append('public_id', filename)

      // Upload to Cloudinary with progress tracking
      const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dowslza4c'
      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )
      setProgress(60)

      if (!cloudRes.ok) throw new Error('Cloudinary upload failed.')
      const cloudData = await cloudRes.json()
      const uploadedUrl = cloudData.secure_url

      setProgress(80)

      // Save to backend
      await api.post('/api/reports/addReport', {
        fileUrl: uploadedUrl,
        fileName: filename,
        description: description.trim() || 'Medical Report',
      })

      setProgress(100)
      setUploadUrl(uploadedUrl)
      setFile(null)
      setDescription('')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const fileIcon = file
    ? file.type === 'application/pdf' ? '📄' : '🖼️'
    : null

  return (
    <div className="upload-page">
      <div className="upload-blob upload-blob-1" />
      <div className="upload-blob upload-blob-2" />

      <div className="upload-card glass">
        {/* Back link */}
        <a href="/home" className="upload-back">← Dashboard</a>

        <div className="upload-header">
          <div className="upload-header-icon">📤</div>
          <div>
            <h1 className="upload-title">Upload Medical Report</h1>
            <p className="upload-subtitle">JPG, PNG, WebP or PDF · Max {MAX_SIZE_MB}MB</p>
          </div>
        </div>

        {/* Drop zone */}
        <div
          className={`drop-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !file && document.getElementById('file-input').click()}
        >
          {file ? (
            <div className="file-preview">
              <span className="file-preview-icon">{fileIcon}</span>
              <div className="file-preview-info">
                <span className="file-preview-name">{file.name}</span>
                <span className="file-preview-size">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <button
                className="file-remove-btn"
                onClick={(e) => { e.stopPropagation(); setFile(null); setUploadUrl(''); }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="drop-placeholder">
              <div className="drop-icon">☁️</div>
              <p className="drop-text">Drag & drop your file here</p>
              <p className="drop-subtext">or <span className="drop-browse">browse files</span></p>
            </div>
          )}
        </div>

        <input
          id="file-input"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf"
          onChange={(e) => e.target.files[0] && selectFile(e.target.files[0])}
          style={{ display: 'none' }}
        />

        {/* Description */}
        <div className="upload-field">
          <label htmlFor="description">Description (optional)</label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Chest X-Ray, Blood Report, MRI Scan..."
            maxLength={120}
          />
        </div>

        {/* Progress */}
        {uploading && (
          <div className="progress-wrap">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
            <span className="progress-label">{progress}%</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="upload-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Success */}
        {uploadUrl && !uploading && (
          <div className="upload-success">
            <span>✅</span>
            <span>Uploaded successfully!</span>
            <a href={uploadUrl} target="_blank" rel="noopener noreferrer">View file →</a>
          </div>
        )}

        <button
          className="upload-btn"
          onClick={handleUpload}
          disabled={uploading || !file}
        >
          {uploading ? (
            <><span className="spinner" /> Uploading...</>
          ) : (
            '📤 Upload Report'
          )}
        </button>
      </div>
    </div>
  )
}
