import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/schedule";

// Create an axios instance with timeout
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 5000, // 5 second timeout
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
    console.log("Attempting to fetch events from API...");
    // Try API first
    const response = await api.get('/');
    console.log("Successfully fetched events from API:", response.data.length, "events");
    
    // Sync API data to localStorage as backup
    saveData(response.data);
    console.log("Synced API data to localStorage");
    
    return response.data;
  } catch (error) {
    console.error("API fetch failed:", error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error("Backend server is not running on port 5000");
    } else if (error.code === 'NETWORK_ERROR') {
      console.error("Network error - check internet connection");
    } else if (error.response) {
      console.error("API responded with error:", error.response.status, error.response.data);
    }
    
    console.log("Falling back to localStorage data");
    const localData = getStoredData();
    console.log("Retrieved", localData.length, "events from localStorage");
    return localData;
  }
};

// Create a new event
export const createEvent = async (eventData) => {
  try {
    // Try API first
    const response = await api.post('/', eventData);
    console.log("Successfully created event via API");
    
    // Also save to localStorage for backup
    const events = getStoredData();
    events.push(response.data);
    saveData(events);
    
    return response.data;
  } catch (error) {
    console.error("API error, falling back to localStorage:", error.message);
    console.log("Creating event in localStorage as fallback");
    
    // Fall back to localStorage if API fails
    const events = getStoredData();
    const newEvent = {
      ...eventData,
      _id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    events.push(newEvent);
    saveData(events);
    console.log("Event saved to localStorage with ID:", newEvent._id);
    return newEvent;
  }
};

// Delete an event
export const deleteEvent = async (eventId) => {
  try {
    // Try API first
    const response = await api.delete(`/${eventId}`);
    console.log("Successfully deleted event via API");
    
    // Also delete from localStorage for consistency
    const events = getStoredData();
    const updatedEvents = events.filter(
      (event) => event._id !== eventId && event.id !== eventId
    );
    saveData(updatedEvents);
    
    return response.data;
  } catch (error) {
    console.error("API error, falling back to localStorage:", error.message);
    console.log("Deleting event from localStorage as fallback");
    
    // Fall back to localStorage if API fails
    const events = getStoredData();
    const originalLength = events.length;
    const updatedEvents = events.filter(
      (event) => event._id !== eventId && event.id !== eventId
    );
    
    if (updatedEvents.length === originalLength) {
      console.warn("Event not found in localStorage for deletion:", eventId);
    }
    
    saveData(updatedEvents);
    console.log("Event deleted from localStorage");
    return { success: true, message: "Event deleted from localStorage" };
  }
};

// Update an existing event
export const updateEvent = async (eventId, eventData) => {
  try {
    // Try API first
    const response = await api.put(`/${eventId}`, eventData);
    console.log("Successfully updated event via API");
    
    // Also update in localStorage for backup
    const events = getStoredData();
    const eventIndex = events.findIndex(
      (event) => event._id === eventId || event.id === eventId
    );
    
    if (eventIndex !== -1) {
      events[eventIndex] = response.data;
      saveData(events);
    }
    
    return response.data;
  } catch (error) {
    console.error("API error, falling back to localStorage:", error.message);
    console.log("Updating event in localStorage as fallback");
    
    // Fall back to localStorage if API fails
    const events = getStoredData();
    const eventIndex = events.findIndex(
      (event) => event._id === eventId || event.id === eventId
    );
    
    if (eventIndex === -1) {
      console.error("Event not found in localStorage:", eventId);
      throw new Error('Event not found in localStorage');
    }
    
    // Update the event while preserving the ID
    const updatedEvent = {
      ...eventData,
      _id: events[eventIndex]._id,
      id: events[eventIndex].id,
      createdAt: events[eventIndex].createdAt,
      updatedAt: new Date().toISOString()
    };
    
    events[eventIndex] = updatedEvent;
    saveData(events);
    console.log("Event updated in localStorage with ID:", updatedEvent._id);
    return updatedEvent;
  }
};

// Clear all events
export const clearAllEvents = async () => {
  try {
    // Try API first
    const response = await api.delete('/');
    console.log("Successfully cleared all events via API");
    
    // Also clear localStorage for consistency
    localStorage.removeItem(STORAGE_KEY);
    
    return response.data;
  } catch (error) {
    console.error("API error, falling back to localStorage:", error.message);
    console.log("Clearing all events from localStorage as fallback");
    
    // Fall back to localStorage if API fails
    localStorage.removeItem(STORAGE_KEY);
    console.log("All events cleared from localStorage");
    return { success: true, message: "All events cleared from localStorage" };
  }
};

// Test function to verify API connection
export const testApiConnection = async () => {
  try {
    // Use the api instance we created at the top of the file
    const response = await api.get("/test");
    return { connected: true, ...response.data };
  } catch (error) {
    console.error("API test failed:", error.message);
    return { connected: false, message: error.message };
  }
};

// Check if API is available and return status
export const getApiStatus = async () => {
  try {
    const result = await testApiConnection();
    if (result.connected) {
      return { 
        status: 'online', 
        message: 'API connected - changes will be saved to server and localStorage',
        apiConnected: true 
      };
    } else {
      return { 
        status: 'offline', 
        message: 'API offline - changes will be saved to localStorage only',
        apiConnected: false 
      };
    }
  } catch (error) {
    return { 
      status: 'error', 
      message: 'API unavailable - using localStorage for data storage',
      apiConnected: false 
    };
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
