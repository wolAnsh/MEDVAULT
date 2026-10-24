import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Navigation } from "./components/navigation";
import { Header } from "./components/header";
import { Features } from "./components/features";
import { About } from "./components/about";
import { Services } from "./components/services";
import { Testimonials } from "./components/testimonials";
import { Team } from "./components/Team";
import { Contact } from "./components/contact";
import JsonData from "./data/data.json";
import SmoothScroll from "smooth-scroll";
import SharedReport from "./pages/SharedReport";
import Login from "./components/login";
import Signup from "./components/signup";
import Home from "./components/home";
import Medupload from "./components/medupload";
import ViewReports from "./components/viewReports";
import VitalsTracker from "./components/vitals";
import Profile from "./components/profile";
import AuthGuard from "./components/AuthGuard";
import MedicalRagChatPage from "./pages/MedicalRagChatPage";
import "./App.css";

export const scroll = new SmoothScroll('a[href*="#"]', {
  speed: 1000,
  speedAsDuration: true,
});

const LandingPage = ({ data }) => (
  <div>
    <Navigation />
    <Header data={data.Header} />
    <Features data={data.Features} />
    <About data={data.About} />
    <Services data={data.Services} />
    <Testimonials data={data.Testimonials} />
    <Team data={data.Team} />
    <Contact data={data.Contact} />
  </div>
);

const App = () => {
  const [landingPageData, setLandingPageData] = useState({});
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    setLandingPageData(JsonData);
  }, []);

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage data={landingPageData} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/shared/:token" element={<SharedReport />} />

          {/* Protected routes — require valid JWT */}
          <Route path="/home" element={<AuthGuard><Home /></AuthGuard>} />
          <Route path="/upload" element={<AuthGuard><Medupload /></AuthGuard>} />
          <Route path="/reports" element={<AuthGuard><ViewReports /></AuthGuard>} />
          <Route path="/vitals" element={<AuthGuard><VitalsTracker /></AuthGuard>} />
          <Route path="/chat" element={<AuthGuard><MedicalRagChatPage /></AuthGuard>} />
          <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
