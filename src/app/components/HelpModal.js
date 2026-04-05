"use client";

import { useEffect, useState } from "react";

export default function HelpModal({ isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="help-modal-close" onClick={onClose}>
          &times;
        </button>
        <div className="help-modal-header">
          <div className="help-modal-emoji">📘</div>
          <h2 className="help-modal-title">Welcome to THE WORLD</h2>
          <p className="help-modal-subtitle">A Comprehensive Global Encyclopedia</p>
        </div>
        <div className="help-modal-body">
          <div className="help-section">
            <h3>🌍 Educational Adventure</h3>
            <p>
              "The World" is a powerful tool designed to help you understand our planet's
              diverse socio-economic landscape through data and statistics. Dive into the metrics
              that define nations and their progress.
            </p>
          </div>
          <div className="help-section">
            <h3>📊 Key Features</h3>
            <ul>
              <li><strong>GDP Slideshow:</strong> Visualize the world's largest economies in a dynamic, high-impact presentation.</li>
              <li><strong>Interactive Sorting:</strong> Compare countries by Population, Land Area, and GDP per Capita with a single click.</li>
              <li><strong>Real-time Search:</strong> Instantly find any nation using its English or Chinese name.</li>
              <li><strong>Visual Identity:</strong> Explore national flags and capital cities for every recognized country.</li>
            </ul>
          </div>
          <div className="help-section">
            <h3>💡 Pro Tip</h3>
            <p>
              The application fetches live data from the <strong>World Bank</strong> and <strong>Countries API</strong>, ensuring you always see the most
              current socio-economic indicators available.
            </p>
          </div>
        </div>
        <div className="help-modal-footer">
          <button className="help-modal-done" onClick={onClose}>
            Start Exploring
          </button>
        </div>
      </div>
    </div>
  );
}
