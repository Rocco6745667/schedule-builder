import React, { useState } from "react";
import { searchEvents } from "../services/api";
import "./styles.css";

const SearchBar = ({ onSearchResults }) => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!query.trim()) {
      return;
    }

    setIsSearching(true);

    try {
      const results = await searchEvents(query);
      onSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearch} className="search-bar">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search events by title, description, date..."
          className="search-input"
          aria-label="Search events"
        />
        <button type="submit" className="search-button" disabled={isSearching}>
          {isSearching ? "Searching..." : "Search"}
        </button>
      </form>
    </div>
  );
};

export default SearchBar;
