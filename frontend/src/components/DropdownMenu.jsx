import React, { useEffect, useRef, useState } from 'react';

export default function DropdownMenu({ button, items = [] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = e => {
      if (!ref.current || ref.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <div onClick={() => setOpen(o => !o)}>{button}</div>
      {open && (
        <div className="absolute right-0 mt-2 w-44 origin-top-right rounded-md bg-black/90 border border-white/10 shadow-lg">
          <div className="py-1">
            {items.map((it, idx) => (
              <button key={idx} onClick={() => { setOpen(false); it.onClick?.(); }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-white/10">
                {it.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


