const HOME_CREST = "/clubs/rest-of-elite-local.png";
const AWAY_CREST = "/clubs/rest-of-elite-away.png";

export const SPLIT_3_PLAYOFF_QUALIFICATION = [
  { id: "semifinals", positions: [1], label: "1.º", round: "Directo a semifinales", description: "El líder de la fase regular comienza su participación en semifinales." },
  { id: "quarterfinals", positions: [2, 3, 4], label: "2.º – 4.º", round: "Directos a cuartos de final", description: "El segundo, tercero y cuarto entran directamente en cuartos." },
  { id: "round-of-16", positions: [5, 6, 7, 8, 9], label: "5.º – 9.º", round: "Directos a octavos de final", description: "Del quinto al noveno tienen asegurada su plaza en octavos." },
  { id: "last-octavos-place", positions: [10, 11], label: "10.º y 11.º", round: "Última plaza de octavos", description: "El décimo juega como local ante el undécimo. El ganador se enfrenta al quinto en octavos; el perdedor queda eliminado." },
  { id: "eliminated", positions: [12], label: "12.º", round: "Eliminado", description: "El último clasificado queda fuera de la fase final." },
];

const seed = (position) => ({ type: "seed", position, label: `${position}.º de liga` });
const winner = (matchOrder) => ({ type: "winner", matchOrder, label: `Ganador P${matchOrder}` });

function playoffMatch(order, home, away) {
  return {
    id: `split-3-playoff-${order}`,
    code: `P${order}`,
    order,
    home: { ...home, crest: HOME_CREST },
    away: { ...away, crest: AWAY_CREST },
  };
}

// Positions refer to the FINAL regular-season standings, not today's table.
// Winner references define advancement without inventing teams or results.
export const SPLIT_3_PLAYOFF_STAGES = [
  {
    id: "last-octavos-place",
    label: "Última Plaza Octavos",
    matches: [playoffMatch(1, seed(10), seed(11))],
  },
  {
    id: "round-of-16",
    label: "Octavos De Final",
    matches: [
      playoffMatch(2, seed(5), winner(1)),
      playoffMatch(3, seed(6), seed(9)),
      playoffMatch(4, seed(7), seed(8)),
    ],
  },
  {
    id: "quarterfinals",
    label: "Cuartos De Final",
    matches: [
      playoffMatch(5, seed(2), winner(4)),
      playoffMatch(6, seed(3), winner(3)),
      playoffMatch(7, seed(4), winner(2)),
    ],
  },
  {
    id: "semifinals",
    label: "Semifinales",
    matches: [playoffMatch(8, seed(1), winner(7)), playoffMatch(9, winner(5), winner(6))],
  },
  {
    id: "final",
    label: "Final",
    matches: [playoffMatch(10, winner(8), winner(9))],
  },
];
