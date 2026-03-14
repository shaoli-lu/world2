"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

export default function ConfettiEffect() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const myConfetti = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });

    const handleClick = (e) => {
      // Get normalized position
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;

      // Spray confetti from click position
      myConfetti({
        particleCount: 80,
        spread: 70,
        startVelocity: 30,
        origin: { x, y },
        colors: [
          "#3b82f6",
          "#14b8a6",
          "#f59e0b",
          "#f43f5e",
          "#8b5cf6",
          "#22c55e",
          "#ec4899",
        ],
        ticks: 120,
        gravity: 0.8,
        scalar: 0.9,
        shapes: ["circle", "square"],
        drift: 0,
      });
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return <canvas ref={canvasRef} className="confetti-canvas" />;
}
