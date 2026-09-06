const UNDECIDED_HOME = {
  label: "Por decidir",
  crest: "/clubs/rest-of-elite-local.png",
};

const UNDECIDED_AWAY = {
  label: "Por decidir",
  crest: "/clubs/rest-of-elite-away.png",
};

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
