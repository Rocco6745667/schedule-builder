import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

// Create an axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper function to normalize event data from API
const normalizeEvent = (event) => {
  return {
    ...event,
    id: event._id || event.id, // Ensure id is available for compatibility
    // Convert date strings to proper format if needed
    date: event.date ? event.date : new Date().toISOString().split("T")[0],
    // Ensure other required fields have defaults
    recurring: typeof event.recurring === "boolean" ? event.recurring : false,
    recurrenceType: event.recurrenceType || "weekly",
  };
};

// Add request interceptor for logging
axios.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
axios.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error("API Response Error:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    return Promise.reject(error);
  }
);

// Mock API using localStorage for testing
const STORAGE_KEY = "schedule";

// Helper function to get data from localStorage
const getStoredData = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
};

// Helper function to save data to localStorage
const saveData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Fetch all events
export const fetchSchedule = async () => {
  try {
    // For a real API, you would use fetch here
    // const response = await fetch('your-api-url/events');
    // return await response.json();

    // For now, use localStorage
    return getStoredData();
  } catch (error) {
    console.error("Error fetching schedule:", error);
    throw error;
  }
};

// Create a new event
export const createEvent = async (eventData) => {
  try {
    // For a real API, you would use fetch here
    // const response = await fetch('your-api-url/events', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(eventData)
    // });
    // return await response.json();

    // For now, use localStorage
    const events = getStoredData();
    const newEvent = {
      ...eventData,
      _id: Date.now().toString(),
      id: Date.now().toString(),
    };
    events.push(newEvent);
    saveData(events);
    return newEvent;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

// Delete an event
export const deleteEvent = async (eventId) => {
  try {
    // For a real API, you would use fetch here
    // const response = await fetch(`your-api-url/events/${eventId}`, {
    //   method: 'DELETE'
    // });
    // return await response.json();

    // For now, use localStorage
    const events = getStoredData();
    const updatedEvents = events.filter(
      (event) => event._id !== eventId && event.id !== eventId
    );
    saveData(updatedEvents);
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};

// Clear all events
export const clearAllEvents = async () => {
  try {
    // For a real API, you would use fetch here
    // const response = await fetch('your-api-url/events', {
    //   method: 'DELETE'
    // });
    // return await response.json();

    // For now, use localStorage
    localStorage.removeItem(STORAGE_KEY);
    return { success: true };
  } catch (error) {
    console.error("Error clearing events:", error);
    throw error;
  }
};

// Test function to verify API connection
export const testApiConnection = async () => {
  try {
    // Use the api instance we created at the top of the file
    const response = await api.get("/schedule/test");
    return response.data;
  } catch (error) {
    console.error("API test failed:", error.message);
    throw error;
  }
};

// Search events based on query
export const searchEvents = async (query) => {
  try {
    // For a real API, you would use fetch here
    // const response = await api.get(`/events/search?q=${encodeURIComponent(query)}`);
    // return response.data;

    // For now, use localStorage and filter events locally
    const events = getStoredData();
    const searchTerm = query.toLowerCase();

    // Filter events based on various properties
    const filteredEvents = events.filter((event) => {
      // Search in title
      if (event.title && event.title.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in description
      if (
        event.description &&
        event.description.toLowerCase().includes(searchTerm)
      ) {
        return true;
      }

      // Search in location
      if (event.location && event.location.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in date
      if (event.date && event.date.includes(searchTerm)) {
        return true;
      }

      // Search in time
      if (event.time && event.time.toLowerCase().includes(searchTerm)) {
        return true;
      }

      return false;
    });

    return filteredEvents.map(normalizeEvent);
  } catch (error) {
    console.error("Error searching events:", error);
    throw error;
  }
};
