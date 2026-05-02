"use client";

import { useState, useEffect, useCallback } from "react";
import Slideshow from "./components/Slideshow";
import CountryList from "./components/CountryList";
import ConfettiEffect from "./components/ConfettiEffect";
import HelpModal from "./components/HelpModal";

const TABS = [
  { id: "slideshow", label: "GDP Slideshow 幻灯片", emoji: "💰" },
  { id: "population", label: "Population 人口", emoji: "👥" },
  { id: "area", label: "Land 面积", emoji: "🗺" },
  { id: "name", label: "Name 名称", emoji: "🔤" },
  { id: "perCapita", label: "Capita 人均", emoji: "👤" },
];

export default function Home() {
  const [countries, setCountries] = useState([]);
  const [activeTab, setActiveTab] = useState("slideshow");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Fetch countries from REST Countries API
  // Generic World Bank indicator fetcher (returns map: ISO3 -> { value, year })
  const fetchIndicator = useCallback(async (indicatorCode) => {
    const map = {};
    try {
      const baseUrl =
        `https://api.worldbank.org/v2/country/all/indicator/${indicatorCode}?format=json&date=2020:2023&per_page=300`;
      const firstRes = await fetch(baseUrl);
      if (!firstRes.ok) return map;
      const firstJson = await firstRes.json();
      const totalPages = firstJson[0].pages || 1;
      const allRecords = [...(firstJson[1] || [])];

      if (totalPages > 1) {
        const fetches = [];
        for (let p = 2; p <= totalPages; p++) {
          fetches.push(
            fetch(`${baseUrl}&page=${p}`)
              .then((r) => r.json())
              .then((json) => json[1] || [])
              .catch(() => [])
          );
        }
        const results = await Promise.all(fetches);
        results.forEach((records) => allRecords.push(...records));
      }

      for (const rec of allRecords) {
        const code = rec.countryiso3code;
        if (!code || rec.value == null) continue;
        const year = parseInt(rec.date, 10);
        if (!map[code] || year > map[code].year) {
          map[code] = { value: rec.value, year };
        }
      }
    } catch (error) {
      console.error(`Failed to fetch ${indicatorCode}:`, error);
    }
    return map;
  }, []);

  const fetchCountries = useCallback(async () => {
    try {
      setIsLoading(true);

      const CACHE_KEY = "world_data_cache";
      const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

      // 1. Try to load from Cache
      if (typeof window !== 'undefined') {
        const cachedStr = localStorage.getItem(CACHE_KEY);
        if (cachedStr) {
          try {
            const cachedData = JSON.parse(cachedStr);
            if (Date.now() - cachedData.timestamp < CACHE_EXPIRY_MS) {
              setCountries(cachedData.data);
              setIsLoading(false);
              return; // Cache hit and fresh
            }
          } catch (e) {
            console.error("Failed to parse cache", e);
          }
        }
      }

      // 2. Try to fetch from API
      let enrichedData = null;
      try {
        const fields = "name,translations,capital,population,area,car,flags,cca3";
        const [response, gdpMap, gdpPcMap] = await Promise.all([
          fetch(`https://restcountries.com/v3.1/all?fields=${fields}`),
          fetchIndicator("NY.GDP.MKTP.CD"),       // GDP (current US$)
          fetchIndicator("NY.GDP.PCAP.CD"),        // GDP per capita (current US$)
        ]);
        
        if (response.ok) {
          const data = await response.json();
          // Merge World Bank data into each country
          enrichedData = data.map((c) => {
            const gdp = gdpMap[c.cca3];
            const gdpPc = gdpPcMap[c.cca3];
            return {
              ...c,
              ...(gdp ? { _gdp: gdp.value, _gdpYear: gdp.year } : {}),
              ...(gdpPc ? { _gdpPerCapita: gdpPc.value, _gdpPerCapitaYear: gdpPc.year } : {}),
            };
          });
        }
      } catch (apiError) {
        console.warn("API fetch failed, falling back to static failover data:", apiError);
      }

      // 3. Fallback to static JSON if API failed or returned non-ok
      if (!enrichedData) {
        console.log("Fetching from failover data...");
        const failoverResponse = await fetch("/data/countries.json");
        if (failoverResponse.ok) {
          enrichedData = await failoverResponse.json();
        } else {
          throw new Error("Failover data fetch failed");
        }
      }

      // 4. Update state and cache
      if (enrichedData) {
        setCountries(enrichedData);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              timestamp: Date.now(),
              data: enrichedData
            }));
          } catch (err) {
            console.warn("Failed to save to localStorage cache (might be full)", err);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch countries:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchIndicator]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  // Get sort direction label
  const getSortLabel = (tabId) => {
    if (tabId === "population") return "▼";
    if (tabId === "area") return "▼";
    if (tabId === "name") return "▲";
    if (tabId === "perCapita") return "▼";
    return "";
  };

  const countryCount = countries.length;

  return (
    <>
      <ConfettiEffect />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <div className="logo-area">
            <img src="/logo.png" alt="The World Logo" className="logo-img" />
            <div>
              <div className="logo-text">THE WORLD 世界</div>
              <div className="logo-subtitle">Explore Every Nation 探索每个国家</div>
            </div>
          </div>

          <div className="search-container">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                id="search-input"
                className="search-input"
                type="text"
                placeholder="Search... 搜索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
              />
            </div>
            {countryCount > 0 && (
              <div className="country-count">
                {countryCount} countries loaded 已加载国家
              </div>
            )}
          </div>

          <button className="help-btn" onClick={() => setIsHelpOpen(true)}>
            <span className="help-emoji">📘</span>
            <span>Help</span>
          </button>
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
            <div className="loading-text">Discovering the world… 探索世界...</div>
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
