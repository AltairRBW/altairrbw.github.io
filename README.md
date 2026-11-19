# Altair Website — starter frontend

A responsive, multi-page static with dynamic(thanks to genius tip) frontend for the Altair competitive Minecraft community.

## Files
- `index.html` — homepage
- `leaderboard.html` — searchable/sortable ranked leaderboard
- `players.html` — player directory
- `player.html` — dynamic player profile (`?ign=Nok`)
- `about.html` — organisation overview
- `style.css` — blue-dark visual system and responsive layout
- `data.js` — sample player records and configuration
- `script.js` — navigation, search, sorting and profile rendering

## Data (JSON)
All stats load from `data.json` next to `index.html`. Shape: `{ "season": "2", "game": "Bedwars", "updated": "optional text", "players": [ { "ign", "elo", "peak", "wins", "losses", "kills", "deaths", "finalKills", "finalDeaths", "beds", "emeralds", "mvps", "streak", "tier", "history": [..] } ] }`. A bare array of players also works, and snake_case keys (`final_kills`, `peak_elo`) are accepted. Rank is computed from Elo automatically.  

Go follow tip she is insane at programming!
