'use client';

import { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hidden, setHidden] = useState(true);
  const [clicked, setClicked] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);

  useEffect(() => {
    const addEventListeners = () => {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseenter', onMouseEnter);
      document.addEventListener('mouseleave', onMouseLeave);
      document.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mouseup', onMouseUp);
    };

    const removeEventListeners = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseenter', onMouseEnter);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const onMouseEnter = () => {
      setHidden(false);
    };

    const onMouseLeave = () => {
      setHidden(true);
    };

    const onMouseDown = () => {
      setClicked(true);
    };

    const onMouseUp = () => {
      setClicked(false);
    };

    addEventListeners();

    // Track hover on links and buttons
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.closest('a') || target.closest('button')) {
        setLinkHovered(true);
      }
    };

    const handleMouseOut = () => {
      setLinkHovered(false);
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      removeEventListeners();
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return null;
  }

  if (typeof window !== 'undefined' && 'ontouchstart' in window) {
    return null;
  }

  return (
    <>
      <div
        className="custom-cursor"
        style={{
           left: `${position.x}px`,
           top: `${position.y}px`,
        }}
      />
       <style jsx global>{`
         * {
           cursor: none !important;
         }
         .custom-cursor {
           width: 20px;
           height: 20px;
           border: 2px solid #C9A24B;
           border-radius: 50%;
           position: fixed;
           pointer-events: none;
           z-index: 9999;
           transform: translate(-50%, -50%);
           transition: width 0.2s, height 0.2s, background-color 0.2s;
           background-color: rgba(201, 162, 75, 0.1);
         }
         .custom-cursor.hidden {
           opacity: 0;
         }
         .custom-cursor.clicked {
           width: 15px;
           height: 15px;
         }
         .custom-cursor.hovered {
           width: 40px;
           height: 40px;
           background-color: rgba(201, 162, 75, 0.2);
           border-width: 1px;
         }
       `}</style>
    </>
  );
}
