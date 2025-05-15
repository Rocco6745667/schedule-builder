import React, { useState, useEffect } from "react";
import { fetchSchedule } from "../services/api";

const ApiTest = () => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const testApi = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSchedule();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="api-test">
      <h3>API Connection Test</h3>
      <button onClick={testApi} disabled={loading}>
        {loading ? "Testing..." : "Test API Connection"}
      </button>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="result">
          <p>Connection successful! Received {result.length} events.</p>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default ApiTest;
