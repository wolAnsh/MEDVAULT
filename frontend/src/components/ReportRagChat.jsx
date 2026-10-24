import React, { useState, useRef, useEffect } from 'react';
import api from '../api/config';
import './ReportRagChat.css';

export default function ReportRagChat({ selectedReport = null, onClose = null, standalone = false }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: selectedReport
        ? `Hello! I am MedVault's RAG-powered Clinical Assistant. I have loaded the context from your report: **${selectedReport.fileName}**. You can ask me to explain any parameter, lab value, or medical finding.`
        : 'Hello! I am MedVault\'s RAG-powered Medical Assistant. Ask me any clinical question or inquire about your diagnostic records and lab test results.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const messagesEndRef = useRef(null);

  const suggestedQuestions = selectedReport
    ? [
        'Explain any abnormal findings in this report',
        'Are my lab values within healthy reference ranges?',
        'What dietary or lifestyle steps should I consider?',
        'What questions should I ask my doctor about this?'
      ]
    : [
        'What does elevated ALT (SGPT) signify on a liver test?',
        'What is a healthy HbA1c range and how to lower it?',
        'Explain the difference between HDL and LDL cholesterol',
        'What causes low hemoglobin and how is it treated?'
      ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const toggleSource = (msgId) => {
    setExpandedSources(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleSend = async (questionText = null) => {
    const query = (questionText || input).trim();
    if (!query || loading) return;

    const userMsgId = 'user_' + Date.now();
    const newUserMsg = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    if (!questionText) setInput('');
    setLoading(true);

    try {
      const payload = {
        question: query,
        fileName: selectedReport?.fileName || null,
        reportSummary: selectedReport?.aiSummary || ''
      };

      const res = await api.post('/api/rag/ask', payload);

      const botMsgId = 'bot_' + Date.now();
      const newBotMsg = {
        id: botMsgId,
        sender: 'bot',
        text: res.data.answer,
        sources: res.data.retrievedKnowledge || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, newBotMsg]);
    } catch (err) {
      console.error('RAG Chat request error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Error communicating with MedVault RAG Assistant.';
      setMessages(prev => [
        ...prev,
        {
          id: 'bot_err_' + Date.now(),
          sender: 'bot',
          isError: true,
          text: `⚠️ **Error:** ${errMsg}. Please try again or rephrase your question.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rag-chat-wrapper ${standalone ? 'standalone-page' : 'modal-drawer'}`}>
      {/* Header */}
      <div className="rag-chat-header">
        <div className="rag-chat-header-title">
          <div className="rag-ai-avatar">🧠</div>
          <div>
            <h3>MedVault Medical RAG Assistant</h3>
            <p>
              {selectedReport ? (
                <>Focus: <span className="report-target-name">{selectedReport.fileName}</span></>
              ) : (
                'Grounded with Verified Clinical Literature & Vector DB'
              )}
            </p>
          </div>
        </div>
        {onClose && (
          <button className="rag-chat-close-btn" onClick={onClose} aria-label="Close">✕</button>
        )}
      </div>

      {/* Messages area */}
      <div className="rag-chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`rag-message-row ${msg.sender}`}>
            {msg.sender === 'bot' && <div className="bot-avatar-tiny">🤖</div>}
            <div className={`rag-message-bubble ${msg.isError ? 'error-bubble' : ''}`}>
              <div className="rag-message-text">{msg.text}</div>

              {/* Retrieved Sources Drawer */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="rag-sources-section">
                  <button
                    type="button"
                    className="rag-sources-toggle"
                    onClick={() => toggleSource(msg.id)}
                  >
                    <span>📚 {msg.sources.length} Verified Reference {msg.sources.length === 1 ? 'Source' : 'Sources'}</span>
                    <span>{expandedSources[msg.id] ? '▲ Hide' : '▼ View'}</span>
                  </button>

                  {expandedSources[msg.id] && (
                    <div className="rag-sources-list">
                      {msg.sources.map((src, i) => (
                        <div key={i} className="rag-source-item">
                          <div className="rag-source-header">
                            <span className="rag-source-topic">{src.topic}</span>
                            <span className="rag-source-cat">{src.category}</span>
                          </div>
                          {src.normalRange && (
                            <div className="rag-source-range">
                              <strong>Reference Range:</strong> {src.normalRange}
                            </div>
                          )}
                          <div className="rag-source-db">Retrieved via: {src.source}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="rag-message-time">{msg.timestamp}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="rag-message-row bot">
            <div className="bot-avatar-tiny">🤖</div>
            <div className="rag-message-bubble loading-bubble">
              <div className="rag-pulse-loader">
                <span></span><span></span><span></span>
              </div>
              <span className="rag-loading-text">
                Querying medical vector database & reasoning with Gemini...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions */}
      <div className="rag-suggested-prompts">
        <div className="suggested-prompts-label">Suggested Questions:</div>
        <div className="suggested-prompts-chips">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              className="prompt-chip"
              onClick={() => handleSend(q)}
              disabled={loading}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input box */}
      <form
        className="rag-chat-input-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          type="text"
          className="rag-chat-input"
          placeholder={
            selectedReport
              ? "Ask anything about this report (e.g. 'What does elevated ALT mean?')..."
              : "Ask any medical question or query your reports..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="rag-chat-send-btn"
          disabled={loading || !input.trim()}
        >
          {loading ? '...' : 'Send'}
        </button>
      </form>

      {/* Clinical Disclaimer footer */}
      <div className="rag-disclaimer-bar">
        ⚠️ <strong>MedVault Note:</strong> RAG AI provides medical literacy & reference guidance grounded in clinical literature. Always consult a licensed healthcare professional for medical diagnosis and treatment decisions.
      </div>
    </div>
  );
}
