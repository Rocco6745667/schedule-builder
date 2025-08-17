import React, { useEffect, useState } from "react";
import "./styles.css";
import {
  fetchSchedule,
  createEvent,
  deleteEvent,
  clearAllEvents,
} from "./services/api";

// Hours for the daily view
const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

// Days of the week
const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Months
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
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
    date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
    startTime: "",
    endTime: "",
    description: "",
    color: colorOptions[0],
    recurring: false,
    recurrenceType: "weekly", // weekly, monthly, yearly
    repeatWeeks: 1, // Number of weeks to repeat (for weekly recurrence)
    repeatLimited: false, // Whether to limit the number of repetitions
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("week"); // week, month, year, list
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // Load from API instead of localStorage
  useEffect(() => {
    const getScheduleData = async () => {
      try {
        setLoading(true);
        setError(""); // Clear any previous errors

        console.log("Fetching schedule from API...");
        const data = await fetchSchedule();
        console.log(`Received ${data.length} events from API`);

        // Map MongoDB data to ensure compatibility with existing code
        const formattedData = data.map((event) => ({
          ...event,
          id: event._id, // Ensure both id and _id are available
        }));

        setSchedule(formattedData);
      } catch (err) {
        console.error("Error loading from API:", err);
        setError(`Failed to load schedule data: ${err.message}`);

        // Fallback to localStorage if API fails
        try {
          console.log("Falling back to localStorage...");
          const saved = localStorage.getItem("schedule");
          if (saved) {
            const localData = JSON.parse(saved);
            console.log(`Loaded ${localData.length} events from localStorage`);
            setSchedule(localData);
          }
        } catch (localErr) {
          console.error("Error loading from localStorage:", localErr);
        }
      } finally {
        setLoading(false);
      }
    };

    getScheduleData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const timesOverlap = (start1, end1, start2, end2) =>
    !(end1 <= start2 || start1 >= end2);

  const datesMatch = (date1, date2, recurrenceType, repeatWeeks = null, repeatLimited = false) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    if (d1.toDateString() === d2.toDateString()) return true;

    if (recurrenceType === "weekly") {
      // If it's a limited recurring event, check if target date is within the repeat range
      if (repeatLimited && repeatWeeks) {
        const daysDifference = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
        const weeksDifference = Math.floor(daysDifference / 7);
        
        // Only match if it's the same day of week and within the repeat range
        return d1.getDay() === d2.getDay() && 
               daysDifference >= 0 && 
               weeksDifference < repeatWeeks;
      }
      return d1.getDay() === d2.getDay();
    } else if (recurrenceType === "monthly") {
      return d1.getDate() === d2.getDate();
    } else if (recurrenceType === "yearly") {
      return d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    }

    return false;
  };

  const addToSchedule = async () => {
    const { course, date, startTime, endTime } = formData;

    if (!course || !date || !startTime || !endTime) {
      setError("Please fill out all required fields.");
      return;
    }

    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }

    // Check for conflicts
    const conflict = schedule.some((item) => {
      // Check if dates match (considering recurrence)
      const dateMatches =
        datesMatch(
          date,
          item.date,
          item.recurring ? item.recurrenceType : null,
          item.repeatWeeks,
          item.repeatLimited
        ) ||
        (item.recurring && datesMatch(
          date, 
          item.date, 
          item.recurrenceType,
          item.repeatWeeks,
          item.repeatLimited
        ));

      // If dates match, check for time overlap
      return (
        dateMatches &&
        timesOverlap(startTime, endTime, item.startTime, item.endTime)
      );
    });

    if (conflict) {
      setError("Schedule conflict detected!");
      return;
    }

    // Set the day of week based on the selected date
    const dayOfWeek =
      daysOfWeek[
        new Date(date).getDay() === 0 ? 6 : new Date(date).getDay() - 1
      ];

    try {
      setLoading(true);

      // Create the new event object
      const newEvent = {
        ...formData,
        day: dayOfWeek,
      };

      // Send to API and get the saved event with MongoDB _id
      const savedEvent = await createEvent(newEvent);

      // Update the local state with the saved event
      setSchedule((prev) => [...prev, savedEvent]);

      // Reset form with a random color
      setFormData({
        course: "",
        day: dayOfWeek,
        date: date,
        startTime: "",
        endTime: "",
        description: "",
        color: colorOptions[Math.floor(Math.random() * colorOptions.length)],
        recurring: false,
        recurrenceType: "weekly",
        repeatWeeks: 1,
        repeatLimited: false,
      });
      setError("");
    } catch (err) {
      console.error("Error adding to schedule:", err);
      setError("Failed to add event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Clear the schedule
  const clearSchedule = async () => {
    if (window.confirm("Are you sure you want to clear the entire schedule?")) {
      try {
        setLoading(true);
        await clearAllEvents();
        setSchedule([]);
      } catch (err) {
        console.error("Error clearing schedule:", err);
        setError("Failed to clear schedule. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Remove a specific event
  const removeEvent = async (id) => {
    try {
      setLoading(true);
      // Use the MongoDB _id if available, otherwise use the id
      const eventId = id.toString().includes("ObjectId") ? id : id;
      await deleteEvent(eventId);
      setSchedule((prev) =>
        prev.filter((event) => event._id !== id && event.id !== id)
      );
    } catch (err) {
      console.error("Error removing event:", err);
      setError("Failed to remove event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if an event should be displayed in a time slot
  const shouldDisplayEvent = (event, hour, date) => {
    const hourNum = parseInt(hour.split(":")[0], 10);
    const eventStartHour = parseInt(event.startTime.split(":")[0], 10);
    const eventEndHour = parseInt(event.endTime.split(":")[0], 10);

    // Handle minutes
    const eventStartMinutes = parseInt(event.startTime.split(":")[1], 10) || 0;
    const eventEndMinutes = parseInt(event.endTime.split(":")[1], 10) || 0;

    // Convert to decimal hours for comparison
    const eventStart = eventStartHour + eventStartMinutes / 60;
    const eventEnd = eventEndHour + eventEndMinutes / 60;

    // Check if the event occurs on this date (considering recurrence)
    const eventDate = new Date(event.date);
    const targetDate = date || selectedDate;

    const dateMatches = datesMatch(
      eventDate.toISOString().split("T")[0],
      targetDate.toISOString().split("T")[0],
      event.recurring ? event.recurrenceType : null,
      event.repeatWeeks,
      event.repeatLimited
    );

    return dateMatches && eventStart <= hourNum && eventEnd > hourNum;
  };

  // Get events for a specific date
  const getEventsForDate = (date) => {
    return schedule.filter((event) => {
      const eventDate = new Date(event.date);

      if (event.recurring) {
        return datesMatch(
          eventDate.toISOString().split("T")[0],
          date.toISOString().split("T")[0],
          event.recurrenceType,
          event.repeatWeeks,
          event.repeatLimited
        );
      } else {
        return eventDate.toDateString() === date.toDateString();
      }
    });
  };

  // Generate days for the month view
  const getDaysInMonth = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Adjust for Monday start

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // Navigate to previous/next week, month, or year
  const navigatePeriod = (direction) => {
    if (view === "week") {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + direction * 7);
      setSelectedDate(newDate);
    } else if (view === "month") {
      let newMonth = selectedMonth + direction;
      let newYear = selectedYear;

      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }

      setSelectedMonth(newMonth);
      setSelectedYear(newYear);
    } else if (view === "year") {
      setSelectedYear(selectedYear + direction);
    }
  };

  // Get the start and end dates of the current week
  const getWeekDates = () => {
    const date = new Date(selectedDate);
    const day = date.getDay() || 7; // Get day of week (0 is Sunday, so we make it 7)

    // Calculate the date of Monday in this week
    const mondayDate = new Date(date);
    mondayDate.setDate(date.getDate() - (day - 1));

    // Calculate the date of Sunday in this week
    const sundayDate = new Date(date);
    sundayDate.setDate(date.getDate() + (7 - day));

    return { mondayDate, sundayDate };
  };

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get week days for the week view
  const getWeekDays = () => {
    const { mondayDate } = getWeekDates();
    const weekDays = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(mondayDate);
      day.setDate(mondayDate.getDate() + i);
      weekDays.push(day);
    }

    return weekDays;
  };

  // Check if a date is today
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Format time for display
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="schedule-builder">
      <h1>Schedule Builder</h1>

      {loading && <div className="loading-indicator">Loading...</div>}

      <div className="view-controls">
        <button
          className={view === "week" ? "active" : ""}
          onClick={() => setView("week")}
        >
          Week
        </button>
        <button
          className={view === "month" ? "active" : ""}
          onClick={() => setView("month")}
        >
          Month
        </button>
        <button
          className={view === "year" ? "active" : ""}
          onClick={() => setView("year")}
        >
          Year
        </button>
        <button
          className={view === "list" ? "active" : ""}
          onClick={() => setView("list")}
        >
          List
        </button>
      </div>

      <div className="form">
        <div className="form-group">
          <label htmlFor="course">Event Name*</label>
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
          <label htmlFor="date">Date*</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
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

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="recurring"
              checked={formData.recurring}
              onChange={handleChange}
            />
            Recurring Event
          </label>
        </div>

        {formData.recurring && (
          <>
            <div className="form-group">
              <label htmlFor="recurrenceType">Recurrence</label>
              <select
                id="recurrenceType"
                name="recurrenceType"
                value={formData.recurrenceType}
                onChange={handleChange}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            
            {formData.recurrenceType === "weekly" && (
              <>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="repeatLimited"
                      checked={formData.repeatLimited}
                      onChange={handleChange}
                    />
                    Limit repetitions to specific number of weeks
                  </label>
                </div>
                
                {formData.repeatLimited && (
                  <div className="form-group">
                    <label htmlFor="repeatWeeks">Number of weeks to repeat</label>
                    <input
                      type="number"
                      id="repeatWeeks"
                      name="repeatWeeks"
                      value={formData.repeatWeeks}
                      onChange={handleChange}
                      min="1"
                      max="52"
                      placeholder="Enter number of weeks"
                    />
                    <small>Event will repeat for {formData.repeatWeeks} week{formData.repeatWeeks !== 1 ? 's' : ''} (including the original)</small>
                  </div>
                )}
              </>
            )}
          </>
        )}

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

      <h2>{view.charAt(0).toUpperCase() + view.slice(1)} View</h2>

      {/* Navigation controls for all views */}
      <div className="period-navigation">
        <button onClick={() => navigatePeriod(-1)}>
          Previous{" "}
          {view === "week" ? "Week" : view === "month" ? "Month" : "Year"}
        </button>
        {view === "week" && (
          <span>
            {formatDate(getWeekDates().mondayDate)} -{" "}
            {formatDate(getWeekDates().sundayDate)}
          </span>
        )}
        {view === "month" && (
          <span>
            {months[selectedMonth]} {selectedYear}
          </span>
        )}
        {view === "year" && <span>{selectedYear}</span>}
        {view === "list" && <span>All Events</span>}
        <button onClick={() => navigatePeriod(1)}>
          Next {view === "week" ? "Week" : view === "month" ? "Month" : "Year"}
        </button>
      </div>

      {/* Week View */}
      {view === "week" && (
        <div className="calendar-container">
          <div className="calendar">
            <div className="calendar-header">
              <div className="time-slot" />
              {getWeekDays().map((date) => (
                <div
                  className={`day-column-header ${
                    isToday(date) ? "today" : ""
                  }`}
                  key={date.toISOString()}
                >
                  {daysOfWeek[date.getDay() === 0 ? 6 : date.getDay() - 1]}
                  <div className="date-label">{date.getDate()}</div>
                </div>
              ))}
            </div>

            <div className="calendar-grid">
              {hours.map((hour, i) => (
                <React.Fragment key={i}>
                  <div className="time-slot">{hour}</div>
                  {getWeekDays().map((date) => (
                    <div
                      className={`calendar-cell ${
                        isToday(date) ? "today" : ""
                      }`}
                      key={`${date.toISOString()}-${i}`}
                    >
                      {schedule
                        .filter((item) => shouldDisplayEvent(item, hour, date))
                        .map((item, index) => (
                          <div
                            className="calendar-event"
                            key={`${item.id}-${index}`}
                            style={{ backgroundColor: item.color }}
                            title={`${item.course} (${formatTime(
                              item.startTime
                            )} - ${formatTime(item.endTime)})${
                              item.description ? ": " + item.description : ""
                            }`}
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
      )}

      {/* Month View */}
      {view === "month" && (
        <div className="month-view">
          <div className="month-grid">
            {daysOfWeek.map((day) => (
              <div className="month-header-cell" key={day}>
                {day.substring(0, 3)}
              </div>
            ))}

            {getDaysInMonth(selectedYear, selectedMonth).map((date, index) => (
              <div
                key={index}
                className={`month-cell ${
                  date && isToday(date) ? "today" : ""
                } ${!date ? "empty-cell" : ""}`}
                onClick={() => date && setSelectedDate(date)}
              >
                {date && (
                  <>
                    <div className="month-date-number">{date.getDate()}</div>
                    <div className="month-events">
                      {getEventsForDate(date)
                        .slice(0, 3)
                        .map((event, idx) => (
                          <div
                            key={idx}
                            className="month-event"
                            style={{ backgroundColor: event.color }}
                            title={`${event.course} (${formatTime(
                              event.startTime
                            )} - ${formatTime(event.endTime)})${
                              event.description ? ": " + event.description : ""
                            }`}
                          >
                            {event.course}
                          </div>
                        ))}
                      {getEventsForDate(date).length > 3 && (
                        <div className="more-events">
                          +{getEventsForDate(date).length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Year View */}
      {view === "year" && (
        <div className="year-view">
          {months.map((month, idx) => (
            <div
              key={idx}
              className="year-month"
              onClick={() => {
                setSelectedMonth(idx);
                setView("month");
              }}
            >
              <h3>{month}</h3>
              <div className="mini-month-grid">
                {Array.from({ length: 7 }, (_, i) => (
                  <div key={i} className="mini-month-header">
                    {daysOfWeek[i].charAt(0)}
                  </div>
                ))}

                {getDaysInMonth(selectedYear, idx).map((date, dateIdx) => (
                  <div
                    key={dateIdx}
                    className={`mini-month-cell ${
                      date && isToday(date) ? "today" : ""
                    } ${!date ? "empty-cell" : ""}`}
                  >
                    {date && date.getDate()}
                    {date && getEventsForDate(date).length > 0 && (
                      <div className="mini-month-indicator"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="list-view">
          {schedule.length === 0 ? (
            <p>No events scheduled yet.</p>
          ) : (
            <>
              <div className="list-filters">
                <input
                  type="text"
                  placeholder="Search events..."
                  onChange={(e) => {
                    // You can implement search functionality here
                  }}
                />
              </div>

              {schedule
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map((event) => {
                  // Log each event for debugging
                  console.log("Rendering event in list view:", event);

                  return (
                    <div
                      className="event-item"
                      key={event._id || event.id}
                      style={{ borderLeft: `5px solid ${event.color}` }}
                    >
                      <div className="event-header">
                        <h3>{event.course}</h3>
                        <button
                          className="remove-event"
                          onClick={() => removeEvent(event._id || event.id)}
                          title="Remove event"
                        >
                          ×
                        </button>
                      </div>
                      <p className="event-date">
                        {formatDate(new Date(event.date))}
                        {event.recurring && (
                          event.repeatLimited && event.recurrenceType === "weekly"
                            ? ` (Repeats ${event.recurrenceType} for ${event.repeatWeeks} weeks)`
                            : ` (Repeats ${event.recurrenceType})`
                        )}
                      </p>
                      <p className="event-time">
                        {formatTime(event.startTime)} -{" "}
                        {formatTime(event.endTime)}
                      </p>
                      {event.description && (
                        <p className="event-description">{event.description}</p>
                      )}
                    </div>
                  );
                })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
