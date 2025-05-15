import React, { useState } from "react";

const DebugPanel = ({ schedule }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="debug-panel">
      <button onClick={() => setIsOpen(!isOpen)} className="debug-toggle">
        {isOpen ? "Hide Debug Info" : "Show Debug Info"}
      </button>

      {isOpen && (
        <div className="debug-content">
          <h3>Debug Information</h3>
          <p>Total Events: {schedule.length}</p>

          <h4>Event Data:</h4>
          <pre>{JSON.stringify(schedule, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
