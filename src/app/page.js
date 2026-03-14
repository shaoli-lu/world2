"use client";

import { useState, useEffect, useCallback } from "react";
import Slideshow from "./components/Slideshow";
import CountryList from "./components/CountryList";
import ConfettiEffect from "./components/ConfettiEffect";

const TABS = [
  { id: "slideshow", label: "Slideshow", emoji: "🎴" },
  { id: "population", label: "Population", emoji: "👥" },
  { id: "area", label: "Land", emoji: "🗺" },
  { id: "name", label: "Name", emoji: "🔤" },
];

export default function Home() {
  const [countries, setCountries] = useState([]);
  const [activeTab, setActiveTab] = useState("slideshow");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch countries from REST Countries API
  const fetchCountries = useCallback(async () => {
    try {
      setIsLoading(true);
      const fields = "name,translations,capital,population,area,car,flags";
      const response = await fetch(
        `https://restcountries.com/v3.1/all?fields=${fields}`
      );
      if (response.ok) {
        const data = await response.json();
        setCountries(data);
      }
    } catch (error) {
      console.error("Failed to fetch countries:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  // Get sort direction label
  const getSortLabel = (tabId) => {
    if (tabId === "population") return "▼";
    if (tabId === "area") return "▼";
    if (tabId === "name") return "▲";
    return "";
  };

  const countryCount = countries.length;

  return (
    <>
      <ConfettiEffect />

      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <div className="logo-area">
            <img src="/logo.png" alt="The World Logo" className="logo-img" />
            <div>
              <div className="logo-text">THE WORLD</div>
              <div className="logo-subtitle">Explore Every Nation</div>
            </div>
          </div>

          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              id="search-input"
              className="search-input"
              type="text"
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
            {countryCount > 0 && (
              <div className="country-count">
                {countryCount} countries loaded
              </div>
            )}
          </div>
        </div>
      </header>

      {/* TABS */}
      <div className="tabs-container">
        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-emoji">{tab.emoji}</span>
              {tab.label}
              {activeTab === tab.id && tab.id !== "slideshow" && (
                <span className="sort-indicator">{getSortLabel(tab.id)}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-globe"></div>
            <div className="loading-text">Discovering the world…</div>
          </div>
        ) : activeTab === "slideshow" ? (
          <Slideshow countries={countries} />
        ) : (
          <CountryList
            countries={countries}
            sortField={activeTab}
            searchTerm={searchTerm}
          />
        )}
      </main>
    </>
  );
}
