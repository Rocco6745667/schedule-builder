import React, { useState, useEffect } from "react";
import { fetchSchedule } from "../services/api";
import SearchBar from "./SearchBar";
// Import other components as needed

const Schedule = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await fetchSchedule();
        setEvents(data);
      } catch (error) {
        console.error("Failed to load events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, []);

  const handleSearchResults = (results) => {
    setFilteredEvents(results);
  };

  const clearSearch = () => {
    setFilteredEvents(null);
  };

  // Determine which events to display
  const displayEvents = filteredEvents !== null ? filteredEvents : events;

  return (
    <div className="schedule-container">
      <h1>Schedule Builder</h1>

      <SearchBar onSearchResults={handleSearchResults} />

      {filteredEvents !== null && (
        <div className="search-results-header">
          <h2>Search Results ({filteredEvents.length})</h2>
          <button onClick={clearSearch} className="clear-search-button">
            Clear Search
          </button>
        </div>
      )}

      {isLoading ? (
        <p>Loading events...</p>
      ) : displayEvents.length > 0 ? (
        <div className="events-list search-results">
          {/* Render your events here */}
          {displayEvents.map((event) => (
            <div key={event.id} className="event-card">
              <h3>{event.title}</h3>
              <p>Date: {event.date}</p>
              {event.time && <p>Time: {event.time}</p>}
              {event.location && <p>Location: {event.location}</p>}
              {event.description && <p>Description: {event.description}</p>}
            </div>
          ))}
        </div>
      ) : (
        <p className="no-results">
          No events found. Try a different search term.
        </p>
      )}
    </div>
  );
};

export default Schedule;
