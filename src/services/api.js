import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

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
api.interceptors.request.use(
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
api.interceptors.response.use(
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

export const fetchSchedule = async () => {
  try {
    console.log("Fetching schedule from API...");
    const response = await axios.get(`${API_BASE_URL}/schedule`);
    console.log("Raw API response:", response.data);

    // Normalize all events to ensure consistent format
    const normalizedEvents = response.data.map(normalizeEvent);
    console.log("Normalized events:", normalizedEvents);

    return normalizedEvents;
  } catch (error) {
    console.error("Error fetching schedule:", error);
    throw error;
  }
};

export const createEvent = async (eventData) => {
  try {
    console.log("Creating event with data:", eventData);
    const response = await axios.post(`${API_BASE_URL}/schedule`, eventData);
    console.log("Create event response:", response.data);

    // Return normalized event
    return normalizeEvent(response.data);
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

export const deleteEvent = async (eventId) => {
  try {
    console.log(`Deleting event with ID: ${eventId}`);
    const response = await axios.delete(`${API_BASE_URL}/schedule/${eventId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};

export const clearAllEvents = async () => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/schedule`);
    return response.data;
  } catch (error) {
    console.error("Error clearing schedule:", error);
    throw error;
  }
};

// Test function to verify API connection
export const testApiConnection = async () => {
  try {
    const response = await api.get("/schedule/test");
    return response.data;
  } catch (error) {
    console.error("API test failed:", error.message);
    throw error;
  }
};
