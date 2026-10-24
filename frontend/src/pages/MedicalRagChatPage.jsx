import React from 'react';
import ReportRagChat from '../components/ReportRagChat';
import { useNavigate } from 'react-router-dom';

export default function MedicalRagChatPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #0f172a 0%, #030712 100%)',
      padding: '24px 20px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <button
          onClick={() => navigate('/home')}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#f8fafc',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13.5px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          ← Back to Dashboard
        </button>

        <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: '500' }}>
          ✨ Powered by Clinical Knowledge Base & Gemini AI
        </span>
      </div>

      <ReportRagChat standalone={true} />
    </div>
  );
}
