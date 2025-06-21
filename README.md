# MedVault

MedVault is a secure and user-friendly platform designed to store, manage, and share medical reports effortlessly. It enables patients to upload their medical records and share them with doctors through shareable codes, with control over access duration and easy patient history tracking.

---

## Features

- **Secure Storage:** Upload and store medical reports safely in Cloudinary.
- **Shareable Codes:** Generate unique codes to share reports with doctors.
- **Time-bound Sharing:** Control how long reports remain accessible.
- **Patient History Tracking:** Maintain a timeline of all medical records.
- **User Authentication:** Secure login and signup functionality with JWT-based authentication.

---

## Tech Stack

- **Frontend:** React.js
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **File Storage & CDN:** Cloudinary
- **Authentication:** JSON Web Tokens (JWT)

---

## Implementation Details

- **Report Storage:** All uploaded medical reports are stored on Cloudinary, leveraging its CDN for fast and reliable access.
- **Database Mapping:** Each report URL from Cloudinary is mapped to a unique identifier string in MongoDB, ensuring efficient retrieval and secure access control.
- **Shareable Codes:** Unique shareable codes reference the mapped identifiers, with expiration timestamps enforced by the backend.

---

## Future Enhancements

- Integration of AI-based report analysis and insights.
```

![image](https://github.com/user-attachments/assets/2c14602c-c433-4f7a-8991-a1a40fe47c44)
![image](https://github.com/user-attachments/assets/d8e7b08e-5e87-444b-9a55-55440d083058)
![image](https://github.com/user-attachments/assets/de16b8a7-b702-40ae-a840-14a93625273b)
![image](https://github.com/user-attachments/assets/5bc1374b-f0c3-4e66-b591-cdea57685409)
![image](https://github.com/user-attachments/assets/5092b4fa-9622-4fb8-950a-b54481d9c4d1)
![image](https://github.com/user-attachments/assets/ac38a710-707c-49e9-861b-0f07af8f427e)

