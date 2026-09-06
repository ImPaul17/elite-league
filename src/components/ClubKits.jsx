import { useCallback, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { KIT_SPLITS, getClubKits } from "../data/clubKits";
import { ClubKitDialog } from "./ClubKitDialog";
import { SectionHeading, siteAsset } from "./ui";
import "./club-kits.css";

export function ClubKits({ club }) {
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
                  {split.label}
                </button>
              );
            })}
          </div>
        }
      />
      {kits.length > 0 ? (
        <div className="club-kits-grid">
          {kits.map((kit, index) => (
            <figure className="club-kit" key={`${selectedSplit}-${kit.id}`}>
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
                <img
                  src={siteAsset(kit.src)}
                  alt={`Equipación ${kit.label.toLocaleLowerCase("es")} de ${club.name} · ${KIT_SPLITS.find((split) => split.id === selectedSplit)?.label}`}
                  width={kit.width}
                  height={kit.height}
                  loading="lazy"
                  decoding="async"
                />
              </button>
              <figcaption>{kit.label}</figcaption>
            </figure>
          ))}
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
