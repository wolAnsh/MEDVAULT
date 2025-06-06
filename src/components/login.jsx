import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // Normally you'd check credentials here.
    // For now — just redirecting to /dashboard
    navigate("/home");
  };

  return (
    <div className="auth-container">
      <h2>Login to MedVault</h2>
      <form className="auth-form" onSubmit={handleLogin}>
        <input type="email" placeholder="Email" required />
        <input type="password" placeholder="Password" required />
        <button type="submit">Login</button>
        <p>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
