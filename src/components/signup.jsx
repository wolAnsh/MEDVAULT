import React from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

const Signup = () => {
  return (
    <div className="auth-container">
      <h2>Create your MedVault account</h2>
      <form className="auth-form">
        <input type="text" placeholder="Full Name" required />
        <input type="email" placeholder="Email" required />
        <input type="password" placeholder="Password" required />
        <button type="submit">Sign Up</button>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;
