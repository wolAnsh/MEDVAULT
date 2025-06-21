
# MedVault

MedVault is a secure and user-friendly platform designed to store, manage, and share medical reports effortlessly. It enables patients to upload their medical records and share them with doctors through shareable codes, with control over access duration and easy patient history tracking.

---

## Features

- **Secure Storage:** Upload and store medical reports safely.
- **Shareable Codes:** Generate unique codes to share reports with doctors.
- **Time-bound Sharing:** Control how long reports remain accessible.
- **Patient History Tracking:** Maintain a timeline of all medical records.
- **User Authentication:** Secure login and signup functionality with JWT-based authentication.

---

## Future Enhancements

- Integration of AI-based report analysis and insights.

---

## Tech Stack

- **Frontend:** React.js
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Authentication:** JSON Web Tokens (JWT)

---

## Getting Started

Follow these steps to get a local development environment up and running.

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- MongoDB (local or cloud instance)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/wolAnsh/MEDVAULT.git
   cd MEDVAULT
````

2. **Setup Backend**

   ```bash
   cd backend
   npm install      # or yarn install
   ```

3. **Configure Environment Variables**

   Create a `.env` file in `backend/` with the following variables:

   ```dotenv
   PORT=5000
   MONGODB_URI=<your_mongodb_connection_string>
   JWT_SECRET=<your_jwt_secret>
   TOKEN_EXPIRES_IN=1d
   ```

4. **Start Backend Server**

   ```bash
   npm run dev      # runs with nodemon
   # or
   npm start
   ```

5. **Setup Frontend**

   ```bash
   cd ../frontend
   npm install      # or yarn install
   ```

6. **Configure Frontend**

   In `frontend/src/config.js`, update the API endpoint:

   ```js
   export const API_BASE_URL = 'http://localhost:5000/api';
   ```

7. **Start Frontend**

   ```bash
   npm start       # runs React app at http://localhost:3000
   ```

---

## Usage

1. **Register a New User**: Create an account via the signup page.
2. **Login**: Obtain a JWT after successful authentication.
3. **Upload Reports**: Use the dashboard to upload PDF or image medical reports.
4. **Generate Shareable Codes**: Click on a report to generate a time-bound access code.
5. **View History**: Navigate the history tab to see all previously uploaded reports.

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -m 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Open a Pull Request

Please ensure your code adheres to the existing style and that all tests pass.


```
```
