import React, { useEffect, useState } from "react";
import "./styles.css";

const hours = Array.from({ length: 12 }, (_, i) => `${8 + i}:00`);

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

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
    const saved = localStorage.getItem("schedule");
    if (saved) setSchedule(JSON.parse(saved));
  }, []);
  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("schedule", JSON.stringify(schedule));
  }, [schedule]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const timesOverlap = (start1, end1, start2, end2) =>
    !(end1 <= start2 || start1 >= end2);

  const addToSchedule = () => {
    const { course, day, startTime, endTime } = formData;

    if (!course || !startTime || !endTime) {
      setError("Please fill out all fields.");
      return;
    }

    const start = startTime;
    const end = endTime;

    const conflict = schedule.some(
      (item) =>
        item.day === day &&
        timesOverlap(start, end, item.startTime, item.endTime)
    );

    if (conflict) {
      setError("Schedule conflict detected!");
      return;
    }

    setSchedule((prev) => [...prev, { ...formData }]);
    setFormData({ course: "", day: "Monday", startTime: "", endTime: "" });
    setError("");
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
      </div>

      {error && <div className="error">{error}</div>}

      <h2>Weekly Calendar</h2>
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
                <div className="calendar-cell" key={day + i}>
                  {schedule
                    .filter(
                      (item) =>
                        item.day === day &&
                        item.startTime <= hour &&
                        item.endTime > hour
                    )
                    .map((item, index) => (
                      <div className="calendar-event" key={index}>
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
  );
}
