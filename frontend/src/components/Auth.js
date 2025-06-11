import React, { useState } from "react";
import { signup, login } from "../api/auth";

const Auth = ({ type }) => {
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = type === "signup" ? await signup(formData) : await login(formData);
    console.log(response.data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
      />
      <button type="submit">{type === "signup" ? "Sign Up" : "Login"}</button>
    </form>
  );
};

export default Auth;
