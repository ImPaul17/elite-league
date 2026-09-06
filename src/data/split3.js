// Update these values as the competition progresses.
export const CURRENT_MATCHDAY = 1;
export const RESULTS_VISIBLE = false;

// Example result:
// match("Pico FC", "Rayo Zeta", { status: "completed", score: { home: 4, away: 4 }, penalties: { home: 3, away: 2 } })
const match = (home, away, details = {}) => ({
  home,
  away,
  status: "scheduled",
  score: null,
  penalties: null,
  ...details,
});

export const SPLIT_3_MATCHDAYS = [
  {
    number: 1,
    date: null,
    matches: [
      match("Pico FC", "Rayo Zeta"),
      match("URSS FC", "CA Coca Jrs"),
      match("Impuestos FC", "Karasuno Falcons"),
      match("BEE FC", "Lego FC"),
      match("Estaross FC", "Los Mugiwaras FC"),
      match("Maki FC", "El Caudillo FC"),
    ],
  },
  {
    number: 2,
    date: null,
    matches: [
      match("URSS FC", "El Caudillo FC"),
      match("Maki FC", "Estaross FC"),
      match("Karasuno Falcons", "Pico FC"),
      match("Lego FC", "CA Coca Jrs"),
      match("Rayo Zeta", "BEE FC"),
      match("Los Mugiwaras FC", "Impuestos FC"),
    ],
  },
  {
    number: 3,
    date: null,
    matches: [
      match("Estaross FC", "CA Coca Jrs"),
      match("Maki FC", "BEE FC"),
      match("Pico FC", "URSS FC"),
      match("Rayo Zeta", "Karasuno Falcons"),
      match("Impuestos FC", "El Caudillo FC"),
      match("Lego FC", "Los Mugiwaras FC"),
    ],
  },
  {
    number: 4,
    date: null,
    matches: [
      match("Pico FC", "CA Coca Jrs"),
      match("BEE FC", "Impuestos FC"),
      match("Maki FC", "Los Mugiwaras FC"),
      match("Karasuno Falcons", "URSS FC"),
      match("Rayo Zeta", "El Caudillo FC"),
      match("Lego FC", "Estaross FC"),
    ],
  },
  {
    number: 5,
    date: null,
    matches: [
      match("Los Mugiwaras FC", "BEE FC"),
      match("El Caudillo FC", "Estaross FC"),
      match("Karasuno Falcons", "Lego FC"),
      match("Rayo Zeta", "CA Coca Jrs"),
      match("URSS FC", "Impuestos FC"),
      match("Maki FC", "Pico FC"),
    ],
  },
  {
    number: 6,
    date: null,
    matches: [
      match("Impuestos FC", "CA Coca Jrs"),
      match("BEE FC", "El Caudillo FC"),
      match("Pico FC", "Estaross FC"),
      match("Karasuno Falcons", "Los Mugiwaras FC"),
      match("Maki FC", "Rayo Zeta"),
      match("Lego FC", "URSS FC"),
    ],
  },
  {
    number: 7,
    date: null,
    matches: [
      match("Los Mugiwaras FC", "Rayo Zeta"),
      match("El Caudillo FC", "Pico FC"),
      match("Karasuno Falcons", "CA Coca Jrs"),
      match("URSS FC", "BEE FC"),
      match("Estaross FC", "Impuestos FC"),
      match("Maki FC", "Lego FC"),
    ],
  },
  {
    number: 8,
    date: null,
    matches: [
      match("BEE FC", "CA Coca Jrs"),
      match("Los Mugiwaras FC", "El Caudillo FC"),
      match("Karasuno Falcons", "Estaross FC"),
      match("Rayo Zeta", "Impuestos FC"),
      match("Lego FC", "Pico FC"),
      match("Maki FC", "URSS FC"),
    ],
  },
  {
    number: 9,
    date: null,
    matches: [
      match("Los Mugiwaras FC", "CA Coca Jrs"),
      match("El Caudillo FC", "Lego FC"),
      match("URSS FC", "Rayo Zeta"),
      match("Impuestos FC", "Pico FC"),
      match("Estaross FC", "BEE FC"),
      match("Karasuno Falcons", "Maki FC"),
    ],
  },
  {
    number: 10,
    date: null,
    matches: [
      match("BEE FC", "Karasuno Falcons"),
      match("Pico FC", "Los Mugiwaras FC"),
      match("El Caudillo FC", "CA Coca Jrs"),
      match("Maki FC", "Impuestos FC"),
      match("Lego FC", "Rayo Zeta"),
      match("Estaross FC", "URSS FC"),
    ],
  },
  {
    number: 11,
    date: null,
    matches: [
      match("Pico FC", "BEE FC"),
      match("El Caudillo FC", "Karasuno Falcons"),
      match("URSS FC", "Los Mugiwaras FC"),
      match("Impuestos FC", "Lego FC"),
      match("Estaross FC", "Rayo Zeta"),
      match("Maki FC", "CA Coca Jrs"),
    ],
  },
];
