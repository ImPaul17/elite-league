// First public profile pilot. This catalogue does not register players in
// Supabase or enable match lineups; competition registrations stay separate.
// Whitelisted data from 279982 - Pol Guillem.player (FC25). No appearance,
// contract, potential or unused cached CARD fields are shipped to the browser.
export const PLAYER_PROFILES = [{
  id: "fc25-279982",
  slug: "pol-guillem",
  sourcePlayerId: 279982,
  game: "FC25",
  clubId: "pico-fc",
  editionId: "split-3",
  firstName: "Pol",
  lastName: "Guillem",
  commonName: "",
  jerseyName: "P. Guillem",
  birthDate: "1996-06-03",
  nationality: "España",
  nationalityCode: "ES",
  preferredFoot: "Derecha",
  weakFoot: 2,
  skillMoves: 1,
  positions: ["POR"],
  positionGroup: "GK",
  shirtNumber: 1,
  overall: 86,
  attributes: {
    gkdiving: 88, gkhandling: 85, gkkicking: 87, gkreflexes: 88, gkpositioning: 84,
    acceleration: 66, sprintspeed: 67,
    positioning: 20, finishing: 19, shotpower: 44, longshots: 18, volleys: 11, penalties: 27,
    vision: 20, crossing: 20, freekickaccuracy: 18, shortpassing: 32, longpassing: 25, curve: 20,
    agility: 38, balance: 42, reactions: 78, ballcontrol: 18, dribbling: 19, composure: 58,
    interceptions: 25, headingaccuracy: 19, defensiveawareness: 16, standingtackle: 19, slidingtackle: 19,
    jumping: 57, stamina: 25, strength: 58, aggression: 18,
  },
}];

export function getPlayerProfile(slug) {
  return PLAYER_PROFILES.find((player) => player.slug === slug) ?? null;
}

export function getClubPlayerProfiles(clubId, editionId = "split-3") {
  return PLAYER_PROFILES.filter((player) => player.clubId === clubId && player.editionId === editionId);
}
