# 🏥 MedVault

> **MedVault** is a secure, intelligent medical document vault and health tracking platform designed to streamline medical report management, leverage AI for medical insights, and enable time-bound, secure record sharing between patients and healthcare professionals.

---

[![React](https://img.shields.io/badge/Frontend-React%2018-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Framework-Express%20v4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Cloudinary](https://img.shields.io/badge/Storage-Cloudinary-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Google Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

---

## 📋 Table of Contents

- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Screenshots](#-screenshots)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Installation \& Execution](#installation--execution)
- [API Reference](#-api-reference)
  - [Authentication Routes](#authentication-routes)
  - [Medical Report Routes](#medical-report-routes)
  - [Vitals Telemetry Routes](#vitals-telemetry-routes)
- [Security Features](#-security-features)
- [Future Roadmap](#-future-roadmap)
- [License \& Credits](#-license--credits)

---

## ✨ Features

- **🛡️ Secure Storage & Cloud Delivery:** Upload and store medical reports safely with Cloudinary CDN integration and MongoDB mapping.
- **🤖 AI-Powered Medical Report Analysis:** Automated extraction of primary findings, diagnoses, and lab values powered by Google Gemini AI.
- **📈 Automated Vitals Extraction:** Intelligent parsing of telemetry data (Blood Pressure, Heart Rate, Temperature, SpO2) directly from uploaded diagnostic documents into user health records.
- **⏳ Time-Bound Access & QR Sharing:** Generate unique shareable links and instant QR codes with configurable Time-To-Live (TTL) for secure, temporary doctor access.
- **🔐 Multi-Method Authentication:** Supports traditional email/password login with OTP email verification (via Nodemailer) as well as Google 1-Tap OAuth 2.0.
- **📊 Health Telemetry Tracking:** Log, monitor, and view patient vitals history over time.
- **⚡ Rate Limiting & Security Hardening:** Endpoint protection via `express-rate-limit`, CORS origin checking, and JWT verification middleware.

---

## 🏗️ System Architecture

```
  ┌─────────────────────────────────────────────────────────┐
  │                    React 18 Frontend                    │
  │        (User Dashboard, Upload, Vitals, QR Code)        │
  └────────────────────────────┬────────────────────────────┘
                               │ HTTPS / JSON API
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │                   Express Node.js API                   │
  │     (Auth Limiter, JWT Verification, Controllers)      │
  └──────┬─────────────────────┬────────────────────┬───────┘
         │                     │                    │
         ▼                     ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   MongoDB Atlas  │  │  Cloudinary CDN  │  │ Google Gemini AI │
│ (Users, Reports, │  │ (Encrypted File  │  │ (Lab Summary &   │
│ Vitals Telemetry)│  │    Document)     │  │ Auto-Vitals)     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18
- **Routing:** React Router v7
- **HTTP Client:** Axios
- **Authentication:** `@react-oauth/google`
- **Email Service:** `emailjs-com`
- **UI & UX:** Vanilla CSS, Smooth Scroll

### Backend
- **Runtime:** Node.js, Express.js
- **Database:** MongoDB with Mongoose ORM
- **AI Intelligence:** `@google/generative-ai` (Gemini API)
- **Cloud Storage:** Cloudinary SDK
- **Security:** `jsonwebtoken` (JWT), `bcryptjs`, `express-rate-limit`, `cors`
- **Utilities:** `multer` (memory buffering), `qrcode` (QR code generation), `nodemailer` (OTP email delivery)

---

## 📸 Screenshots

Below are key UI screenshots from the MedVault application:

| Feature | Preview |
| :--- | :--- |
| **Report Upload & Cloud Sync** | ![Upload Report](https://github.com/user-attachments/assets/2c14602c-c433-4f7a-8991-a1a40fe47c44) |
| **Shareable Code & QR Generation** | ![Shareable Code Generation](https://github.com/user-attachments/assets/d8e7b08e-5e87-444b-9a55-55440d083058) |
| **Time-Bound Access Control** | ![Time-bound Access](https://github.com/user-attachments/assets/de16b8a7-b702-40ae-a840-14a93625273b) |
| **Patient History & Timeline** | ![Patient History](https://github.com/user-attachments/assets/5bc1374b-f0c3-4e66-b591-cdea57685409) |
| **Authentication & OTP Verification** | ![Authentication Flow](https://github.com/user-attachments/assets/5092b4fa-9622-4fb8-950a-b54481d9c4d1) |
| **Cloudinary Integration** | ![Cloudinary Integration](https://github.com/user-attachments/assets/ac38a710-707c-49e9-861b-0f07af8f427e) |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed and configured before running the application:
- **Node.js** (v16.x or higher)
- **npm** or **yarn**
- **MongoDB** (Local instance or MongoDB Atlas connection URI)
- **Cloudinary Account** (for document uploads)
- **Google Gemini API Key** (for AI analysis feature)

---

### Environment Configuration

#### 1. Backend Environment Variables (`backend/.env`)

Create a `.env` file inside the `backend` directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/MEDVAULT_REPORTS

# JWT Configuration
JWT_SECRET=your_strong_random_jwt_secret_here_min_64_chars

# Cloudinary Setup
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Feature (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# Server Config
PORT=5000
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
SHARE_LINK_TTL_MINUTES=60

# Nodemailer SMTP Setup
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_digit_app_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

#### 2. Frontend Environment Variables (`frontend/.env`)

Create a `.env` file inside the `frontend` directory:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

---

### Installation & Execution

#### Step 1: Clone the repository
```bash
git clone https://github.com/wolAnsh/MEDVAULT.git
cd React-Landing-Page-Template
```

#### Step 2: Start Backend Server
```bash
cd backend
npm install
npm run dev
```
*The backend API will start running at `http://localhost:5000`.*

#### Step 3: Start Frontend Client
In a new terminal window:
```bash
cd frontend
npm install
npm start
```
*The React application will launch at `http://localhost:3000`.*

---

## 📡 API Reference

### Authentication Routes (`/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/signup` | Public | Register new user details and trigger email OTP |
| `POST` | `/auth/verify-otp` | Public | Verify OTP code and complete user registration |
| `POST` | `/auth/resend-otp` | Public | Resend verification OTP code |
| `POST` | `/auth/login` | Public | Authenticate user credentials and return JWT |
| `POST` | `/auth/google` | Public | Google OAuth 2.0 token verification & sign in |
| `GET` | `/auth/me` | Protected | Fetch current logged-in user profile |
| `PUT` | `/auth/profile` | Protected | Update profile metadata (age, weight, height, etc.) |

---

### Medical Report Routes (`/api/reports`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/reports/addReport` | Protected | Store uploaded report details in MongoDB |
| `GET` | `/api/reports/getReports` | Protected | Retrieve all reports belonging to user |
| `DELETE` | `/api/reports/deleteReport/:fileName` | Protected | Remove a report from user's vault |
| `PUT` | `/api/reports/updateDescription/:fileName` | Protected | Update report description |
| `PUT` | `/api/reports/updateAiSummary/:fileName` | Protected | Save AI summary for a specific report |
| `POST` | `/api/reports/analyze` | Protected | Analyze report using Gemini AI & auto-extract vitals |
| `POST` | `/api/reports/generate-share-link/:fileName` | Protected | Generate time-bound tokenized share link & QR code |
| `GET` | `/api/reports/shared/:token` | Public | Access shared report using valid temporary token |

---

### Vitals Telemetry Routes (`/api/vitals`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/vitals/add` | Protected | Log a new vitals entry (BP, heart rate, temp, SpO2) |
| `GET` | `/api/vitals/` | Protected | Fetch patient vitals history |

---

## 🔒 Security Features

- **JWT Authentication:** Stateful token validation with expiration policy.
- **Bcrypt Hashing:** Passwords hashed with salt rounds prior to persistence.
- **Rate Limiting:** Express rate limiters protect auth routes (max 20 requests / 15 min) and share link generation (max 30 requests / 5 min).
- **Time-Bound Sharing Tokens:** Cryptographically random access tokens with backend-enforced TTL expiration.
- **CORS Restriction:** Configurable origin whitelisting for backend endpoints.

---

## 🔮 Future Roadmap

- [ ] AI-driven health trends prediction & anomaly detection over historical vitals.
- [ ] Integration with FHIR / HL7 international healthcare standards.
- [ ] Multi-language report translation using AI.
- [ ] Cross-platform mobile app (React Native).

---

## 👤 Author & License

- **Author:** Anshu Kumar
- **License:** [ISC License](LICENSE)
