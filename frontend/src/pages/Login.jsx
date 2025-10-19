import { useEffect, useRef } from "react";

export default function Login() {
  const glowRef = useRef(null);
  const cursorDotRef = useRef(null);
  const cursorRingRef = useRef(null);
  const canvasRef = useRef(null);

  const backendURL = import.meta.env.VITE_BACKEND || "http://localhost:5000";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
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
      stars.forEach((s) => {
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

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Glow effect follows mouse
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

  // Custom cursor (only on desktop)
  useEffect(() => {
    const dot = cursorDotRef.current;
    const ring = cursorRingRef.current;
    if (!dot || !ring) return;

    // Hide on mobile
    const isMobile = window.matchMedia("(max-width: 1024px)").matches;
    if (isMobile) {
      dot.style.display = 'none';
      ring.style.display = 'none';
      return;
    }

    let x = window.innerWidth / 2,
      y = window.innerHeight / 2,
      rx = x,
      ry = y,
      rafId;

    const move = (e) => {
      x = e.clientX;
      y = e.clientY;
      dot.style.transform = `translate3d(${x - 4}px, ${y - 4}px, 0)`;
    };
    const tick = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      ring.style.transform = `translate3d(${rx - 16}px, ${ry - 16}px, 0)`;
      rafId = requestAnimationFrame(tick);
    };
    const down = () => {
      ring.style.transition = "transform 40ms, border-color 120ms";
      ring.style.borderColor = "rgba(34,197,94,0.9)";
      ring.style.transform += " scale(0.85)";
    };
    const up = () => {
      ring.style.transition = "transform 220ms ease-out, border-color 400ms";
      ring.style.borderColor = "rgba(255,255,255,0.35)";
      ring.style.transform = ring.style.transform.replace(" scale(0.85)", "");
    };

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mousedown", down, { passive: true });
    window.addEventListener("mouseup", up, { passive: true });

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white lg:cursor-none">
      {/* Canvas background */}
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />

      {/* Glow and custom cursor (desktop only) */}
      <div
        ref={cursorRingRef}
        className="pointer-events-none fixed w-8 h-8 rounded-full border border-white/30 mix-blend-screen hidden lg:block"
        style={{ boxShadow: "0 0 24px rgba(34,197,94,0.25)" }}
      />
      <div
        ref={cursorDotRef}
        className="pointer-events-none fixed w-2 h-2 rounded-full bg-green-400 mix-blend-screen hidden lg:block"
      />
      <div
        ref={glowRef}
        className="pointer-events-none fixed w-[220px] h-[220px] rounded-full blur-2xl opacity-35 hidden lg:block"
        style={{
          background:
            "radial-gradient(circle, rgba(34,197,94,0.5) 0%, rgba(34,197,94,0.15) 45%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 lg:px-6">
        <div className="w-full max-w-md lg:max-w-xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 lg:p-10 shadow-xl text-center">
          {/* Custom Logo with animated arcs */}
          <div className="flex justify-center mb-6">
            <svg width="60" height="60" className="lg:w-20 lg:h-20" viewBox="0 0 100 100" fill="none">
              {/* Outer circle */}
              <circle cx="50" cy="50" r="48" stroke="rgba(34,197,94,0.7)" strokeWidth="3" />

              {/* Center R */}
              <text
                x="50%"
                y="55%"
                textAnchor="middle"
                fill="white"
                fontSize="40"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                R
              </text>

              {/* Arc 1 */}
              <path
                d="M30 70 Q50 60 70 70"
                stroke="rgba(34,197,94,0.8)"
                strokeWidth="4"
                strokeLinecap="round"
              >
                <animate
                  attributeName="d"
                  dur="2s"
                  repeatCount="indefinite"
                  values="
                    M30 70 Q50 60 70 70;
                    M30 72 Q50 62 70 72;
                    M30 70 Q50 60 70 70
                  "
                />
              </path>

              {/* Arc 2 */}
              <path
                d="M32 58 Q50 50 68 58"
                stroke="rgba(34,197,94,0.6)"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <animate
                  attributeName="d"
                  dur="2.3s"
                  repeatCount="indefinite"
                  values="
                    M32 58 Q50 50 68 58;
                    M32 60 Q50 52 68 60;
                    M32 58 Q50 50 68 58
                  "
                />
              </path>

              {/* Arc 3 */}
              <path
                d="M34 46 Q50 42 66 46"
                stroke="rgba(34,197,94,0.5)"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <animate
                  attributeName="d"
                  dur="2.6s"
                  repeatCount="indefinite"
                  values="
                    M34 46 Q50 42 66 46;
                    M34 48 Q50 44 66 48;
                    M34 46 Q50 42 66 46
                  "
                />
              </path>
            </svg>
          </div>

          <h1 className="text-3xl lg:text-4xl font-extrabold mb-4 lg:mb-6">Resona</h1>
          <p className="text-white/70 mb-8 lg:mb-10 text-sm lg:text-base">Your AI-powered Spotify companion</p>

          {/* Spotify login button */}
          <a
            href={`${backendURL}/auth/spotify`}
            className="inline-flex items-center gap-3 rounded-xl bg-green-500 hover:bg-green-400 active:bg-green-600 text-black font-semibold px-6 py-3 transition-all shadow-lg shadow-green-500/20 active:scale-95 text-sm lg:text-base"
          >
            <svg className="w-5 h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 6.64 5.37 12 12 12s12-5.36 12-12c0-6.63-5.37-12-12-12zm5.42 17.54c-.22.36-.68.47-1.04.26-2.84-1.73-6.42-2.12-10.64-1.16-.41.09-.82-.17-.91-.59-.09-.42.17-.82.59-.91 4.6-1.02 8.55-.58 11.7 1.34.36.21.47.68.26 1.06zm1.48-3.29c-.28.46-.88.6-1.34.32-3.25-1.98-8.21-2.55-12.05-1.39-.52.16-1.08-.13-1.24-.65-.16-.52.13-1.08.65-1.24 4.32-1.34 9.77-.72 13.48 1.59.46.28.6.88.32 1.37zm.13-3.39c-3.89-2.31-10.33-2.52-14.04-1.37-.63.2-1.29-.15-1.48-.78-.2-.63.15-1.29.78-1.48 4.27-1.34 11.38-1.09 15.83 1.55.57.34.75 1.08.41 1.66-.34.57-1.08.75-1.66.41z" />
            </svg>
            Login with Spotify
          </a>
        </div>
      </div>
    </div>
  );
}
