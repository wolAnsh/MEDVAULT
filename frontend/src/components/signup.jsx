import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import api from "../api/config";
import "./Auth.css";

const Signup = () => {
  const [step, setStep] = useState(1); // 1: Details, 2: OTP verification
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    age: "",
    height: "",
    weight: "",
    bloodType: "A+"
  });
  const [otp, setOtp] = useState("");
  const [resendMessage, setResendMessage] = useState("");
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

  // Step 1: Submit signup details & send OTP
  const handleSubmitDetails = async (e) => {
    e.preventDefault();
    if (strength.level < 2) {
      setError("Please choose a stronger password (at least 6 characters).");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/signup", formData);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/auth/verify-otp", {
        email: formData.email,
        otp
      });
      localStorage.setItem("token", response.data.token);
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError("");
    setResendMessage("");
    try {
      await api.post("/auth/resend-otp", { email: formData.email });
      setResendMessage("A new 6-digit verification code has been sent!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/auth/google", {
        token: credentialResponse.credential
      });
      localStorage.setItem("token", response.data.token);
      navigate("/home");
    } catch (err) {
      setError(err.response?.data?.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-in failed. Please try again.");
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

        <h1 className="auth-title">
          {step === 1 ? "Create account" : "Verify Your Email"}
        </h1>
        <p className="auth-subtitle">
          {step === 1
            ? "Your medical records, secured and private"
            : `Enter the 6-digit code sent to ${formData.email}`}
        </p>

        {error && (
          <div className="auth-error" role="alert">
            <span>⚠️</span> {error}
          </div>
        )}

        {resendMessage && (
          <div className="auth-success" style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '15px'
          }}>
            <span>✅</span> {resendMessage}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSubmitDetails} className="auth-form">
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
                placeholder="Min. 6 characters"
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

            {/* Health & Demographic Fields */}
            <div className="auth-grid-2">
              <div className="auth-field">
                <label htmlFor="age">Age (yrs)</label>
                <input
                  id="age"
                  type="number"
                  name="age"
                  placeholder="25"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="bloodType">Blood Type</label>
                <select
                  id="bloodType"
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={handleChange}
                  className="auth-select"
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

            <div className="auth-grid-2">
              <div className="auth-field">
                <label htmlFor="height">Height (cm)</label>
                <input
                  id="height"
                  type="number"
                  name="height"
                  placeholder="175"
                  min="30"
                  max="250"
                  value={formData.height}
                  onChange={handleChange}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="weight">Weight (kg)</label>
                <input
                  id="weight"
                  type="number"
                  name="weight"
                  placeholder="70"
                  min="1"
                  max="300"
                  value={formData.weight}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? <span className="spinner" /> : "Continue & Send Code 📩"}
            </button>
          </form>
        ) : (
          /* Step 2: OTP Verification Form */
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="auth-field">
              <label htmlFor="otp">Verification Code (OTP)</label>
              <input
                id="otp"
                type="text"
                name="otp"
                placeholder="123456"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                style={{
                  fontSize: '22px',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  fontWeight: '700'
                }}
              />
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? <span className="spinner" /> : "Verify & Complete Signup ✨"}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => setStep(1)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}
              >
                ← Edit details
              </button>
              <button
                type="button"
                className="auth-link-btn"
                onClick={handleResendOtp}
                disabled={loading}
                style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
              >
                Resend Code 🔄
              </button>
            </div>
          </form>
        )}

        {step === 1 && (
          <>
            <div className="auth-divider">
              <span>or sign up with</span>
            </div>

            <div className="google-btn-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
              />
            </div>
          </>
        )}

        <p className="auth-switch">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
