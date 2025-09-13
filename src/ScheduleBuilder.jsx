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

// Color options for events - improved visibility and contrast
const colorOptions = [
  "#2E8B57", // Sea Green - darker green for better contrast
  "#1976D2", // Blue - darker blue 
  "#D32F2F", // Red - slightly darker red
  "#F57C00", // Orange - darker orange
  "#7B1FA2", // Purple - darker purple
  "#0097A7", // Cyan - darker cyan
  "#5D4037", // Brown - darker brown
  "#455A64", // Blue Grey - darker blue grey
  "#C62828", // Dark Red
  "#1565C0", // Dark Blue
  "#2E7D32", // Dark Green
  "#EF6C00", // Dark Orange
];

export default function ScheduleBuilder() {
  const [schedule, setSchedule] = useState([]);
  const [formData, setFormData] = useState({
    course: "",
    day: "Monday",
    date: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
    endDate: new Date().toISOString().split("T")[0], // End date for multiday events
    startTime: "",
    endTime: "",
    description: "",
    color: colorOptions[0],
    recurring: false,
    recurrenceType: "weekly", // weekly, monthly, yearly
    repeatWeeks: 1, // Number of weeks to repeat (for weekly recurrence)
    repeatLimited: false, // Whether to limit the number of repetitions
    isMultiDay: false, // Whether this is a multiday event
    allDay: false, // Whether this is an all-day event
    excludedDates: [], // Array of excluded dates for multiday events
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("week"); // week, month, year, list
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [editingEvent, setEditingEvent] = useState(null); // Track which event is being edited

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
    
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      
      // Auto-update endDate when date changes for multiday events
      if (name === "date" && prev.isMultiDay && (!prev.endDate || new Date(prev.endDate) < new Date(value))) {
        newData.endDate = value;
      }
      
      // Clear endDate when multiday is disabled
      if (name === "isMultiDay" && !checked) {
        newData.endDate = prev.date;
      }
      
      return newData;
    });
    
    setError("");
  };

  const timesOverlap = (start1, end1, start2, end2) =>
    !(end1 <= start2 || start1 >= end2);

  const datesMatch = (date1, date2, recurrenceType, repeatWeeks = null, repeatLimited = false, endDate1 = null, excludedDates = []) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    // Check if the target date is excluded
    if (excludedDates && excludedDates.includes(d2.toISOString().split("T")[0])) {
      return false;
    }

    // Helper function to check if a date falls within a multiday range
    const isDateInMultidayRange = (startDate, endDate, targetDate) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const target = new Date(targetDate);
      return target >= start && target <= end;
    };

    // For non-recurring multiday events, check if target date falls within the range
    if (endDate1 && !recurrenceType) {
      return isDateInMultidayRange(d1, endDate1, d2);
    }

    // For single-day non-recurring events
    if (!recurrenceType && !endDate1) {
      return d1.toDateString() === d2.toDateString();
    }

    // For recurring events
    if (recurrenceType === "weekly") {
      const daysDifference = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
      const weeksDifference = Math.floor(daysDifference / 7);
      
      // If it's a limited recurring event, check if target date is within the repeat range
      if (repeatLimited && repeatWeeks && weeksDifference >= repeatWeeks) {
        return false;
      }

      // For multiday recurring events
      if (endDate1) {
        const eventDuration = Math.floor((new Date(endDate1) - d1) / (1000 * 60 * 60 * 24));
        
        // Check each weekly occurrence
        for (let week = 0; !repeatLimited || week < repeatWeeks; week++) {
          const occurrenceStart = new Date(d1);
          occurrenceStart.setDate(d1.getDate() + (week * 7));
          
          const occurrenceEnd = new Date(occurrenceStart);
          occurrenceEnd.setDate(occurrenceStart.getDate() + eventDuration);
          
          if (isDateInMultidayRange(occurrenceStart, occurrenceEnd, d2)) {
            return true;
          }
          
          // If we've gone past the target date and it's unlimited repetition, stop checking
          if (!repeatLimited && occurrenceStart > d2) {
            break;
          }
        }
        return false;
      } else {
        // Single-day recurring events
        if (daysDifference < 0) return false;
        return d1.getDay() === d2.getDay();
      }
    } else if (recurrenceType === "monthly") {
      // For multiday monthly recurring events
      if (endDate1) {
        const eventDuration = Math.floor((new Date(endDate1) - d1) / (1000 * 60 * 60 * 24));
        const targetMonth = d2.getMonth();
        const targetYear = d2.getFullYear();
        
        // Check if target date falls within this month's occurrence
        const monthlyStart = new Date(targetYear, targetMonth, d1.getDate());
        const monthlyEnd = new Date(monthlyStart);
        monthlyEnd.setDate(monthlyStart.getDate() + eventDuration);
        
        return isDateInMultidayRange(monthlyStart, monthlyEnd, d2);
      } else {
        return d1.getDate() === d2.getDate();
      }
    } else if (recurrenceType === "yearly") {
      // For multiday yearly recurring events
      if (endDate1) {
        const eventDuration = Math.floor((new Date(endDate1) - d1) / (1000 * 60 * 60 * 24));
        const targetYear = d2.getFullYear();
        
        // Check if target date falls within this year's occurrence
        const yearlyStart = new Date(targetYear, d1.getMonth(), d1.getDate());
        const yearlyEnd = new Date(yearlyStart);
        yearlyEnd.setDate(yearlyStart.getDate() + eventDuration);
        
        return isDateInMultidayRange(yearlyStart, yearlyEnd, d2);
      } else {
        return d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
      }
    }

    return false;
  };

  const addToSchedule = async () => {
    const { course, date, endDate, startTime, endTime, isMultiDay, allDay } = formData;

    // If we're editing an event, call updateEvent instead
    if (editingEvent) {
      return updateEvent();
    }

    if (!course || !date) {
      setError("Please fill out all required fields.");
      return;
    }

    // Validation for multiday events
    if (isMultiDay) {
      if (!endDate) {
        setError("Please select an end date for multiday events.");
        return;
      }
      if (new Date(endDate) < new Date(date)) {
        setError("End date must be after or equal to start date.");
        return;
      }
      if (!allDay && (!startTime || !endTime)) {
        setError("Please fill out start and end times for timed multiday events.");
        return;
      }
    } else {
      // Single day event validation
      if (!allDay && (!startTime || !endTime)) {
        setError("Please fill out start and end times.");
        return;
      }
    }

    if (!allDay && startTime && endTime && startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }

    // Check for conflicts
    const conflict = schedule.some((item) => {
      // Simple function to check if a specific date falls within an event's range
      const isDateInEventRange = (checkDate, eventStartDate, eventEndDate) => {
        const check = new Date(checkDate);
        const start = new Date(eventStartDate);
        const end = eventEndDate ? new Date(eventEndDate) : start;
        
        // Normalize to compare dates only (ignore time)
        check.setHours(12, 0, 0, 0);
        start.setHours(12, 0, 0, 0);
        end.setHours(12, 0, 0, 0);
        
        return check >= start && check <= end;
      };

      // Check if there's any date overlap between the new event and existing event
      let hasDateOverlap = false;

      if (item.recurring) {
        // For recurring events, check if the new event's dates match any recurrence
        if (isMultiDay && endDate) {
          // Check each day of the new multiday event
          const newStart = new Date(date);
          const newEnd = new Date(endDate);
          
          for (let d = new Date(newStart); d <= newEnd; d.setDate(d.getDate() + 1)) {
            if (datesMatch(
              d.toISOString().split("T")[0],
              item.date,
              item.recurrenceType,
              item.repeatWeeks,
              item.repeatLimited,
              item.endDate,
              item.excludedDates
            )) {
              hasDateOverlap = true;
              break;
            }
          }
        } else {
          // Single day event against recurring event
          hasDateOverlap = datesMatch(
            date,
            item.date,
            item.recurrenceType,
            item.repeatWeeks,
            item.repeatLimited,
            item.endDate,
            item.excludedDates
          );
        }
      } else {
        // For non-recurring events, check direct date overlap
        if (isMultiDay && endDate) {
          // New event is multiday - check if any day overlaps with existing event
          const newStart = new Date(date);
          const newEnd = new Date(endDate);
          
          for (let d = new Date(newStart); d <= newEnd; d.setDate(d.getDate() + 1)) {
            if (isDateInEventRange(d.toISOString().split("T")[0], item.date, item.endDate)) {
              hasDateOverlap = true;
              break;
            }
          }
        } else {
          // New event is single day - check if it falls within existing event's range
          hasDateOverlap = isDateInEventRange(date, item.date, item.endDate);
        }
      }

      // If no date overlap, no conflict
      if (!hasDateOverlap) {
        return false;
      }

      // If there's date overlap, check time overlap
      if (allDay || item.allDay) {
        return true; // All-day events conflict if dates overlap
      }
      
      // For timed events, check time overlap
      if (startTime && endTime && item.startTime && item.endTime) {
        return timesOverlap(startTime, endTime, item.startTime, item.endTime);
      }
      
      // If dates overlap but times are missing, assume conflict for safety
      return true;
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

    // For multiday events, create a day range description
    const dayRange = isMultiDay && endDate ? 
      `${dayOfWeek} - ${daysOfWeek[new Date(endDate).getDay() === 0 ? 6 : new Date(endDate).getDay() - 1]}` : 
      dayOfWeek;

    try {
      setLoading(true);

      // Create the new event object
      const newEvent = {
        ...formData,
        day: isMultiDay ? dayRange : dayOfWeek,
        // Ensure endDate is only set for multiday events
        endDate: isMultiDay ? formData.endDate : null,
        // Set default times for all-day events
        startTime: allDay ? "00:00" : formData.startTime,
        endTime: allDay ? "23:59" : formData.endTime,
      };

      // Send to API and get the saved event with MongoDB _id
      const savedEvent = await createEvent(newEvent);

      // Update the local state with the saved event
      setSchedule((prev) => [...prev, savedEvent]);

      // Reset form with a random color and current date
      const currentDate = new Date().toISOString().split("T")[0];
      setFormData({
        course: "",
        day: dayOfWeek,
        date: currentDate,
        endDate: currentDate,
        startTime: "",
        endTime: "",
        description: "",
        color: colorOptions[Math.floor(Math.random() * colorOptions.length)],
        recurring: false,
        recurrenceType: "weekly",
        repeatWeeks: 1,
        repeatLimited: false,
        isMultiDay: false,
        allDay: false,
        excludedDates: [],
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

  // Update an existing event
  const updateEvent = async () => {
    const { course, date, endDate, startTime, endTime, isMultiDay, allDay } = formData;

    if (!course || !date) {
      setError("Please fill out all required fields.");
      return;
    }

    // Validation for multiday events
    if (isMultiDay) {
      if (!endDate) {
        setError("Please select an end date for multiday events.");
        return;
      }
      if (new Date(endDate) < new Date(date)) {
        setError("End date must be after or equal to start date.");
        return;
      }
      if (!allDay && (!startTime || !endTime)) {
        setError("Please fill out start and end times for timed multiday events.");
        return;
      }
    } else {
      // Single day event validation
      if (!allDay && (!startTime || !endTime)) {
        setError("Please fill out start and end times.");
        return;
      }
    }

    if (!allDay && startTime && endTime && startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }

    // Check for conflicts with other events (excluding the event being edited)
    const conflict = schedule.some((item) => {
      // Skip the event being edited
      if (item._id === editingEvent._id || item.id === editingEvent.id) {
        return false;
      }

      // Same conflict checking logic as addToSchedule
      const isDateInEventRange = (checkDate, eventStartDate, eventEndDate) => {
        const check = new Date(checkDate);
        const start = new Date(eventStartDate);
        const end = eventEndDate ? new Date(eventEndDate) : start;
        
        check.setHours(12, 0, 0, 0);
        start.setHours(12, 0, 0, 0);
        end.setHours(12, 0, 0, 0);
        
        return check >= start && check <= end;
      };

      let hasDateOverlap = false;

      if (item.recurring) {
        if (isMultiDay && endDate) {
          const newStart = new Date(date);
          const newEnd = new Date(endDate);
          
          for (let d = new Date(newStart); d <= newEnd; d.setDate(d.getDate() + 1)) {
            if (datesMatch(
              d.toISOString().split("T")[0],
              item.date,
              item.recurrenceType,
              item.repeatWeeks,
              item.repeatLimited,
              item.endDate,
              item.excludedDates
            )) {
              hasDateOverlap = true;
              break;
            }
          }
        } else {
          hasDateOverlap = datesMatch(
            date,
            item.date,
            item.recurrenceType,
            item.repeatWeeks,
            item.repeatLimited,
            item.endDate,
            item.excludedDates
          );
        }
      } else {
        if (isMultiDay && endDate) {
          const newStart = new Date(date);
          const newEnd = new Date(endDate);
          
          for (let d = new Date(newStart); d <= newEnd; d.setDate(d.getDate() + 1)) {
            if (isDateInEventRange(d.toISOString().split("T")[0], item.date, item.endDate)) {
              hasDateOverlap = true;
              break;
            }
          }
        } else {
          hasDateOverlap = isDateInEventRange(date, item.date, item.endDate);
        }
      }

      if (!hasDateOverlap) {
        return false;
      }

      if (allDay || item.allDay) {
        return true;
      }
      
      if (startTime && endTime && item.startTime && item.endTime) {
        return timesOverlap(startTime, endTime, item.startTime, item.endTime);
      }
      
      return true;
    });

    if (conflict) {
      setError("Schedule conflict detected!");
      return;
    }

    const dayOfWeek = daysOfWeek[new Date(date).getDay() === 0 ? 6 : new Date(date).getDay() - 1];
    const dayRange = isMultiDay && endDate ? 
      `${dayOfWeek} - ${daysOfWeek[new Date(endDate).getDay() === 0 ? 6 : new Date(endDate).getDay() - 1]}` : 
      dayOfWeek;

    try {
      setLoading(true);

      const updatedEvent = {
        ...formData,
        day: isMultiDay ? dayRange : dayOfWeek,
        endDate: isMultiDay ? formData.endDate : null,
        startTime: allDay ? "00:00" : formData.startTime,
        endTime: allDay ? "23:59" : formData.endTime,
      };

      // Update the event in the schedule
      setSchedule((prev) =>
        prev.map((event) =>
          event._id === editingEvent._id || event.id === editingEvent.id
            ? { ...event, ...updatedEvent }
            : event
        )
      );

      // Reset form and exit edit mode
      cancelEdit();
    } catch (err) {
      console.error("Error updating event:", err);
      setError("Failed to update event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Edit an existing event
  const editEvent = (event) => {
    setFormData({
      course: event.course,
      day: event.day,
      date: event.date,
      endDate: event.endDate || event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      description: event.description || "",
      color: event.color,
      recurring: event.recurring || false,
      recurrenceType: event.recurrenceType || "weekly",
      repeatWeeks: event.repeatWeeks || 1,
      repeatLimited: event.repeatLimited || false,
      isMultiDay: event.isMultiDay || false,
      allDay: event.allDay || false,
      excludedDates: event.excludedDates || [],
    });
    setEditingEvent(event);
    setError("");
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingEvent(null);
    const currentDate = new Date().toISOString().split("T")[0];
    setFormData({
      course: "",
      day: "Monday",
      date: currentDate,
      endDate: currentDate,
      startTime: "",
      endTime: "",
      description: "",
      color: colorOptions[Math.floor(Math.random() * colorOptions.length)],
      recurring: false,
      recurrenceType: "weekly",
      repeatWeeks: 1,
      repeatLimited: false,
      isMultiDay: false,
      allDay: false,
      excludedDates: [],
    });
    setError("");
  };

  // Exclude a specific date from a multiday event
  const excludeDateFromEvent = async (eventId, dateToExclude) => {
    try {
      setLoading(true);
      
      // Find the event to update
      const eventToUpdate = schedule.find(event => 
        event._id === eventId || event.id === eventId
      );
      
      if (!eventToUpdate) {
        setError("Event not found.");
        return;
      }

      // Add the date to excluded dates
      const updatedExcludedDates = [
        ...(eventToUpdate.excludedDates || []),
        dateToExclude
      ];



      // Update via API (we'll need to add this endpoint)
      // For now, update locally
      setSchedule((prev) =>
        prev.map((event) =>
          event._id === eventId || event.id === eventId
            ? { ...event, excludedDates: updatedExcludedDates }
            : event
        )
      );

      setError("");
    } catch (err) {
      console.error("Error excluding date from event:", err);
      setError("Failed to exclude date. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Restore a specific date to a multiday event
  const restoreDateToEvent = async (eventId, dateToRestore) => {
    try {
      setLoading(true);
      
      // Find the event to update
      const eventToUpdate = schedule.find(event => 
        event._id === eventId || event.id === eventId
      );
      
      if (!eventToUpdate) {
        setError("Event not found.");
        return;
      }

      // Remove the date from excluded dates
      const updatedExcludedDates = (eventToUpdate.excludedDates || []).filter(
        date => date !== dateToRestore
      );

      // Update locally
      setSchedule((prev) =>
        prev.map((event) =>
          event._id === eventId || event.id === eventId
            ? { ...event, excludedDates: updatedExcludedDates }
            : event
        )
      );

      setError("");
    } catch (err) {
      console.error("Error restoring date to event:", err);
      setError("Failed to restore date. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if an event should be displayed in a time slot
  const shouldDisplayEvent = (event, hour, date) => {
    const hourNum = parseInt(hour.split(":")[0], 10);
    const targetDate = date || selectedDate;
    
    // Check if this date matches the event (considering multiday and recurring patterns)
    const dateMatches = datesMatch(
      event.date,
      targetDate.toISOString().split("T")[0],
      event.recurring ? event.recurrenceType : null,
      event.repeatWeeks,
      event.repeatLimited,
      event.endDate,
      event.excludedDates
    );

    if (!dateMatches) return false;
    
    // For all-day events, only show in the first hour (0:00)
    if (event.allDay) {
      return hourNum === 0;
    }

    // For timed events, check if the hour falls within the event time range
    if (!event.startTime || !event.endTime) {
      // If no times specified (shouldn't happen with proper validation), show in first hour
      return hourNum === 0;
    }

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

  // Helper function to calculate event positioning and height within hour cells
  const getEventStyle = (event, hour) => {
    if (event.allDay) {
      return { top: '2px', height: 'calc(100% - 4px)' };
    }

    if (!event.startTime || !event.endTime) {
      return { top: '2px', height: 'calc(100% - 4px)' };
    }

    const hourNum = parseInt(hour.split(":")[0], 10);
    const eventStartHour = parseInt(event.startTime.split(":")[0], 10);
    const eventEndHour = parseInt(event.endTime.split(":")[0], 10);
    const eventStartMinutes = parseInt(event.startTime.split(":")[1], 10) || 0;
    const eventEndMinutes = parseInt(event.endTime.split(":")[1], 10) || 0;

    // Calculate position within the hour cell (0-100%)
    let topOffset = 0;
    let height = 100;

    // If event starts in this hour
    if (eventStartHour === hourNum) {
      topOffset = (eventStartMinutes / 60) * 100;
    }

    // If event ends in this hour
    if (eventEndHour === hourNum) {
      const endOffset = (eventEndMinutes / 60) * 100;
      height = endOffset - topOffset;
    } else if (eventStartHour === hourNum) {
      // Event starts in this hour but continues to next
      height = 100 - topOffset;
    }

    return {
      top: `${topOffset}%`,
      height: `${Math.max(height, 15)}%`, // Minimum 15% height for visibility
      minHeight: '20px'
    };
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
          event.repeatLimited,
          event.endDate,
          event.excludedDates
        );
      } else {
        return datesMatch(
          eventDate.toISOString().split("T")[0],
          date.toISOString().split("T")[0],
          null,
          null,
          false,
          event.endDate,
          event.excludedDates
        );
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
    if (!timeString) return "Time not set";
    
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="schedule-builder">
      <div className="header-section">
        <h1 className="app-title">Schedule Builder</h1>
        <p className="app-subtitle">Organize your time with professional scheduling</p>
      </div>

      {loading && <div className="loading-indicator">Processing...</div>}

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

      <div className="form-container">
        <div className="form">
          <div className="form-group">
            <label htmlFor="course">Event Name*</label>
            <input
              type="text"
              id="course"
              name="course"
              placeholder="Enter event name"
              value={formData.course}
              onChange={handleChange}
              required
            />
          </div>

        <div className="form-group">
          <label htmlFor="date">{formData.isMultiDay ? 'Start Date*' : 'Date*'}</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="isMultiDay"
              checked={formData.isMultiDay}
              onChange={handleChange}
            />
            Multi-day event
          </label>
        </div>

        {formData.isMultiDay && (
          <div className="form-group">
            <label htmlFor="endDate">End Date*</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              min={formData.date}
              required
            />
          </div>
        )}

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="allDay"
              checked={formData.allDay}
              onChange={handleChange}
            />
            All-day event
          </label>
        </div>

        {!formData.allDay && (
          <>
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
          </>
        )}

          <div className="form-group full-width">
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
                <label htmlFor="recurrenceType">Recurrence Pattern</label>
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
                {formData.isMultiDay && formData.recurrenceType === "weekly" && (
                  <small>Multiday event will repeat weekly (entire duration each week)</small>
                )}
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
                      <small>
                        {formData.isMultiDay 
                          ? `Multiday event will repeat for ${formData.repeatWeeks} week${formData.repeatWeeks !== 1 ? 's' : ''} (${
                              formData.endDate && formData.date && new Date(formData.endDate) >= new Date(formData.date)
                                ? Math.ceil((new Date(formData.endDate) - new Date(formData.date)) / (1000 * 60 * 60 * 24)) + 1 
                                : 'X'
                            } days each week)`
                          : `Event will repeat for ${formData.repeatWeeks} week${formData.repeatWeeks !== 1 ? 's' : ''} (including the original)`
                        }
                      </small>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          <div className="form-buttons">
            <button onClick={addToSchedule} className="btn btn-primary">
              {editingEvent ? "Update Event" : "Add Event"}
            </button>
            {editingEvent && (
              <button onClick={cancelEdit} className="btn btn-secondary">
                Cancel Edit
              </button>
            )}
            <button onClick={clearSchedule} className="btn btn-danger">
              Clear Schedule
            </button>
          </div>
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
                      .map((item, index) => {
                      const eventStyle = getEventStyle(item, hour);
                      const hourNum = parseInt(hour.split(":")[0], 10);
                      const eventStartHour = parseInt(item.startTime?.split(":")[0], 10) || 0;
                      
                      // Show time label only in the starting hour of the event
                      const showTimeLabel = !item.allDay && item.startTime && item.endTime && eventStartHour === hourNum;
                      
                      return (
                      <div
                        className={`calendar-event ${item.allDay ? 'all-day' : ''} ${item.isMultiDay ? 'multiday' : ''} ${item.recurring ? 'recurring' : ''}`}
                      key={`${item.id}-${index}`}
                      style={{ 
                      backgroundColor: item.color,
                          ...eventStyle,
                        position: 'absolute',
                          left: '2px',
                        right: '2px'
                        }}
                        title={`${item.course}${
                        item.allDay 
                        ? " (All day)" 
                        : (item.startTime && item.endTime 
                          ? ` (${formatTime(item.startTime)} - ${formatTime(item.endTime)})`
                            : " (Time not set)")
                      }${
                          item.isMultiDay && item.endDate
                              ? ` - Multi-day: ${formatDate(new Date(item.date))} to ${formatDate(new Date(item.endDate))}` 
                            : ""
                        }${
                        item.description ? ": " + item.description : ""
                      }${
                      item.isMultiDay ? "\nRight-click to exclude this day" : ""
                      }`}
                      onContextMenu={(e) => {
                      if (item.isMultiDay) {
                      e.preventDefault();
                        if (window.confirm(`Exclude ${formatDate(date)} from "${item.course}"?`)) {
                          excludeDateFromEvent(item._id || item.id, date.toISOString().split("T")[0]);
                          }
                      }
                      }}
                      >
                          <div className="event-content">
                              <div className="event-title">{item.course}</div>
                                 {showTimeLabel && (
                                   <div className="event-time-label">
                                     {formatTime(item.startTime)} - {formatTime(item.endTime)}
                                   </div>
                                 )}
                               </div>
                               {item.isMultiDay && (
                                 <button
                                   className="exclude-day-btn"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     if (window.confirm(`Exclude ${formatDate(date)} from "${item.course}"?`)) {
                                       excludeDateFromEvent(item._id || item.id, date.toISOString().split("T")[0]);
                                     }
                                   }}
                                   title={`Exclude ${formatDate(date)} from this event`}
                                 >
                                   ×
                                 </button>
                               )}
                             </div>
                           );
                         })}
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
                            title={`${event.course}${
                              event.allDay 
                                ? " (All day)" 
                                : (event.startTime && event.endTime 
                                    ? ` (${formatTime(event.startTime)} - ${formatTime(event.endTime)})`
                                    : " (Time not set)")
                            }${
                              event.isMultiDay && event.endDate
                                ? ` - Multi-day: ${formatDate(new Date(event.date))} to ${formatDate(new Date(event.endDate))}` 
                                : ""
                            }${
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
                        <div className="event-actions">
                          <button
                            className="edit-event"
                            onClick={() => editEvent(event)}
                            title="Edit event"
                          >
                            ✏️
                          </button>
                          <button
                            className="remove-event"
                            onClick={() => removeEvent(event._id || event.id)}
                            title="Remove event"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <p className="event-date">
                        {event.isMultiDay && event.endDate
                          ? `${formatDate(new Date(event.date))} - ${formatDate(new Date(event.endDate))}${
                              event.excludedDates && event.excludedDates.length > 0 
                                ? ` (${event.excludedDates.length} day${event.excludedDates.length !== 1 ? 's' : ''} excluded)`
                                : ""
                            }`
                          : formatDate(new Date(event.date))
                        }
                        {event.recurring && event.isMultiDay && (
                          event.repeatLimited && event.recurrenceType === "weekly"
                            ? ` (Multiday event repeats ${event.recurrenceType} for ${event.repeatWeeks} weeks)`
                            : ` (Multiday event repeats ${event.recurrenceType})`
                        )}
                        {event.recurring && !event.isMultiDay && (
                          event.repeatLimited && event.recurrenceType === "weekly"
                            ? ` (Repeats ${event.recurrenceType} for ${event.repeatWeeks} weeks)`
                            : ` (Repeats ${event.recurrenceType})`
                        )}
                        {event.isMultiDay && !event.recurring && " (Multi-day)"}
                      </p>
                      <p className="event-time">
                        {event.allDay 
                          ? "All day"
                          : (event.startTime && event.endTime 
                              ? `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`
                              : "Time not set")
                        }
                      </p>
                      {event.description && (
                        <p className="event-description">{event.description}</p>
                      )}
                      
                      {event.isMultiDay && event.excludedDates && event.excludedDates.length > 0 && (
                        <div className="excluded-dates">
                          <p className="excluded-dates-label">Excluded dates:</p>
                          <div className="excluded-dates-list">
                            {event.excludedDates.map((excludedDate, idx) => (
                              <span key={idx} className="excluded-date-chip">
                                {formatDate(new Date(excludedDate))}
                                <button
                                  className="restore-date-btn"
                                  onClick={() => restoreDateToEvent(event._id || event.id, excludedDate)}
                                  title="Restore this date"
                                >
                                  ↻
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
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
