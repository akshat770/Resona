import { useEffect, useRef } from 'react';

export default function Login() {
  const backendURL = import.meta.env.VITE_BACKEND || "http://localhost:5000";
  const glowRef = useRef(null);
  const cursorDotRef = useRef(null);
  const cursorRingRef = useRef(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;
    // Performance-friendly: one rAF per frame, latest pointer coords only
    let latestX = window.innerWidth / 2;
    let latestY = window.innerHeight / 2;
    let ticking = false;
    const size = 220; // smaller glow for less overdraw

    const update = () => {
      glow.style.transform = `translate3d(${latestX - size/2}px, ${latestY - size/2}px, 0)`;
      ticking = false;
    };

    const onMove = (e) => {
      latestX = e.clientX; latestY = e.clientY;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };

    const opts = { passive: true };
    window.addEventListener('mousemove', onMove, opts);
    // initial position
    requestAnimationFrame(update);
    return () => window.removeEventListener('mousemove', onMove, opts);
  }, []);

  // Fancy custom cursor: dot + ring with slight lag and click pulse
  useEffect(() => {
    const dot = cursorDotRef.current;
    const ring = cursorRingRef.current;
    if (!dot || !ring) return;
    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    let rx = x, ry = y;
    let rafId;

    const move = (e) => {
      x = e.clientX; y = e.clientY;
      dot.style.transform = `translate3d(${x - 4}px, ${y - 4}px, 0)`;
    };
    const tick = () => {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      ring.style.transform = `translate3d(${rx - 16}px, ${ry - 16}px, 0)`;
      rafId = requestAnimationFrame(tick);
    };
    const down = () => { ring.style.transition = 'transform 40ms, border-color 120ms'; ring.style.borderColor = 'rgba(34,197,94,0.9)'; ring.style.transform += ' scale(0.85)'; };
    const up = () => { ring.style.transition = 'transform 220ms ease-out, border-color 400ms'; ring.style.borderColor = 'rgba(255,255,255,0.35)'; ring.style.transform = ring.style.transform.replace(' scale(0.85)',''); };
    const opts = { passive: true };
    window.addEventListener('mousemove', move, opts);
    window.addEventListener('mousedown', down, opts);
    window.addEventListener('mouseup', up, opts);
    rafId = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('mousemove', move, opts); window.removeEventListener('mousedown', down, opts); window.removeEventListener('mouseup', up, opts); };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white cursor-none">
      {/* Live space background */}
      <style>{`
        @keyframes starPan { from { transform: translateY(0); } to { transform: translateY(-1000px); } }
        @keyframes drift { 0% {transform: translate3d(-10%,0,0)} 50% {transform: translate3d(10%,0,0)} 100% {transform: translate3d(-10%,0,0)} }
      `}</style>
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {/* distant stars */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage:
            "radial-gradient(1px 1px at 10px 10px, rgba(255,255,255,0.25) 1px, transparent 0)",
          backgroundSize: '60px 60px',
          transform: 'translateZ(0)',
          animation: 'starPan 60s linear infinite'
        }} />
        {/* nearer stars */}
        <div className="absolute inset-0 opacity-40" style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20px 20px, rgba(255,255,255,0.5) 1px, transparent 0)",
          backgroundSize: '90px 90px',
          transform: 'translateZ(0)',
          animation: 'starPan 120s linear infinite'
        }} />
        {/* aurora/nebula drift */}
        <div className="absolute -inset-40 blur-2xl opacity-40" style={{
          background: 'radial-gradient(600px 300px at 20% 30%, rgba(16,185,129,0.25), transparent 60%), radial-gradient(500px 280px at 80% 25%, rgba(14,165,233,0.25), transparent 60%), radial-gradient(700px 360px at 50% 90%, rgba(34,211,238,0.22), transparent 60%)',
          animation: 'drift 16s ease-in-out infinite'
        }} />
      </div>

      {/* Custom cursor elements */}
      <div ref={cursorRingRef} className="pointer-events-none fixed top-0 left-0 w-8 h-8 rounded-full border border-white/30 mix-blend-screen" style={{boxShadow:'0 0 24px rgba(34,197,94,0.25)'}} />
      <div ref={cursorDotRef} className="pointer-events-none fixed top-0 left-0 w-2 h-2 rounded-full bg-green-400 mix-blend-screen" />

      {/* Cursor-following glow */}
      <div ref={glowRef} className="pointer-events-none fixed top-0 left-0 w-[220px] h-[220px] rounded-full blur-2xl opacity-35 will-change-transform" style={{
        background: 'radial-gradient(circle, rgba(34,197,94,0.5) 0%, rgba(34,197,94,0.15) 45%, transparent 70%)'
      }} />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 shadow-xl">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 via-emerald-400 to-blue-600" />
            <h1 className="text-4xl font-extrabold tracking-tight">Resona</h1>
          </div>
          <p className="text-center text-white/70 mb-10">
            Your AI-powered Spotify companion. Discover, manage, and play with style.
          </p>

          <div className="flex justify-center">
            <a
              href={`${backendURL}/auth/google`}
              className="inline-flex items-center gap-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-3 transition-all shadow-lg shadow-green-500/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M21.35 11.1H12v2.8h5.3c-.23 1.46-1.6 4.28-5.3 4.28-3.19 0-5.8-2.63-5.8-5.88s2.61-5.88 5.8-5.88c1.82 0 3.04.77 3.74 1.43l2.55-2.46C16.61 3.5 14.5 2.5 12 2.5 6.99 2.5 3 6.49 3 11.5S6.99 20.5 12 20.5c6.94 0 9.35-4.86 9.35-7.4 0-.5-.05-.83-.1-1.0z"/></svg>
              Login with Google
            </a>
          </div>

          <div className="mt-10 text-center text-xs text-white/40">
            Secure OAuth via Google. We never see your password.
          </div>
        </div>
      </div>
    </div>
  );
}
  