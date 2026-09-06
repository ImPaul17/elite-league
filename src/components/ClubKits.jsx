import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { KIT_SPLITS, getClubKits } from "../data/clubKits";
import { ClubKitDialog } from "./ClubKitDialog";
import { SectionHeading, siteAsset } from "./ui";
import "./club-kits.css";

export function ClubKits({ club }) {
  const reduceMotion = useReducedMotion();
  const [selectedSplit, setSelectedSplit] = useState("split-3");
  const [openIndex, setOpenIndex] = useState(null);
  const triggerRef = useRef(null);
  const closeViewer = useCallback(() => setOpenIndex(null), []);
  const kits = getClubKits(club.id, selectedSplit);
  const titleId = `club-kits-${club.id}`;

  return (
    <section className="club-kits panel" aria-labelledby={titleId}>
      <SectionHeading
        id={titleId}
        title="Equipaciones"
        action={
          <div className="club-kits-splits" role="group" aria-label="Seleccionar split de las equipaciones">
            {KIT_SPLITS.map((split) => {
              const available = getClubKits(club.id, split.id).length > 0;
              const selected = available && split.id === selectedSplit;
              return (
                <button
                  type="button"
                  key={split.id}
                  disabled={!available}
                  aria-pressed={selected}
                  aria-label={available ? split.label : `${split.label}: equipaciones no disponibles`}
                  className={selected ? "is-active" : ""}
                  onClick={() => setSelectedSplit(split.id)}
                >
                  {selected && <motion.span className="club-kits-splits-indicator" layoutId={`club-kits-split-indicator-${club.id}`} transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 460, damping: 34, mass: 0.65 }} />}
                  <span>{split.label}</span>
                </button>
              );
            })}
          </div>
        }
      />
      {kits.length > 0 ? (
        <div className={`club-kits-grid${kits.length === 1 && kits[0].id === "full" ? " is-full-kit-grid" : ""}`}>
          {kits.map((kit, index) => {
            const isFullKit = kit.id === "full";
            const image = (
              <img
                src={siteAsset(kit.src)}
                alt={`Equipación ${kit.label.toLocaleLowerCase("es")} de ${club.name} · ${KIT_SPLITS.find((split) => split.id === selectedSplit)?.label}`}
                width={kit.width}
                height={kit.height}
                loading="lazy"
                decoding="async"
              />
            );
            return (
              <figure className={`club-kit${isFullKit ? " is-full-kit" : ""}`} key={`${selectedSplit}-${kit.id}`}>
                {isFullKit ? (
                  <div className="club-kit-open club-kit-static" aria-label={`Equipación ${kit.label.toLocaleLowerCase("es")} de ${club.name}`}>
                    {image}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="club-kit-open"
                    aria-haspopup="dialog"
                    aria-label={`Ampliar equipación ${kit.label.toLocaleLowerCase("es")} de ${club.name}`}
                    onClick={(event) => {
                      triggerRef.current = event.currentTarget;
                      setOpenIndex(index);
                    }}
                  >
                    {image}
                  </button>
                )}
                {!isFullKit && <figcaption>{kit.label}</figcaption>}
              </figure>
            );
          })}
        </div>
      ) : (
        <p className="club-kits-empty">Todavía no hay equipaciones disponibles para este club.</p>
      )}
      <AnimatePresence>
        {openIndex !== null && (
          <ClubKitDialog
            club={club}
            kits={kits}
            splitLabel={KIT_SPLITS.find((split) => split.id === selectedSplit)?.label}
            initialIndex={openIndex}
            onClose={closeViewer}
            triggerRef={triggerRef}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
