import { useEffect, useRef } from 'react';

export default function Login() {
  const backendURL = import.meta.env.VITE_BACKEND || "http://localhost:5000";

  const glowRef = useRef(null);
  const cursorDotRef = useRef(null);
  const cursorRingRef = useRef(null);

  // ----------------------------
  // Cursor & Glow Effect
  // ----------------------------
  useEffect(() => {
    const glow = glowRef.current;
    const dot = cursorDotRef.current;
    const ring = cursorRingRef.current;
    if (!glow || !dot || !ring) return;

    let latestX = window.innerWidth / 2;
    let latestY = window.innerHeight / 2;
    let rx = latestX, ry = latestY;
    let ticking = false;

    const onMove = (e) => {
      latestX = e.clientX;
      latestY = e.clientY;
      if (!ticking) {
        requestAnimationFrame(() => {
          glow.style.transform = `translate3d(${latestX - 110}px, ${latestY - 110}px, 0)`;
          ticking = false;
        });
        ticking = true;
      }
      dot.style.transform = `translate3d(${latestX - 4}px, ${latestY - 4}px, 0)`;
    };

    let rafId;
    const tickRing = () => {
      rx += (latestX - rx) * 0.18;
      ry += (latestY - ry) * 0.18;
      ring.style.transform = `translate3d(${rx - 16}px, ${ry - 16}px, 0)`;
      rafId = requestAnimationFrame(tickRing);
    };

    const down = () => { ring.style.transform += ' scale(0.85)'; ring.style.borderColor = 'rgba(34,197,94,0.9)'; };
    const up = () => { ring.style.transform = ring.style.transform.replace(' scale(0.85)',''); ring.style.borderColor = 'rgba(255,255,255,0.35)'; };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', down, { passive: true });
    window.addEventListener('mouseup', up, { passive: true });

    rafId = requestAnimationFrame(tickRing);
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('mousemove', onMove); window.removeEventListener('mousedown', down); window.removeEventListener('mouseup', up); };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white cursor-none">

      {/* ------------------ */}
      {/* Live Background */}
      {/* ------------------ */}
      <div className="absolute inset-0">
        {/* animated gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-cyan-900 to-blue-800 opacity-40 animate-pulse-slow"></div>

        {/* floating neon stars */}
        {Array.from({ length: 60 }).map((_, i) => (
          <div key={i} className="absolute w-1 h-1 bg-cyan-400 rounded-full" style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.6 + 0.2,
            animation: `starMove ${3 + Math.random() * 5}s ease-in-out infinite alternate`
          }} />
        ))}
      </div>

      {/* ------------------ */}
      {/* Custom Cursor */}
      {/* ------------------ */}
      <div ref={cursorRingRef} className="pointer-events-none fixed top-0 left-0 w-8 h-8 rounded-full border border-white/30 mix-blend-screen shadow-lg" />
      <div ref={cursorDotRef} className="pointer-events-none fixed top-0 left-0 w-2 h-2 rounded-full bg-green-400 mix-blend-screen shadow-lg" />
      <div ref={glowRef} className="pointer-events-none fixed top-0 left-0 w-[220px] h-[220px] rounded-full blur-2xl opacity-35" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.5) 0%, rgba(34,197,94,0.15) 45%, transparent 70%)' }} />

      {/* ------------------ */}
      {/* Login Card */}
      {/* ------------------ */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 shadow-xl">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 via-emerald-400 to-blue-600" />
            <h1 className="text-4xl font-extrabold tracking-tight text-cyan-400">Resona</h1>
          </div>
          <p className="text-center text-white/70 mb-10">
            Your AI-powered Spotify companion. Discover, manage, and play with style.
          </p>

          <div className="flex justify-center">
            <a
              href={`${backendURL}/auth/google`}
              className="inline-flex items-center gap-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-3 transition-all shadow-lg shadow-green-500/20"
            >
              Login with Google
            </a>
          </div>

          <div className="mt-10 text-center text-xs text-white/40">
            Secure OAuth via Google. We never see your password.
          </div>
        </div>
      </div>

      {/* ------------------ */}
      {/* Background Animations */}
      {/* ------------------ */}
      <style>{`
        @keyframes starMove {
          0% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-15px) translateX(10px); }
          100% { transform: translateY(0) translateX(0); }
        }
        .animate-pulse-slow {
          animation: pulse 8s infinite alternate;
        }
        @keyframes pulse {
          0% { opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
