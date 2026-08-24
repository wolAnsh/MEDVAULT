import React, { useState, useEffect } from 'react'
import api from '../api/config'
import './vitals.css'

export default function VitalsTracker() {
  const [vitals, setVitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('heartRate') // heartRate, bloodPressure, spO2, temperature
  const [hoveredPoint, setHoveredPoint] = useState(null) // { x, y, value, date }

  // Form State
  const [form, setForm] = useState({
    systolic: '',
    diastolic: '',
    heartRate: '',
    temperature: '',
    spO2: ''
  })

  useEffect(() => {
    fetchVitals()
  }, [])

  const fetchVitals = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/vitals')
      setVitals(res.data)
    } catch (err) {
      console.error('Failed to fetch vitals:', err)
      setError('Could not retrieve health data.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await api.post('/api/vitals/add', form)
      setSuccess('Vitals logged successfully!')
      setForm({
        systolic: '',
        diastolic: '',
        heartRate: '',
        temperature: '',
        spO2: ''
      })
      fetchVitals()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit vitals.')
    }
  }

  const getLatestVitals = () => {
    if (vitals.length === 0) return null
    return vitals[vitals.length - 1]
  }

  const latest = getLatestVitals()

  // Helper to check range status
  const getStatus = (metric, val, val2 = null) => {
    if (!val) return { label: 'No Data', class: 'status-gray' }
    const num = Number(val)
    if (metric === 'heartRate') {
      if (num >= 60 && num <= 100) return { label: 'Normal', class: 'status-green' }
      if ((num > 100 && num <= 120) || (num >= 50 && num < 60)) return { label: 'Warning', class: 'status-yellow' }
      return { label: 'Critical', class: 'status-red' }
    }
    if (metric === 'spO2') {
      if (num >= 95) return { label: 'Normal', class: 'status-green' }
      if (num >= 90 && num < 95) return { label: 'Warning', class: 'status-yellow' }
      return { label: 'Critical', class: 'status-red' }
    }
    if (metric === 'temperature') {
      if (num >= 36.1 && num <= 37.2) return { label: 'Normal', class: 'status-green' }
      if ((num > 37.2 && num <= 38.3) || (num >= 35.0 && num < 36.1)) return { label: 'Fever/Low', class: 'status-yellow' }
      return { label: 'Critical', class: 'status-red' }
    }
    if (metric === 'bloodPressure') {
      const sys = num
      const dia = Number(val2)
      if (sys <= 120 && dia <= 80) return { label: 'Normal', class: 'status-green' }
      if ((sys > 120 && sys <= 139) || (dia > 80 && dia <= 89)) return { label: 'Prehypertension', class: 'status-yellow' }
      return { label: 'High BP', class: 'status-red' }
    }
    return { label: 'Unknown', class: 'status-gray' }
  }

  // Custom SVG line chart plotting logic
  const renderChart = () => {
    if (vitals.length < 2) {
      return (
        <div className="chart-placeholder">
          <p>Need at least 2 logs to display health trends.</p>
        </div>
      )
    }

    const width = 500
    const height = 200
    const padding = 30

    // Extract data points based on active tab
    let dataPoints = []
    if (activeTab === 'heartRate') {
      dataPoints = vitals.map(v => ({ val: v.heartRate, date: v.recordedAt }))
    } else if (activeTab === 'spO2') {
      dataPoints = vitals.map(v => ({ val: v.spO2, date: v.recordedAt }))
    } else if (activeTab === 'temperature') {
      dataPoints = vitals.map(v => ({ val: v.temperature, date: v.recordedAt }))
    } else if (activeTab === 'bloodPressure') {
      // Plot systolic trend
      dataPoints = vitals.map(v => ({ val: v.bloodPressure?.systolic || 0, date: v.recordedAt, val2: v.bloodPressure?.diastolic || 0 }))
    }

    const values = dataPoints.map(p => p.val)
    const values2 = activeTab === 'bloodPressure' ? dataPoints.map(p => p.val2) : []

    const minVal = Math.min(...values, ...values2, activeTab === 'spO2' ? 85 : activeTab === 'temperature' ? 34 : 50) - 5
    const maxVal = Math.max(...values, ...values2, activeTab === 'spO2' ? 100 : activeTab === 'temperature' ? 40 : 130) + 5

    const scaleX = (index) => {
      return (index / (dataPoints.length - 1)) * (width - padding * 2) + padding
    }

    const scaleY = (val) => {
      // Guard against division by zero when all values are identical
      if (maxVal === minVal) {
        return height - padding;
      }
      return height - padding - ((val - minVal) / (maxVal - minVal)) * (height - padding * 2);
    }



    // Generate Path string for primary value
    const pathD = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(p.val)}`).join(' ')
    
    // Generate Path for secondary value (Blood Pressure - Diastolic)
    const pathD2 = activeTab === 'bloodPressure' 
      ? dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleY(p.val2)}`).join(' ')
      : null

    return (
      <div className="svg-chart-container">
        <svg viewBox={`0 0 ${width} ${height}`} className="svg-chart">
          {/* Horizontal grids */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const yVal = minVal + ratio * (maxVal - minVal)
            const yCoord = scaleY(yVal)
            return (
              <g key={i} className="chart-grid-line">
                <line x1={padding} y1={yCoord} x2={width - padding} y2={yCoord} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <text x={padding - 5} y={yCoord + 3} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.4)">
                  {Math.round(yVal)}
                </text>
              </g>
            )
          })}

          {/* Primary Trend Line */}
          <path d={pathD} fill="none" stroke="url(#chart-gradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Diastolic Trend Line (BP only) */}
          {pathD2 && (
            <path d={pathD2} fill="none" stroke="#22d3ee" strokeWidth="2" strokeDasharray="4 2" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Area fill under primary path */}
          {dataPoints.length > 0 && !pathD2 && (
            <path
              d={`${pathD} L ${scaleX(dataPoints.length - 1)} ${height - padding} L ${scaleX(0)} ${height - padding} Z`}
              fill="url(#area-gradient)"
              opacity="0.15"
            />
          )}

          {/* Interaction Dots (Primary) */}
          {dataPoints.map((p, i) => {
            const cx = scaleX(i)
            const cy = scaleY(p.val)
            return (
              <circle
                key={`p1-${i}`}
                cx={cx}
                cy={cy}
                r="5"
                className="chart-dot"
                fill="#0ea5e9"
                stroke="#0a0f1e"
                strokeWidth="2"
                onMouseEnter={() => setHoveredPoint({
                  x: cx,
                  y: cy - 10,
                  value: `${p.val} ${activeTab === 'heartRate' ? 'bpm' : activeTab === 'spO2' ? '%' : activeTab === 'temperature' ? '°C' : 'mmHg (Systolic)'}`,
                  date: new Date(p.date).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })
                })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            )
          })}

          {/* Interaction Dots (Secondary BP) */}
          {activeTab === 'bloodPressure' && dataPoints.map((p, i) => {
            const cx = scaleX(i)
            const cy = scaleY(p.val2)
            return (
              <circle
                key={`p2-${i}`}
                cx={cx}
                cy={cy}
                r="4"
                className="chart-dot-diastolic"
                fill="#22d3ee"
                stroke="#0a0f1e"
                strokeWidth="2"
                onMouseEnter={() => setHoveredPoint({
                  x: cx,
                  y: cy - 10,
                  value: `${p.val2} mmHg (Diastolic)`,
                  date: new Date(p.date).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })
                })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            )
          })}

          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="chart-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="1" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Hover Tooltip inside HTML overlay */}
        {hoveredPoint && (
          <div
            className="chart-tooltip glass"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              bottom: `${((height - hoveredPoint.y) / height) * 100 + 5}%`
            }}
          >
            <div className="tooltip-value">{hoveredPoint.value}</div>
            <div className="tooltip-date">{hoveredPoint.date}</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="vitals-container glass">
      <div className="vitals-header">
        <h2 className="section-title">🩺 Health Vitals Tracker</h2>
        <span className="vitals-subtitle">E2EE-linked medical telemetry logging</span>
      </div>

      {error && <div className="vitals-alert error">⚠️ {error}</div>}
      {success && <div className="vitals-alert success">✅ {success}</div>}

      {/* Grid: Left side Cards, Right side Chart */}
      <div className="vitals-grid">
        <div className="vitals-cards">
          {/* Card: Heart Rate */}
          <div className="vital-card glass" onClick={() => setActiveTab('heartRate')}>
            <div className="vital-card-header">
              <span className="vital-icon">❤️</span>
              <span className={`vital-status ${getStatus('heartRate', latest?.heartRate).class}`}>
                {getStatus('heartRate', latest?.heartRate).label}
              </span>
            </div>
            <div className="vital-value">
              {latest ? `${latest.heartRate}` : '--'} <span className="vital-unit">bpm</span>
            </div>
            <div className="vital-label">Heart Rate</div>
          </div>

          {/* Card: BP */}
          <div className="vital-card glass" onClick={() => setActiveTab('bloodPressure')}>
            <div className="vital-card-header">
              <span className="vital-icon">🩸</span>
              <span className={`vital-status ${getStatus('bloodPressure', latest?.bloodPressure?.systolic, latest?.bloodPressure?.diastolic).class}`}>
                {getStatus('bloodPressure', latest?.bloodPressure?.systolic, latest?.bloodPressure?.diastolic).label}
              </span>
            </div>
            <div className="vital-value">
              {latest ? `${latest.bloodPressure?.systolic}/${latest.bloodPressure?.diastolic}` : '--/--'} <span className="vital-unit">mmHg</span>
            </div>
            <div className="vital-label">Blood Pressure</div>
          </div>

          {/* Card: SpO2 */}
          <div className="vital-card glass" onClick={() => setActiveTab('spO2')}>
            <div className="vital-card-header">
              <span className="vital-icon">🫁</span>
              <span className={`vital-status ${getStatus('spO2', latest?.spO2).class}`}>
                {getStatus('spO2', latest?.spO2).label}
              </span>
            </div>
            <div className="vital-value">
              {latest ? `${latest.spO2}` : '--'} <span className="vital-unit">%</span>
            </div>
            <div className="vital-label">Oxygen Levels (SpO2)</div>
          </div>

          {/* Card: Temperature */}
          <div className="vital-card glass" onClick={() => setActiveTab('temperature')}>
            <div className="vital-card-header">
              <span className="vital-icon">🌡️</span>
              <span className={`vital-status ${getStatus('temperature', latest?.temperature).class}`}>
                {getStatus('temperature', latest?.temperature).label}
              </span>
            </div>
            <div className="vital-value">
              {latest ? `${latest.temperature}` : '--'} <span className="vital-unit">°C</span>
            </div>
            <div className="vital-label">Temperature</div>
          </div>
        </div>

        {/* Analytics Chart Block */}
        <div className="vitals-chart-section glass">
          <div className="chart-header">
            <h3>Trend Analysis</h3>
            <div className="chart-tabs">
              <button className={`chart-tab-btn ${activeTab === 'heartRate' ? 'active' : ''}`} onClick={() => setActiveTab('heartRate')}>Pulse</button>
              <button className={`chart-tab-btn ${activeTab === 'bloodPressure' ? 'active' : ''}`} onClick={() => setActiveTab('bloodPressure')}>BP</button>
              <button className={`chart-tab-btn ${activeTab === 'spO2' ? 'active' : ''}`} onClick={() => setActiveTab('spO2')}>SpO2</button>
              <button className={`chart-tab-btn ${activeTab === 'temperature' ? 'active' : ''}`} onClick={() => setActiveTab('temperature')}>Temp</button>
            </div>
          </div>
          {loading ? (
            <div className="chart-loading">
              <div className="spinner" />
            </div>
          ) : (
            renderChart()
          )}
        </div>
      </div>

      {/* Form Log Section */}
      <div className="vitals-log-form glass">
        <h3>Log New Vitals</h3>
        <form onSubmit={handleSubmit} className="vitals-form">
          <div className="form-row">
            <div className="form-group">
              <label>Systolic BP (mmHg)</label>
              <input type="number" name="systolic" placeholder="e.g. 120" value={form.systolic} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Diastolic BP (mmHg)</label>
              <input type="number" name="diastolic" placeholder="e.g. 80" value={form.diastolic} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Heart Rate (bpm)</label>
              <input type="number" name="heartRate" placeholder="e.g. 72" value={form.heartRate} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>SpO2 (%)</label>
              <input type="number" name="spO2" placeholder="e.g. 98" value={form.spO2} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Body Temp (°C)</label>
              <input type="number" step="0.1" name="temperature" placeholder="e.g. 36.8" value={form.temperature} onChange={handleChange} required />
            </div>
          </div>
          <button type="submit" className="vitals-submit-btn">Save Vitals Log</button>
        </form>
      </div>
    </div>
  )
}
