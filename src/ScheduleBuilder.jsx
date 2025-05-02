import React, { useEffect, useState } from "react";
import "./styles.css";

// Updated to include all 24 hours
const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

// Updated to include all 7 days of the week
const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function ScheduleBuilder() {
  const [schedule, setSchedule] = useState([]);
  const [formData, setFormData] = useState({
    course: "",
    day: "Monday",
    startTime: "",
    endTime: "",
  });
  const [error, setError] = useState("");

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("schedule");
      if (saved) setSchedule(JSON.parse(saved));
    } catch (err) {
      console.error("Error loading from localStorage:", err);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("schedule", JSON.stringify(schedule));
    } catch (err) {
      console.error("Error saving to localStorage:", err);
    }
  }, [schedule]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  // Fixed time comparison function
  const timesOverlap = (start1, end1, start2, end2) => {
    // Convert times to comparable format
    return !(end1 <= start2 || start1 >= end2);
  };

  const addToSchedule = () => {
    const { course, day, startTime, endTime } = formData;

    if (!course || !startTime || !endTime) {
      setError("Please fill out all fields.");
      return;
    }

    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }

    const conflict = schedule.some(
      (item) =>
        item.day === day &&
        timesOverlap(startTime, endTime, item.startTime, item.endTime)
    );

    if (conflict) {
      setError("Schedule conflict detected!");
      return;
    }

    setSchedule((prev) => [...prev, { ...formData }]);
    setFormData({ course: "", day: "Monday", startTime: "", endTime: "" });
    setError("");
  };

  // Add function to clear the schedule
  const clearSchedule = () => {
    setSchedule([]);
    try {
      localStorage.removeItem("schedule");
    } catch (err) {
      console.error("Error clearing localStorage:", err);
    }
  };

  // Helper function to check if an event should be displayed in a time slot
  const shouldDisplayEvent = (event, hour) => {
    const hourNum = parseInt(hour.split(":")[0], 10);
    const eventStartHour = parseInt(event.startTime.split(":")[0], 10);
    const eventEndHour = parseInt(event.endTime.split(":")[0], 10);

    // Handle minutes
    const eventStartMinutes = parseInt(event.startTime.split(":")[1], 10) || 0;
    const eventEndMinutes = parseInt(event.endTime.split(":")[1], 10) || 0;

    // Convert to decimal hours for comparison
    const eventStart = eventStartHour + eventStartMinutes / 60;
    const eventEnd = eventEndHour + eventEndMinutes / 60;

    return eventStart <= hourNum && eventEnd > hourNum;
  };

  return (
    <div className="schedule-builder">
      <h1>Schedule Builder</h1>

      <div className="form">
        <input
          type="text"
          name="course"
          placeholder="Course Name"
          value={formData.course}
          onChange={handleChange}
        />
        <select name="day" value={formData.day} onChange={handleChange}>
          {days.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <input
          type="time"
          name="startTime"
          value={formData.startTime}
          onChange={handleChange}
        />
        <input
          type="time"
          name="endTime"
          value={formData.endTime}
          onChange={handleChange}
        />
        <button onClick={addToSchedule}>Add</button>
        <button onClick={clearSchedule} className="clear-button">
          Clear Schedule
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <h2>Weekly Calendar</h2>

      {/* Updated calendar view with scrollable container */}
      <div className="calendar-container">
        <div className="calendar">
          <div className="calendar-header">
            <div className="time-slot" />
            {days.map((day) => (
              <div className="day-column-header" key={day}>
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {hours.map((hour, i) => (
              <React.Fragment key={i}>
                <div className="time-slot">{hour}</div>
                {days.map((day) => (
                  <div className="calendar-cell" key={`${day}-${i}`}>
                    {schedule
                      .filter(
                        (item) =>
                          item.day === day && shouldDisplayEvent(item, hour)
                      )
                      .map((item, index) => (
                        <div
                          className="calendar-event"
                          key={`${index}-${item.course}`}
                        >
                          {item.course}
                        </div>
                      ))}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
