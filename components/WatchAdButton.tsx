'use client';

import { useState } from 'react';
import { PlayCircle } from 'lucide-react';
import AdModal from '@/components/AdModal';

interface WatchAdButtonProps {
  onRewardGranted: () => void;
  className?: string;
}

export default function WatchAdButton({ onRewardGranted, className = '' }: WatchAdButtonProps) {
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsAdModalOpen(true)}
        className={`flex items-center justify-center gap-2 btn-ghost py-4 hover:scale-[1.02] transition-transform ${className}`}
      >
        <PlayCircle className="h-5 w-5 text-brand-blue" />
        Regarder une pub pour débloquer
      </button>

      <AdModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        onRewardGranted={() => {
          onRewardGranted();
        }}
      />
    </>
  );
}
