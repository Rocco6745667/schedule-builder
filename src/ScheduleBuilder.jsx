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

// Color options for events
const colorOptions = [
  "#4CAF50", // Green
  "#2196F3", // Blue
  "#F44336", // Red
  "#FF9800", // Orange
  "#9C27B0", // Purple
  "#00BCD4", // Cyan
  "#795548", // Brown
  "#607D8B", // Blue Grey
];

export default function ScheduleBuilder() {
  const [schedule, setSchedule] = useState([]);
  const [formData, setFormData] = useState({
    course: "",
    day: "Monday",
    startTime: "",
    endTime: "",
    description: "",
    color: colorOptions[0],
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

  const timesOverlap = (start1, end1, start2, end2) =>
    !(end1 <= start2 || start1 >= end2);

  const addToSchedule = () => {
    const { course, day, startTime, endTime, description, color } = formData;

    if (!course || !startTime || !endTime) {
      setError("Please fill out all required fields.");
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
    setFormData({
      course: "",
      day: "Monday",
      startTime: "",
      endTime: "",
      description: "",
      color: colorOptions[Math.floor(Math.random() * colorOptions.length)],
    });
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

  // Function to remove a specific event
  const removeEvent = (index) => {
    setSchedule((prev) => prev.filter((_, i) => i !== index));
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
        <div className="form-group">
          <label htmlFor="course">Course Name*</label>
          <input
            type="text"
            id="course"
            name="course"
            placeholder="Event Name"
            value={formData.course}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="day">Day*</label>
          <select
            id="day"
            name="day"
            value={formData.day}
            onChange={handleChange}
          >
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="startTime">Start Time*</label>
          <input
            type="time"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="endTime">End Time*</label>
          <input
            type="time"
            id="endTime"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            placeholder="Add a description (optional)"
            value={formData.description}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <div className="form-group">
          <label htmlFor="color">Event Color</label>
          <select
            id="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            style={{ backgroundColor: formData.color, color: "white" }}
          >
            {colorOptions.map((color, index) => (
              <option
                key={index}
                value={color}
                style={{ backgroundColor: color, color: "white" }}
              >
                Color {index + 1}
              </option>
            ))}
          </select>
        </div>

        <div className="form-buttons">
          <button onClick={addToSchedule} className="add-button">
            Add Event
          </button>
          <button onClick={clearSchedule} className="clear-button">
            Clear Schedule
          </button>
        </div>
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
                          style={{ backgroundColor: item.color }}
                          title={item.description || item.course}
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

      <h2>Event List</h2>
      <div className="event-list">
        {schedule.length === 0 ? (
          <p>No events scheduled yet.</p>
        ) : (
          schedule.map((event, index) => (
            <div
              className="event-item"
              key={index}
              style={{ borderLeft: `5px solid ${event.color}` }}
            >
              <div className="event-header">
                <h3>{event.course}</h3>
                <button
                  className="remove-event"
                  onClick={() => removeEvent(index)}
                  title="Remove event"
                >
                  ×
                </button>
              </div>
              <p className="event-time">
                {event.day}, {event.startTime} - {event.endTime}
              </p>
              {event.description && (
                <p className="event-description">{event.description}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
