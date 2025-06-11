import axios from "axios";

const API_URL = "http://localhost:5000/auth";

export const signup = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/signup`, userData);
    return response.data;
  } catch (error) {
    console.error("Signup error:", error.response?.data?.message || error.message);
    throw error;
  }
};

export const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    return response.data;
  } catch (error) {
    console.error("Login error:", error.response?.data?.message || error.message);
    throw error;
  }
};
