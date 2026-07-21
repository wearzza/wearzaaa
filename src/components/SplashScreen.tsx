import { useEffect, useState } from 'react';

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 80);
    const t2 = setTimeout(() => setPhase('exit'), 2600);
    const t3 = setTimeout(onComplete, 3100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50"
      style={{ opacity: phase === 'exit' ? 0 : 1, transition: 'opacity 0.5s ease' }}
    >
      <div
        className="flex flex-col items-center"
        style={{
          transform: phase === 'enter' ? 'scale(0.6) translateY(20px)' : phase === 'exit' ? 'scale(1.05) translateY(-10px)' : 'scale(1) translateY(0)',
          opacity: phase === 'enter' ? 0 : 1,
          transition: 'transform 0.7s cubic-bezier(0.34,1.56,0.64,1), opacity 0.5s ease',
        }}
      >
        <div className="relative mb-6">
          <div
            className="w-32 h-32 rounded-3xl flex items-center justify-center overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #ff3b30 0%, #e8251a 100%)',
              boxShadow: '0 20px 60px rgba(255,59,48,0.4), 0 8px 20px rgba(0,0,0,0.15)',
            }}
          >
            <img
              src="/assets/images/ChatGPT_Image_Nov_16,_2025,_11_21_16_AM.png"
              alt="Wearza"
              className="w-20 h-20 object-contain"
            />
          </div>
          <div
            className="absolute inset-0 rounded-3xl"
            style={{ animation: 'pulse-ring 2s ease-in-out infinite' }}
          />
        </div>

        <h1 className="text-5xl font-black mb-3" style={{ color: '#1a2340', letterSpacing: '0.15em' }}>
          WEARZA
        </h1>
        <p className="text-sm font-medium tracking-wider" style={{ color: '#ff3b30' }}>
          Verified Fashion Stores in Nepal
        </p>

        <div className="flex gap-2 mt-10">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: '#ff3b30', animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0%,100% { transform: scale(1); opacity: 0.6; box-shadow: 0 0 0 2px rgba(255,59,48,0.3), 0 0 40px rgba(255,59,48,0.2); }
          50% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 0 2px rgba(255,59,48,0.5), 0 0 60px rgba(255,59,48,0.3); }
        }
        @keyframes bounce-dot {
          0%,80%,100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
