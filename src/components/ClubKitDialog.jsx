import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { siteAsset } from "./ui";

export function ClubKitDialog({ club, kits, splitLabel, initialIndex = 0, onClose, triggerRef }) {
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const kitCount = kits.length;
  const [selectedIndex, setSelectedIndex] = useState(() => (
    kitCount && Number.isInteger(initialIndex) ? ((initialIndex % kitCount) + kitCount) % kitCount : 0
  ));
  const activeIndex = kitCount ? selectedIndex % kitCount : 0;
  const selectedKit = kits[activeIndex];

  useEffect(() => {
    if (!kitCount) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && !event.altKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        const direction = event.key === "ArrowLeft" ? -1 : 1;
        setSelectedIndex((index) => (index + direction + kitCount) % kitCount);
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable.at(-1);
      const focusIsOnControl = focusable.includes(document.activeElement);
      if (!first) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
      } else if (event.shiftKey && (document.activeElement === first || !focusIsOnControl)) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && (document.activeElement === last || !focusIsOnControl)) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus({ preventScroll: true }));
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.cancelAnimationFrame(focusFrame);
      const trigger = triggerRef?.current;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [kitCount, onClose, triggerRef]);

  if (!selectedKit) return null;

  const changeKit = (direction) => setSelectedIndex((index) => (index + direction + kitCount) % kitCount);

  return createPortal(
    <motion.div
      className="club-crest-dialog-backdrop club-kits-dialog-backdrop"
      style={{ "--club-accent": club.color ?? "#3f7c35" }}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.2 }}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.section
        className="club-crest-dialog club-kits-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={dialogRef}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.97, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985, y: 8 }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <header className="club-crest-dialog-header">
          <div><p>Equipaciones</p><h2 id={titleId}>{club.name}</h2></div>
          <button type="button" aria-label="Cerrar visor de equipaciones" ref={closeButtonRef} onClick={onClose}><span>Cerrar</span><b aria-hidden="true">×</b></button>
        </header>

        <div className="club-crest-dialog-stage">
          <button className="club-crest-dialog-arrow is-previous" type="button" aria-label="Ver equipación anterior" disabled={kitCount < 2} onClick={() => changeKit(-1)}>←</button>
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              className="club-kits-dialog-art"
              key={selectedKit.id}
              initial={reduceMotion ? false : { opacity: 0, x: 26, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -26, scale: 1.035 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <img
                src={siteAsset(selectedKit.src)}
                alt={`Equipación ${selectedKit.label.toLocaleLowerCase("es")} de ${club.name} · ${splitLabel}`}
                width={selectedKit.width}
                height={selectedKit.height}
                decoding="async"
              />
            </motion.div>
          </AnimatePresence>
          <button className="club-crest-dialog-arrow is-next" type="button" aria-label="Ver siguiente equipación" disabled={kitCount < 2} onClick={() => changeKit(1)}>→</button>
        </div>

        <footer className="club-crest-dialog-details" aria-live="polite">
          <span className="club-crest-dialog-count">{activeIndex + 1} / {kitCount}</span>
          <div>{selectedKit.id !== "full" && <p>{selectedKit.label}</p>}<strong>{splitLabel}</strong></div>
          <div className="club-crest-dialog-pagination" role="group" aria-label="Seleccionar equipación">
            {kits.map((kit, index) => <button type="button" className={index === activeIndex ? "is-active" : ""} key={kit.id} aria-label={`Ver equipación ${kit.label.toLocaleLowerCase("es")}`} aria-pressed={index === activeIndex} onClick={() => setSelectedIndex(index)} />)}
          </div>
        </footer>
      </motion.section>
    </motion.div>,
    document.body,
  );
}
