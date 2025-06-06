import React from "react";
import "./home.css";

const AfterLoginDashboard = () => {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const features = [
    {
      icon: "📄",
      title: "Secure Reports",
      desc: "Store and view your medical records safely.",
    },
    {
      icon: "📤",
      title: "Upload Reports",
      desc: "Easily upload new medical reports.",
    },
    {
      icon: "🔒",
      title: "Private & Encrypted",
      desc: "Your data is encrypted and private.",
    },
    {
      icon: "⏳",
      title: "Time-Limited Sharing",
      desc: "Share reports with doctors for a limited time.",
    },
  ];

  return (
    <div>
      {/* Navbar */}
      <nav className="dashboard-navbar">
        <div className="logo">MedVault</div>
        <div className="account-section">👤 Account</div>
      </nav>

      {/* Hero Section */}
      <div className="hero-section">
        <h1>Welcome to MedVault</h1>
        <p>Your personal, encrypted medical records vault.</p>
        <div className="dashboard-actions">
          <a href="/reports" className="btn">
            📄 View My Reports
          </a>
          <a href="/upload" className="btn">
            📤 Upload Report
          </a>
          <a href="/profile" className="btn">
            👤 My Profile
          </a>
          <button className="btn logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        {features.map((f, i) => (
          <div className="feature-card" key={i}>
            <h2>{f.icon}</h2>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>&copy; 2025 MedVault. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AfterLoginDashboard;
