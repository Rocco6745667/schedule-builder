import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export const fetchSchedule = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/schedule`);
    return response.data;
  } catch (error) {
    console.error("Error fetching schedule:", error);
    throw error;
  }
};

export const createEvent = async (eventData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/schedule`, eventData);
    return response.data;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};

export const deleteEvent = async (eventId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/schedule/${eventId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};

export const updateEvent = async (eventId, updatedEventData) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/schedule/${eventId}`,
      updatedEventData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating event:", error);
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
