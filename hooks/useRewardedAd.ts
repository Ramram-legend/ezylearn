'use client';

import { useEffect, useState, useRef } from 'react';

export type AdState = 'loading' | 'ready' | 'playing' | 'granted' | 'closed' | 'error';

export function useRewardedAd() {
  const [adState, setAdState] = useState<AdState>('ready');
  const [errorMessage, setErrorMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  const containerRef = useRef<HTMLElement | null>(null); // Kept for compatibility if consumers destructure it

  const initializeAd = () => {
    setAdState('ready');
    setTimeLeft(0);
    setErrorMessage('');
  };

  const showAd = () => {
    if (adState !== 'ready') {
      setErrorMessage("La publicité n'est pas encore prête à être affichée.");
      return false;
    }
    setAdState('playing');
    setTimeLeft(15); // 15 seconds countdown
    return true;
  };

  const closeAd = () => {
    // If they close before timer ends, they don't get the reward
    // But we just set state to closed
    setAdState('closed');
  };

  useEffect(() => {
    if (adState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (adState === 'playing' && timeLeft === 0) {
      setAdState('granted');
    }
  }, [adState, timeLeft]);

  return { adState, setAdState, showAd, closeAd, timeLeft, errorMessage, initializeAd, containerRef };
}
