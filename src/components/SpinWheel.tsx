"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { soundEffects } from "@/lib/sound";

interface SpinWheelProps {
  onSpinComplete: (number: number, questionData: any) => void;
  disabled?: boolean;
  npm: string;
  kelompok: string;
  modul: number;
}

const TOTAL_SLICES = 25;
const SLICE_ANGLE = (2 * Math.PI) / TOTAL_SLICES;

// Palette putih-biru profesional & kontras
const SLICE_COLORS = [
  "#1d4ed8", "#0284c7", "#2563eb", "#0369a1", "#3b82f6",
  "#0ea5e9", "#1e40af", "#38bdf8", "#1e3a8a", "#0284c7",
  "#2563eb", "#0ea5e9", "#1d4ed8", "#0369a1", "#3b82f6",
  "#1e40af", "#38bdf8", "#1d4ed8", "#0284c7", "#2563eb",
  "#0369a1", "#0ea5e9", "#1e3a8a", "#3b82f6", "#1d4ed8",
];

export default function SpinWheel({
  onSpinComplete,
  disabled = false,
  npm,
  kelompok,
  modul,
}: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);

  const drawWheel = useCallback((rotationAngle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < TOTAL_SLICES; i++) {
      const startAngle = rotationAngle + i * SLICE_ANGLE;
      const endAngle = startAngle + SLICE_ANGLE;
      const number = i + 1;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = SLICE_COLORS[i % SLICE_COLORS.length];
      ctx.fill();

      ctx.lineWidth = 1;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + SLICE_ANGLE / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(`${number}`, radius - 14, 5);
      ctx.restore();
    }

    // Outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#0f172a";
    ctx.stroke();

    // Center hub
    ctx.beginPath();
    ctx.arc(centerX, centerY, 32, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#2563eb";
    ctx.stroke();

    ctx.fillStyle = "#1e3a8a";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SISMIK", centerX, centerY);
  }, []);

  useEffect(() => {
    drawWheel(currentRotation);
  }, [drawWheel, currentRotation]);

  const handleSpin = async () => {
    if (isSpinning || disabled) return;

    setIsSpinning(true);

    let targetNum = 1;
    let questionData = null;

    try {
      const res = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ npm, kelompok, modul }),
      });
      const data = await res.json();
      if (data.success) {
        targetNum = data.pickedNumber;
        questionData = data.question;
      } else {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        targetNum = (array[0] % 25) + 1;
      }
    } catch {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      targetNum = (array[0] % 25) + 1;
    }

    const pointerAngle = (3 * Math.PI) / 2;
    const targetSliceCenter = (targetNum - 0.5) * SLICE_ANGLE;
    let targetEndAngle = pointerAngle - targetSliceCenter;
    while (targetEndAngle < 0) targetEndAngle += 2 * Math.PI;

    const fullSpins = 6 * 2 * Math.PI;
    const finalAngle =
      currentRotation +
      fullSpins +
      ((targetEndAngle - (currentRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));

    const startTime = performance.now();
    const duration = 4000;
    const initialAngle = currentRotation;
    let lastTickAngle = initialAngle;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 4);
      const angle = initialAngle + (finalAngle - initialAngle) * easeOut;

      drawWheel(angle);

      if (Math.abs(angle - lastTickAngle) >= SLICE_ANGLE) {
        soundEffects.playTick(550);
        lastTickAngle = angle;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrentRotation(angle % (2 * Math.PI));
        setIsSpinning(false);

        soundEffects.playWin();
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#2563eb", "#0284c7", "#3b82f6"],
        });

        onSpinComplete(targetNum, questionData);
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Container Roda */}
      <div className="relative p-2 rounded-full bg-white shadow-sm border border-slate-200">
        {/* Pointer sederhana di atas */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 flex flex-col items-center">
          <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-red-600"></div>
        </div>

        <canvas
          ref={canvasRef}
          width={360}
          height={360}
          className="rounded-full select-none cursor-pointer max-w-full h-auto aspect-square"
          onClick={!isSpinning && !disabled ? handleSpin : undefined}
        />
      </div>

      {/* Tombol Putar */}
      <div className="mt-5 w-full max-w-xs">
        <button
          type="button"
          onClick={handleSpin}
          disabled={disabled || isSpinning}
          className={`w-full py-3 px-5 rounded-lg font-semibold text-sm transition ${
            disabled
              ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              : isSpinning
              ? "bg-blue-400 text-white cursor-wait"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          }`}
        >
          {isSpinning ? "Memutar Roda..." : "Putar Roda (1 - 25)"}
        </button>
      </div>
    </div>
  );
}
