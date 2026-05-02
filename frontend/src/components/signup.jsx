import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/config";
import "./Auth.css";

const Signup = () => {
  const [formData, setFormData] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const passwordStrength = (pwd) => {
    if (pwd.length === 0) return { level: 0, label: "", color: "" };
    if (pwd.length < 6)   return { level: 1, label: "Weak",   color: "#ef4444" };
    if (pwd.length < 10)  return { level: 2, label: "Fair",   color: "#f59e0b" };
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && pwd.length >= 10)
                          return { level: 4, label: "Strong", color: "#10b981" };
    return               { level: 3, label: "Good",   color: "#0ea5e9" };
  };

  const strength = passwordStrength(formData.password);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (strength.level < 2) {
      setError("Please choose a stronger password (at least 6 characters).");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/signup", formData);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />

      <div className="auth-card glass">
        <div className="auth-logo">
          <span className="auth-logo-icon">🏥</span>
          <span className="auth-logo-text">MedVault</span>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Your medical records, secured and private</p>

        {error && (
          <div className="auth-error" role="alert">
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="username">Full name</label>
            <input
              id="username"
              type="text"
              name="username"
              placeholder="John Doe"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="name"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Min. 8 characters"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
            {formData.password.length > 0 && (
              <div className="password-strength">
                <div className="strength-bars">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="strength-bar"
                      style={{
                        background: i <= strength.level ? strength.color : 'rgba(255,255,255,0.1)'
                      }}
                    />
                  ))}
                </div>
                <span style={{ color: strength.color, fontSize: '12px' }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
