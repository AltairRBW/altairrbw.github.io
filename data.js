// Filled from data.json by script.js. Helpers below are used for derived stats.
const ALTAIR_DATA = { season: "2", game: "Bedwars", discordInvite: "https://discord.gg/HVEfteFdDG", players: [] };
const altairWinRate = p => (p.wins + p.losses) ? p.wins / (p.wins + p.losses) * 100 : 0;
const altairKdr = p => p.deaths ? p.kills / p.deaths : p.kills;
const altairFkdr = p => p.finalDeaths ? p.finalKills / p.finalDeaths : p.finalKills;
