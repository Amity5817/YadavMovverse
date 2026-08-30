"use client";

import { useState } from "react";

interface PinLockProps {
  onUnlock: () => void;
  children: React.ReactNode;
}

export default function PinLock({ onUnlock, children }: PinLockProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const CORRECT_PIN = "6969"; // ✅ Change this to your desired PIN

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      setIsUnlocked(true);
      onUnlock();
      setError("");
    } else {
      setError("Incorrect PIN. Please try again.");
      setPin("");
    }
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred/Overlay effect */}
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none opacity-50">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-xl">
          <div className="bg-zinc-900 p-8 rounded-xl border border-rose-500/30 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <span className="text-4xl block mb-2">🔞</span>
              <h3 className="text-xl font-bold text-white">Adult Content</h3>
              <p className="text-zinc-400 text-sm mt-1">
                Enter PIN to view this section
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-center text-xl tracking-widest focus:outline-none focus:border-rose-500 transition-colors"
                autoFocus
              />
              
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              
              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors"
              >
                Unlock 🔓
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}