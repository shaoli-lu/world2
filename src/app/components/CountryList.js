"use client";

import { useMemo } from "react";

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

// Highlight matching text
function HighlightText({ text, searchTerm }) {
  if (!searchTerm || !text) return <>{text}</>;
  const lowerText = text.toLowerCase();
  const lowerSearch = searchTerm.toLowerCase();
  const idx = lowerText.indexOf(lowerSearch);
  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <span className="highlight-match">{text.slice(idx, idx + searchTerm.length)}</span>
      {text.slice(idx + searchTerm.length)}
    </>
  );
}

export default function CountryList({ countries, sortField, searchTerm }) {
  // Sort and assign rankings, then filter but keep original rankings
  const { displayCountries } = useMemo(() => {
    // First, sort all countries
    const sorted = [...countries].sort((a, b) => {
      if (sortField === "population") {
        return (b.population || 0) - (a.population || 0);
      } else if (sortField === "area") {
        return (b.area || 0) - (a.area || 0);
      } else if (sortField === "name") {
        return (a.name.common || "").localeCompare(b.name.common || "");
      }
      return 0;
    });

    // Assign rankings
    const ranked = sorted.map((c, i) => ({ ...c, _rank: i + 1 }));

    // Filter if search term exists
    let display = ranked;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      display = ranked.filter((country) => {
        const name = country.name.common.toLowerCase();
        let chineseName = getChineseName(country).toLowerCase();
        return name.includes(term) || chineseName.includes(term);
      });
    }

    return { displayCountries: display };
  }, [countries, sortField, searchTerm]);

  if (countries.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-globe"></div>
        <div className="loading-text">Loading countries…</div>
      </div>
    );
  }

  if (displayCountries.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔍</div>
        <div className="empty-title">No countries found</div>
        <div className="empty-subtitle">
          Try a different search term
        </div>
      </div>
    );
  }

  return (
    <div className="countries-grid">
      {displayCountries.map((country, idx) => {
        const chineseName = getChineseName(country);
        const capitalStr = country.capital
          ? country.capital.join(", ")
          : "N/A";
        const populationStr = (country.population || 0).toLocaleString("en-US");
        const areaStr = country.area
          ? country.area.toLocaleString("en-US")
          : "N/A";
        const carSide =
          country.car && country.car.side
            ? capitalize(country.car.side)
            : "N/A";
        const gdpStr = formatGDP(country._gdp);
        const gdpYear = country._gdpYear;
        const gdpPcStr = country._gdpPerCapita
          ? `$${Math.round(country._gdpPerCapita).toLocaleString("en-US")}`
          : null;
        const gdpPcYear = country._gdpPerCapitaYear;

        return (
          <div
            className="country-card"
            key={country.name.common}
            style={{ animationDelay: `${Math.min(idx * 0.03, 1)}s` }}
          >
            <div className={`card-rank ${country._rank <= 3 ? "top-3" : ""}`}>
              {country._rank}
            </div>
            <div className="card-flag-wrapper">
              {country.flags && (country.flags.svg || country.flags.png) && (
                <img
                  className="card-flag"
                  src={country.flags.svg || country.flags.png}
                  alt={`Flag of ${country.name.common}`}
                  loading="lazy"
                />
              )}
            </div>
            <div className="card-info">
              <div className="card-name-row">
                <span className="card-name">
                  <HighlightText
                    text={country.name.common}
                    searchTerm={searchTerm}
                  />
                </span>
                <span className="card-chinese-name">
                  <HighlightText
                    text={chineseName}
                    searchTerm={searchTerm}
                  />
                </span>
              </div>
              <div className="card-capital">🏛 {capitalStr}</div>
              <div className="card-details">
                <span className="card-detail">
                  <span className="card-detail-icon">👥</span>
                  {populationStr}
                </span>
                <span className="card-detail">
                  <span className="card-detail-icon">🗺</span>
                  {areaStr} km²
                </span>
                <span className="card-detail">
                  <span className="card-detail-icon">🚗</span>
                  {carSide}
                </span>
                {gdpStr && (
                  <span className="card-detail card-gdp">
                    <span className="card-detail-icon">💰</span>
                    {gdpStr}
                    <span className="card-gdp-year">({gdpYear})</span>
                  </span>
                )}
                {gdpPcStr && (
                  <span className="card-detail card-gdp-pc">
                    <span className="card-detail-icon">👤</span>
                    {gdpPcStr}/capita
                    <span className="card-gdp-year">({gdpPcYear})</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
