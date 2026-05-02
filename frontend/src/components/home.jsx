import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getCurrentUser } from "../api/config";
import "./home.css";

const AfterLoginDashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const quickActions = [
    {
      icon: "📄",
      title: "View Reports",
      desc: "Browse and manage your medical records",
      href: "/reports",
      gradient: "linear-gradient(135deg, #0ea5e9, #0284c7)",
    },
    {
      icon: "📤",
      title: "Upload Report",
      desc: "Add a new scan, lab result, or prescription",
      href: "/upload",
      gradient: "linear-gradient(135deg, #06b6d4, #0891b2)",
    },
    {
      icon: "🔗",
      title: "Share Securely",
      desc: "Generate time-limited QR links for doctors",
      href: "/reports",
      gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    },
    {
      icon: "👤",
      title: "My Profile",
      desc: "Manage account settings and preferences",
      href: "/profile",
      gradient: "linear-gradient(135deg, #10b981, #059669)",
    },
  ];

  const stats = [
    { value: "256-bit", label: "AES Encryption", icon: "🔒" },
    { value: "15 min", label: "Share Link TTL", icon: "⏱️" },
    { value: "100%", label: "Private", icon: "🛡️" },
  ];

  return (
    <div className="dashboard-root">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar glass ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <span>🏥</span>
          <span>MedVault</span>
        </div>
        <nav className="sidebar-nav">
          <Link to="/home" className="sidebar-link active">🏠 Dashboard</Link>
          <Link to="/reports" className="sidebar-link">📄 My Reports</Link>
          <Link to="/upload" className="sidebar-link">📤 Upload</Link>
        </nav>
        <button className="sidebar-logout" onClick={handleLogout}>
          🚪 Logout
        </button>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="dashboard-main">
        {/* Top bar */}
        <header className="dashboard-topbar glass">
          <button
            className="hamburger"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <div className="topbar-greeting">
            <span className="greeting-text">
              Hello, <strong>{user?.username || "User"}</strong> 👋
            </span>
          </div>
          <div className="topbar-avatar">
            {(user?.username || "U")[0].toUpperCase()}
          </div>
        </header>

        {/* Page content */}
        <main className="dashboard-content">
          {/* Hero */}
          <section className="dash-hero">
            <div className="dash-hero-text">
              <h1>Your Medical Vault</h1>
              <p>Securely store, manage, and share your health records with end-to-end encryption.</p>
            </div>
            <div className="dash-hero-stats">
              {stats.map((s, i) => (
                <div className="stat-pill glass" key={i}>
                  <span className="stat-icon">{s.icon}</span>
                  <div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick actions */}
          <section className="dash-section">
            <h2 className="section-title">Quick Actions</h2>
            <div className="actions-grid">
              {quickActions.map((action, i) => (
                <Link to={action.href} key={i} className="action-card glass">
                  <div
                    className="action-icon-wrap"
                    style={{ background: action.gradient }}
                  >
                    <span className="action-icon">{action.icon}</span>
                  </div>
                  <div className="action-text">
                    <h3>{action.title}</h3>
                    <p>{action.desc}</p>
                  </div>
                  <span className="action-arrow">→</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Privacy notice */}
          <section className="dash-section">
            <div className="privacy-banner glass">
              <div className="privacy-icon">🔐</div>
              <div className="privacy-text">
                <h3>HIPAA-inspired Privacy</h3>
                <p>Your records never leave your control. All links expire automatically. Zero third-party data sharing.</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default AfterLoginDashboard;
