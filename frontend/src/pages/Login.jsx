import { useEffect, useRef } from "react";

export default function Login() {
  const glowRef = useRef(null);
  const cursorDotRef = useRef(null);
  const cursorRingRef = useRef(null);
  const canvasRef = useRef(null);

  const backendURL = import.meta.env.VITE_BACKEND || "http://localhost:5000";

  // -------------------
  // Animated stars background
  // -------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.5 + 0.2,
      vx: Math.random() * 0.2 - 0.1,
      vy: Math.random() * 0.2 - 0.1,
    }));

    const draw = () => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      stars.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = w;
        if (s.x > w) s.x = 0;
        if (s.y < 0) s.y = h;
        if (s.y > h) s.y = 0;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34,197,94,0.8)";
        ctx.fill();
      });
      requestAnimationFrame(draw);
    };
    draw();

    const handleResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // -------------------
  // Glow effect follows mouse
  // -------------------
  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;
    let latestX = window.innerWidth / 2;
    let latestY = window.innerHeight / 2;
    let ticking = false;

    const update = () => {
      glow.style.transform = `translate3d(${latestX - 110}px, ${latestY - 110}px, 0)`;
      ticking = false;
    };
    const onMove = (e) => {
      latestX = e.clientX;
      latestY = e.clientY;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // -------------------
  // Custom cursor
  // -------------------
  useEffect(() => {
    const dot = cursorDotRef.current;
    const ring = cursorRingRef.current;
    if (!dot || !ring) return;

    let x = window.innerWidth / 2, y = window.innerHeight / 2, rx = x, ry = y, rafId;

    const move = (e) => { x = e.clientX; y = e.clientY; dot.style.transform = `translate3d(${x - 4}px, ${y - 4}px, 0)`; };
    const tick = () => { rx += (x - rx) * 0.18; ry += (y - ry) * 0.18; ring.style.transform = `translate3d(${rx - 16}px, ${ry - 16}px, 0)`; rafId = requestAnimationFrame(tick); };
    const down = () => { ring.style.transition = 'transform 40ms, border-color 120ms'; ring.style.borderColor = 'rgba(34,197,94,0.9)'; ring.style.transform += ' scale(0.85)'; };
    const up = () => { ring.style.transition = 'transform 220ms ease-out, border-color 400ms'; ring.style.borderColor = 'rgba(255,255,255,0.35)'; ring.style.transform = ring.style.transform.replace(' scale(0.85)',''); };

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mousedown", down, { passive: true });
    window.addEventListener("mouseup", up, { passive: true });

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white cursor-none">
      {/* Canvas background */}
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />

      {/* Glow and custom cursor */}
      <div ref={cursorRingRef} className="pointer-events-none fixed w-8 h-8 rounded-full border border-white/30 mix-blend-screen" style={{ boxShadow: '0 0 24px rgba(34,197,94,0.25)' }} />
      <div ref={cursorDotRef} className="pointer-events-none fixed w-2 h-2 rounded-full bg-green-400 mix-blend-screen" />
      <div ref={glowRef} className="pointer-events-none fixed w-[220px] h-[220px] rounded-full blur-2xl opacity-35" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.5) 0%, rgba(34,197,94,0.15) 45%, transparent 70%)' }} />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 shadow-xl text-center">
          <h1 className="text-4xl font-extrabold mb-6">Resona</h1>
          <p className="text-white/70 mb-10">Your AI-powered Spotify companion</p>
          <a href={`${backendURL}/auth/google`} className="inline-flex items-center gap-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-3 transition-all shadow-lg shadow-green-500/20">
            Login with Google
          </a>
        </div>
      </div>
    </div>
  );
}
