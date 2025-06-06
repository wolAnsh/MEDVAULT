import { useEffect, useState } from "react";
import axios from "axios";
import "./viewReports.css";

export default function ViewReports() {
  const userId = 107; // Replace with actual logged-in user ID dynamically if you have auth
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchReports() {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:5000/api/reports/getReports/${userId}`
        );
        setReports(res.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load reports.");
        setLoading(false);
      }
    }
    fetchReports();
  }, [userId]);

  return (
    <div className="reports-container">
      <h1>My Medical Reports</h1>
      {loading && <p>Loading reports...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && reports.length === 0 && <p>No reports found.</p>}

      <div className="reports-list">
        {reports.map((report, idx) => (
          <div key={idx} className="report-card">
            <h3>{report.fileName}</h3>
            <p>{report.description || "No description"}</p>
            <a
              href={report.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="view-link"
            >
              View Report
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
