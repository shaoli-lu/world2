"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// Helper: get Chinese name
function getChineseName(country) {
  if (
    country.translations &&
    country.translations.zho &&
    country.translations.zho.common
  ) {
    return country.translations.zho.common;
  }
  const fallbacks = {
    Singapore: "新加坡",
    Taiwan: "台湾",
    "Hong Kong": "香港",
    Macau: "澳门",
    China: "中国",
  };
  return fallbacks[country.name.common] || country.name.common;
}

function capitalize(str) {
  return str && str[0] ? str[0].toUpperCase() + str.slice(1) : "";
}

function formatGDP(value) {
  if (value == null) return null;
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toLocaleString("en-US")}`;
}

export default function Slideshow({ countries }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const progressRef = useRef(null);
  const SLIDE_DURATION = 5000; // 5 seconds per slide
  const PROGRESS_INTERVAL = 50; // update every 50ms

  // Sort countries by GDP descending (countries without GDP go to the end)
  const sortedCountries = useMemo(() => {
    return [...countries].sort((a, b) => (b._gdp || 0) - (a._gdp || 0));
  }, [countries]);

  // Reset index when countries change
  useEffect(() => {
    setCurrentIndex(0);
  }, [sortedCountries]);

  const nextSlide = useCallback(() => {
    if (sortedCountries.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % sortedCountries.length);
    setProgress(0);
  }, [sortedCountries]);

  // Auto-advance
  useEffect(() => {
    if (isPaused || sortedCountries.length === 0) {
      clearInterval(intervalRef.current);
      clearInterval(progressRef.current);
      return;
    }

    setProgress(0);
    intervalRef.current = setInterval(nextSlide, SLIDE_DURATION);
    progressRef.current = setInterval(() => {
      setProgress((prev) => Math.min(prev + (100 * PROGRESS_INTERVAL) / SLIDE_DURATION, 100));
    }, PROGRESS_INTERVAL);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(progressRef.current);
    };
  }, [isPaused, currentIndex, sortedCountries, nextSlide]);

  const togglePause = (e) => {
    e.stopPropagation();
    setIsPaused((p) => !p);
  };

  if (countries.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-globe"></div>
        <div className="loading-text">Loading countries…</div>
      </div>
    );
  }

  const country = sortedCountries[currentIndex];
  if (!country) return null;

  const chineseName = getChineseName(country);
  const capitalStr = country.capital ? country.capital.join(", ") : "N/A";
  const populationStr = (country.population || 0).toLocaleString("en-US");
  const areaStr = country.area ? country.area.toLocaleString("en-US") : "N/A";
  const carSide =
    country.car && country.car.side ? capitalize(country.car.side) : "N/A";
  const gdpStr = formatGDP(country._gdp);
  const gdpYear = country._gdpYear;
  const gdpPcStr = (country._gdpPerCapita || 0).toFixed(0).toLocaleString("en-US")
  const gdpPcYear = country._gdpPerCapitaYear

  return (
    <div className="slideshow-container">
      <div className="slideshow-card" onClick={togglePause}>
        <div className="slideshow-flag-wrapper">
          {country.flags && country.flags.svg ? (
            <img
              className="slideshow-flag"
              src={country.flags.svg}
              alt={`Flag of ${country.name.common}`}
              loading="eager"
            />
          ) : country.flags && country.flags.png ? (
            <img
              className="slideshow-flag"
              src={country.flags.png}
              alt={`Flag of ${country.name.common}`}
              loading="eager"
            />
          ) : null}
          <div className="slideshow-overlay" />
          <div className="slideshow-country-name">
            {country.name.common}
            <div className="slideshow-chinese-name">{chineseName}</div>
          </div>
        </div>

        <div className="slideshow-info">
          <div className="slideshow-info-item">
            <span className="slideshow-info-label">🏛 Capital</span>
            <span className="slideshow-info-value">{capitalStr}</span>
          </div>
          <div className="slideshow-info-item">
            <span className="slideshow-info-label">👥 Population</span>
            <span className="slideshow-info-value">{populationStr}</span>
          </div>
          <div className="slideshow-info-item">
            <span className="slideshow-info-label">🗺 Area (sq km)</span>
            <span className="slideshow-info-value">{areaStr}</span>
          </div>
          <div className="slideshow-info-item">
            <span className="slideshow-info-label">🚗 Car Side</span>
            <span className="slideshow-info-value">{carSide}</span>
          </div>
          {gdpStr && (
            <div className="slideshow-info-item slideshow-gdp">
              <span className="slideshow-info-label">💰 GDP ({gdpYear})</span>
              <span className="slideshow-info-value">{gdpStr}</span>
            </div>
          )}
          {gdpPcStr && (
            <span className="card-detail card-gdp-pc">
              <span className="card-detail-icon">👤</span>
              {gdpPcStr}/capita
              <span className="card-gdp-year">({gdpPcYear})</span>
            </span>
          )}
        </div>

        <div className="slideshow-progress">
          <div
            className="slideshow-progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="slideshow-status-bar">
          <span className="slideshow-rank">#{currentIndex + 1} / {sortedCountries.length}</span>
          <div className={`pulse-dot ${isPaused ? "paused" : ""}`} />
          <span className={`slideshow-status ${isPaused ? "paused" : "playing"}`}>
            {isPaused ? "Paused — Click to resume" : "Playing — Click to pause"}
          </span>
        </div>
      </div>
    </div>
  );
}
