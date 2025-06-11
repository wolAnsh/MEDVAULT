import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function SharedReport() {
  const { token } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/reports/shared/${token}`);
        setReport(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Error loading report");
      }
    };
    fetchReport();
  }, [token]);

  if (error) return <h2>{error}</h2>;
  if (!report) return <h2>Loading...</h2>;

  return (
    <div>
      <h1>{report.title}</h1>
      <p>{report.description}</p>
      {/* more fields if needed */}
    </div>
  );
}

export default SharedReport;
