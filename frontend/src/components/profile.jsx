import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api, { getCurrentUser } from "../api/config";
import "./profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [profile, setProfile] = useState({
    username: "",
    email: "",
    age: "",
    height: "",
    weight: "",
    bloodType: "A+",
    isVerified: false
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/me");
      setProfile({
        username: res.data.username || currentUser?.username || "",
        email: res.data.email || currentUser?.email || "",
        age: res.data.age || "",
        height: res.data.height || "",
        weight: res.data.weight || "",
        bloodType: res.data.bloodType || "A+",
        isVerified: res.data.isVerified || false
      });
    } catch (err) {
      console.error("Fetch profile error:", err);
      // Fallback to local user
      setProfile(prev => ({
        ...prev,
        username: currentUser?.username || "",
        email: currentUser?.email || ""
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setMessage("");
    setError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await api.put("/auth/profile", {
        username: profile.username,
        age: profile.age,
        height: profile.height,
        weight: profile.weight,
        bloodType: profile.bloodType
      });

      setMessage("Profile details saved successfully!");
      // Update local storage user if returned
      if (res.data.user) {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
          // Keep token valid
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // BMI Calculation
  const calculateBMI = () => {
    const h = Number(profile.height) / 100; // in meters
    const w = Number(profile.weight); // in kg
    if (!h || !w || h <= 0 || w <= 0) return null;

    const bmi = (w / (h * h)).toFixed(1);
    let category = "Normal";
    let color = "#10b981";

    if (bmi < 18.5) {
      category = "Underweight";
      color = "#38bdf8";
    } else if (bmi >= 18.5 && bmi <= 24.9) {
      category = "Normal Weight";
      color = "#10b981";
    } else if (bmi >= 25 && bmi <= 29.9) {
      category = "Overweight";
      color = "#f59e0b";
    } else {
      category = "Obese";
      color = "#ef4444";
    }

    return { bmi, category, color };
  };

  const bmiData = calculateBMI();

  return (
    <div className="dashboard-root">
      {/* Sidebar Navigation */}
      <aside className={`dashboard-sidebar glass ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <span>🏥</span>
          <span>MedVault</span>
        </div>
        <nav className="sidebar-nav">
          <Link to="/home" className="sidebar-link">🏠 Dashboard</Link>
          <Link to="/reports" className="sidebar-link">📄 My Reports</Link>
          <Link to="/upload" className="sidebar-link">📤 Upload</Link>
          <Link to="/vitals" className="sidebar-link">💓 Health Vitals</Link>
          <Link to="/profile" className="sidebar-link active">👤 Profile</Link>
        </nav>
        <button className="sidebar-logout" onClick={handleLogout}>
          🚪 Logout
        </button>
      </aside>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content Area */}
      <div className="dashboard-main">
        <header className="dashboard-topbar glass">
          <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <div className="topbar-greeting">
            <span className="greeting-text">
              My Profile & Health Metrics
            </span>
          </div>
          <div className="topbar-avatar">
            {(profile.username || "U")[0].toUpperCase()}
          </div>
        </header>

        <main className="dashboard-content">
          <div className="profile-container">
            {/* Header Card */}
            <div className="profile-header-card glass">
              <div className="profile-avatar-large">
                {(profile.username || "U")[0].toUpperCase()}
              </div>
              <div className="profile-header-text">
                <h2>{profile.username || "User"}</h2>
                <p>{profile.email}</p>
                <span className={`status-badge ${profile.isVerified ? "verified" : "unverified"}`}>
                  {profile.isVerified ? "✅ Verified Account" : "⚠️ E2EE Account"}
                </span>
              </div>
            </div>

            {message && <div className="profile-alert success">✅ {message}</div>}
            {error && <div className="profile-alert error">⚠️ {error}</div>}

            {loading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <span className="spinner" />
              </div>
            ) : (
              <div className="profile-grid">
                {/* Form Card */}
                <form onSubmit={handleSave} className="profile-form-card glass">
                  <h3>👤 Personal Information</h3>

                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="username"
                      value={profile.username}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      style={{ opacity: 0.6, cursor: "not-allowed" }}
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Age (years)</label>
                      <input
                        type="number"
                        name="age"
                        placeholder="e.g. 28"
                        value={profile.age}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Blood Type</label>
                      <select
                        name="bloodType"
                        value={profile.bloodType}
                        onChange={handleChange}
                        className="profile-select"
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Height (cm)</label>
                      <input
                        type="number"
                        name="height"
                        placeholder="e.g. 175"
                        value={profile.height}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Weight (kg)</label>
                      <input
                        type="number"
                        name="weight"
                        placeholder="e.g. 70"
                        value={profile.weight}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <button type="submit" className="profile-save-btn" disabled={saving}>
                    {saving ? <span className="spinner" /> : "Save Profile Details ✨"}
                  </button>
                </form>

                {/* Side Stats & BMI Card */}
                <div className="profile-stats-column">
                  {/* BMI Card */}
                  <div className="bmi-card glass">
                    <div className="bmi-header">
                      <span>⚖️ Body Mass Index (BMI)</span>
                    </div>
                    {bmiData ? (
                      <div className="bmi-body">
                        <div className="bmi-value" style={{ color: bmiData.color }}>
                          {bmiData.bmi}
                        </div>
                        <div className="bmi-badge" style={{ background: `${bmiData.color}22`, color: bmiData.color, border: `1px solid ${bmiData.color}55` }}>
                          {bmiData.category}
                        </div>
                        <p className="bmi-desc">Calculated automatically from your height and weight.</p>
                      </div>
                    ) : (
                      <div className="bmi-empty">
                        <p>Enter your height & weight to calculate your BMI rating.</p>
                      </div>
                    )}
                  </div>

                  {/* Security Specs Card */}
                  <div className="security-card glass">
                    <h4>🛡️ Security Specifications</h4>
                    <ul>
                      <li>🔐 Zero-Knowledge AES-GCM Encrypted</li>
                      <li>📨 Nodemailer Verified Credentials</li>
                      <li>⚡ Local Cryptographic Decryption</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
