import { useEffect, useState } from 'react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t1 = setTimeout(() => setPhase('show'), reducedMotion ? 0 : 80);
    const t2 = setTimeout(() => setPhase('exit'), reducedMotion ? 700 : 2000);
    const t3 = setTimeout(onComplete, reducedMotion ? 850 : 2350);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 bg-background flex flex-col items-center justify-center z-50 splash-screen ${phase === 'exit' ? 'splash-exit' : ''}`}
    >
      <div
        className={`flex flex-col items-center px-4 splash-content ${phase === 'enter' ? 'splash-enter' : ''}`}
      >
        <div className="relative mb-6">
          <img src="/assets/images/wearza-splash-mark.png" alt="Wearza" className="w-28 h-28 sm:w-32 sm:h-32 object-contain" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-black mb-3 text-foreground">
          WEARZA
        </h1>
        <p className="text-sm font-medium text-primary text-center">
          Verified Fashion Stores in Nepal
        </p>

        <div className="w-24 h-0.5 bg-border mt-9 overflow-hidden"><div className="h-full bg-primary splash-progress" /></div>
      </div>
    </div>
  );
}
