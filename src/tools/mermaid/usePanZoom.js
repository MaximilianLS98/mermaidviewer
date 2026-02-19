import { useRef, useCallback } from 'react';

export function usePanZoom(containerRef, innerRef, onZoomChange) {
  const tf = useRef({ scale: 1, x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragAnchor = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef(0);

  function applyTransform(animate = false) {
    const inner = innerRef.current;
    if (!inner) return;
    if (animate) {
      inner.style.transition = 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)';
      setTimeout(() => { if (inner) inner.style.transition = ''; }, 230);
    } else {
      inner.style.transition = '';
    }
    inner.style.transform = `translate(${tf.current.x}px, ${tf.current.y}px) scale(${tf.current.scale})`;
    onZoomChange?.(Math.round(tf.current.scale * 100));
  }

  const zoomAround = useCallback((cx, cy, factor, animate = false) => {
    const t = tf.current;
    const newScale = Math.max(0.04, Math.min(20, t.scale * factor));
    const ratio = newScale / t.scale;
    t.x = cx - ratio * (cx - t.x);
    t.y = cy - ratio * (cy - t.y);
    t.scale = newScale;
    applyTransform(animate);
  }, []);

  const fitToView = useCallback((svgEl) => {
    const container = containerRef.current;
    if (!svgEl || !container) return;

    const cRect = container.getBoundingClientRect();
    const sBCR  = svgEl.getBoundingClientRect();
    const nW = sBCR.width  / tf.current.scale;
    const nH = sBCR.height / tf.current.scale;
    const pad = 40;
    const newScale = Math.min(
      (cRect.width  - pad * 2) / nW,
      (cRect.height - pad * 2) / nH,
      3
    );

    tf.current.scale = newScale;
    tf.current.x = (cRect.width  - nW * newScale) / 2;
    tf.current.y = (cRect.height - nH * newScale) / 2;
    applyTransform(true);
  }, []);

  const resetTransform = useCallback(() => {
    tf.current = { scale: 1, x: 0, y: 0 };
    applyTransform(true);
  }, []);

  // Register event listeners
  function attachListeners() {
    const container = containerRef.current;
    if (!container) return;

    function onWheel(e) {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      zoomAround(e.clientX - rect.left, e.clientY - rect.top, e.deltaY > 0 ? 0.87 : 1.15);
    }

    function onMouseDown(e) {
      if (e.button !== 0) return;
      isDragging.current = true;
      dragAnchor.current = { x: e.clientX - tf.current.x, y: e.clientY - tf.current.y };
      container.style.cursor = 'grabbing';
      e.preventDefault();
    }

    function onMouseMove(e) {
      if (!isDragging.current) return;
      tf.current.x = e.clientX - dragAnchor.current.x;
      tf.current.y = e.clientY - dragAnchor.current.y;
      applyTransform();
    }

    function onMouseUp() {
      if (!isDragging.current) return;
      isDragging.current = false;
      container.style.cursor = 'grab';
    }

    function onTouchStart(e) {
      if (e.touches.length === 2) {
        lastTouchDist.current = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      } else if (e.touches.length === 1) {
        isDragging.current = true;
        dragAnchor.current = { x: e.touches[0].clientX - tf.current.x, y: e.touches[0].clientY - tf.current.y };
      }
      e.preventDefault();
    }

    function onTouchMove(e) {
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const rect = container.getBoundingClientRect();
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
        zoomAround(cx, cy, dist / lastTouchDist.current);
        lastTouchDist.current = dist;
      } else if (e.touches.length === 1 && isDragging.current) {
        tf.current.x = e.touches[0].clientX - dragAnchor.current.x;
        tf.current.y = e.touches[0].clientY - dragAnchor.current.y;
        applyTransform();
      }
      e.preventDefault();
    }

    function onTouchEnd() { isDragging.current = false; }

    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);

    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }

  return { tf, fitToView, resetTransform, zoomAround, attachListeners };
}
