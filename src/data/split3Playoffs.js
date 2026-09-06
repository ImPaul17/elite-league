const UNDECIDED_HOME = {
  label: "Por decidir",
  crest: "/clubs/rest-of-elite-local.png",
};

const UNDECIDED_AWAY = {
  label: "Por decidir",
  crest: "/clubs/rest-of-elite-away.png",
};

export const SPLIT_3_PLAYOFF_QUALIFICATION = [
  { id: "semifinals", positions: [1], label: "1.º", round: "Directo a semifinales", description: "El líder de la fase regular comienza su participación en semifinales." },
  { id: "quarterfinals", positions: [2, 3, 4], label: "2.º – 4.º", round: "Directos a cuartos de final", description: "El segundo, tercero y cuarto entran directamente en cuartos." },
  { id: "round-of-16", positions: [5, 6, 7, 8, 9], label: "5.º – 9.º", round: "Directos a octavos de final", description: "Del quinto al noveno tienen asegurada su plaza en octavos." },
  { id: "last-octavos-place", positions: [10, 11], label: "10.º y 11.º", round: "Última plaza de octavos", description: "Se enfrentan entre sí en un partido. El ganador pasa a octavos y el perdedor queda eliminado." },
  { id: "eliminated", positions: [12], label: "12.º", round: "Eliminado", description: "El último clasificado queda fuera de la fase final." },
];

function undecidedMatch(order) {
  return {
    id: `split-3-playoff-${order}`,
    order,
    home: UNDECIDED_HOME,
    away: UNDECIDED_AWAY,
  };
}

// Se mantiene separado de los resultados de liga: al cerrar la fase regular,
// basta sustituir los dos equipos de cada cruce por los clubes clasificados.
export const SPLIT_3_PLAYOFF_STAGES = [
  {
    id: "last-octavos-place",
    label: "Última Plaza Octavos",
    matches: [undecidedMatch(7)],
  },
  {
    id: "round-of-16",
    label: "Octavos De Final",
    matches: [undecidedMatch(8), undecidedMatch(9), undecidedMatch(10)],
  },
  {
    id: "quarterfinals",
    label: "Cuartos De Final",
    matches: [undecidedMatch(11), undecidedMatch(12), undecidedMatch(13)],
  },
  {
    id: "semifinals",
    label: "Semifinales",
    matches: [undecidedMatch(14), undecidedMatch(15)],
  },
  {
    id: "final",
    label: "Final",
    matches: [undecidedMatch(16)],
  },
];
