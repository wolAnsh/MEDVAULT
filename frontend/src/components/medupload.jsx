import { useState } from 'react'
import axios from 'axios'
import './medupload.css'
const userId = 107


export default function UploadPage() {
  const [file, setFile] = useState(null)
  const [uploadUrl, setUploadUrl] = useState("")
  
  const handleUpload = async () => {
    try {
      const uniqueInt = Date.now(); // or any unique number generator
      const formData = new FormData()
      const filename = `${userId}_${uniqueInt}`

      formData.append("file", file)
      formData.append("upload_preset", "MEDVAULT_reports")
      formData.append("folder", `user_${userId}`)  
      formData.append("public_id", filename)

      // Upload to Cloudinary
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dowslza4c/upload", // Replace with your Cloud name
        formData
      )

      const uploadedUrl = response.data.secure_url
      setUploadUrl(uploadedUrl)

      // Now send this info to your backend to save in MongoDB
      await axios.post("http://localhost:5000/api/reports/addReport", {
        userId: "107",            // Replace with logged-in user's ID
        fileUrl: uploadedUrl,
        fileName: filename,
        description: "X-Ray Chest Report"  // You can replace this with a state from an input if you want
      })

    } catch (error) {
      console.error("Upload failed:", error)
      // Optionally show error UI here
    }
  }


  return (
    <div className="upload-container">
      <div className="upload-card">
        <h1 className="upload-title">Upload Medical Report</h1>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="upload-input"
        />

        <button
          onClick={handleUpload}
          className="upload-button"
        >
          Upload
        </button>

        {uploadUrl && (
          <div className="upload-result">
            <p>✅ File uploaded successfully!</p>
            <a
              href={uploadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="upload-link"
            >
              👉 View File
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
