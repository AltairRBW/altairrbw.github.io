(async () => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const fmt = (n, digits = 0) => Number(n).toFixed(digits);
  const initials = (name) => name.slice(0, 2).toUpperCase();
  const playerUrl = (name) => `player.html?ign=${encodeURIComponent(name)}`;

  // Mobile navigation
  const menuToggle = $("#menuToggle");
  const navLinks = $("#navLinks");
  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      const open = navLinks.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(open));
    });
  }

  // Discord destination is intentionally configurable rather than fabricated.
  document.querySelectorAll("[data-discord-link]").forEach((link) => {
    if (ALTAIR_DATA.discordInvite) link.href = ALTAIR_DATA.discordInvite;
    else {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        alert("Add the official Altair Discord invite in data.js first.");
      });
    }
  });

  // Load data.json (same folder). Accepts camelCase or snake_case keys.
  const pick = (o, ...k) => {
    for (const x of k) if (o[x] !== undefined && o[x] !== null) return o[x];
    return undefined;
  };
  const num = (v) => Number(v) || 0;
  const normalize = (raw) => {
    const list = Array.isArray(raw) ? raw : raw.players || [];
    return {
      season: String(pick(raw, "season") ?? ALTAIR_DATA.season),
      game: pick(raw, "game") || ALTAIR_DATA.game,
      updated: pick(raw, "updated") || "",
      players: list.map((p) => ({
        ign: String(pick(p, "ign", "name", "username") || "Unknown"),
        elo: num(pick(p, "elo", "rating")),
        peak: num(pick(p, "peak", "peak_elo", "peakElo", "elo")),
        wins: num(p.wins),
        losses: num(p.losses),
        kills: num(p.kills),
        deaths: num(p.deaths),
        finalKills: num(pick(p, "finalKills", "final_kills")),
        finalDeaths: num(pick(p, "finalDeaths", "final_deaths")),
        beds: num(pick(p, "beds", "bedsBroken", "beds_broken")),
        emeralds: num(p.emeralds),
        mvps: num(pick(p, "mvps", "mvp")),
        streak: pick(p, "streak") || "–",
        tier: pick(p, "tier") || "Unranked",
        game: pick(p, "game") || pick(raw, "game") || "Bedwars",
        history: (pick(p, "history", "elo_history", "eloHistory") || []).map(
          Number,
        ),
      })),
    };
  };
  try {
    const res = await fetch("data.json", { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    Object.assign(ALTAIR_DATA, normalize(await res.json()));
  } catch (err) {
    const m = document.querySelector("main");
    if (m)
      m.insertAdjacentHTML(
        "afterbegin",
        `<div class="panel not-found"><h3>Couldn't load data.json</h3><p class="muted">Check that data.json sits next to index.html and is valid JSON. Browsers block file loading from disk, so open the site through a local server such as VS Code Live Server.</p></div>`,
      );
  }
  const ranked = [...ALTAIR_DATA.players]
    .sort((a, b) => b.elo - a.elo)
    .map((p, i) => ({ ...p, rank: i + 1 }));
  document
    .querySelectorAll("[data-season]")
    .forEach((e) => (e.textContent = ALTAIR_DATA.season));
  document
    .querySelectorAll("[data-count]")
    .forEach((e) => (e.textContent = ranked.length));
  document
    .querySelectorAll("[data-top]")
    .forEach((e) => (e.textContent = ranked.length ? ranked[0].elo : "–"));
  document
    .querySelectorAll("[data-updated]")
    .forEach(
      (e) =>
        (e.textContent = ALTAIR_DATA.updated
          ? "Updated " + ALTAIR_DATA.updated
          : ""),
    );
  const rowMarkup = (p, rank) => `
    <a class="preview-row player-row" href="${playerUrl(p.ign)}">
      <span class="rank-number">${String(rank).padStart(2, "0")}</span>
      <span class="player-cell"><span class="avatar-fallback">${initials(p.ign)}</span><strong>${p.ign}</strong></span>
      <strong class="elo-value">${p.elo}</strong>
      <span>${p.wins}W – ${p.losses}L</span>
      <span>${fmt(altairWinRate(p), 1)}%</span>
    </a>`;

  const homeLeaderboard = $("#homeLeaderboard");
  if (homeLeaderboard)
    homeLeaderboard.innerHTML = ranked
      .map((p, i) => rowMarkup(p, i + 1))
      .join("");

  // Full leaderboard with search and sort
  const leaderboardBody = $("#leaderboardBody");
  if (leaderboardBody) {
    const search = $("#playerSearch");
    const sort = $("#sortSelect");
    const render = () => {
      const query = search.value.trim().toLowerCase();
      const key = sort.value;
      const list = ranked
        .filter((p) => p.ign.toLowerCase().includes(query))
        .sort((a, b) =>
          key === "winRate"
            ? altairWinRate(b) - altairWinRate(a)
            : key === "kdr"
              ? altairKdr(b) - altairKdr(a)
              : b.elo - a.elo,
        );
      $("#playerCount").textContent =
        `${list.length} PLAYER${list.length === 1 ? "" : "S"}`;
      leaderboardBody.innerHTML = list.length
        ? list
            .map(
              (p, i) => `
        <tr>
          <td class="rank-number">${String(i + 1).padStart(2, "0")}</td>
          <td><a class="table-player" href="${playerUrl(p.ign)}"><span class="avatar-fallback">${initials(p.ign)}</span><strong>${p.ign}</strong></a></td>
          <td class="elo-value">${p.elo}</td><td>${p.wins}W – ${p.losses}L</td>
          <td>${fmt(altairWinRate(p), 1)}%</td><td>${fmt(altairKdr(p), 2)}</td><td>${p.peak}</td>
        </tr>`,
            )
            .join("")
        : `<tr><td colspan="7" class="empty-state">No players match that search.</td></tr>`;
    };
    search.addEventListener("input", render);
    sort.addEventListener("change", render);
    render();
  }

  // Player directory
  const playerGrid = $("#playerGrid");
  if (playerGrid) {
    const search = $("#directorySearch");
    const render = () => {
      const query = search.value.trim().toLowerCase();
      const list = ranked.filter((p) => p.ign.toLowerCase().includes(query));
      playerGrid.innerHTML = list.length
        ? list
            .map(
              (p) => `
        <a class="directory-card panel" href="${playerUrl(p.ign)}">
          <div class="directory-top"><span class="avatar-large">${initials(p.ign)}</span><span class="mono muted">#${p.rank}</span></div>
          <h3>${p.ign}</h3><span class="muted small">${p.game}</span>
          <div class="directory-elo"><span class="eyebrow">Current Elo</span><strong>${p.elo}</strong></div>
          <div class="directory-foot"><span>${p.wins}W – ${p.losses}L</span><span>${fmt(altairWinRate(p), 1)}% WR</span><span>View profile</span></div>
        </a>`,
            )
            .join("")
        : `<div class="empty-state panel">No players found.</div>`;
    };
    search.addEventListener("input", render);
    render();
  }

  // Player profile, selected by ?ign=
  const profileContent = $("#profileContent");
  if (profileContent) {
    const requested =
      new URLSearchParams(location.search).get("ign") ||
      (ranked[0] || {}).ign ||
      "";
    const p = ranked.find(
      (player) => player.ign.toLowerCase() === requested.toLowerCase(),
    );
    if (!p) {
      profileContent.innerHTML = `<div class="not-found panel"><div class="eyebrow">PLAYER NOT FOUND</div><h1>That profile isn't here.</h1><p class="muted">Check the player name or return to the directory.</p><a class="button button-primary" href="players.html">Browse players</a></div>`;
    } else {
      document.title = `${p.ign} — Altair`;
      const stats = [
        ["KILLS", p.kills],
        ["DEATHS", p.deaths],
        ["KDR", fmt(altairKdr(p), 2)],
        ["FINAL KILLS", p.finalKills],
        ["FINAL DEATHS", p.finalDeaths],
        ["FKDR", fmt(altairFkdr(p), 2)],
        ["BEDS", p.beds],
        ["EMERALDS", p.emeralds],
        ["MVP", p.mvps],
      ];
      const points = p.history
        .map(
          (value, i) =>
            `${i * (300 / (p.history.length - 1 || 1))},${100 - (value / Math.max(...p.history, p.peak)) * 82}`,
        )
        .join(" ");
      profileContent.innerHTML = `
        <div class="profile-heading"><div><div class="page-kicker"><span class="status-dot"></span> Player profile · Ranked Bedwars</div><h1>${p.ign}</h1><div class="profile-sub">${p.tier} <span>·</span> ${p.game}</div></div><div class="profile-rank">Global position<strong>#${p.rank}<small> / ${ranked.length}</small></strong></div></div>
        <section class="profile-summary panel">
          <div class="elo-block"><span class="eyebrow">Current Elo</span><strong>${p.elo}</strong><span class="muted">PEAK ${p.peak}</span></div>
          <div class="summary-stat"><span>RECORD</span><strong>${p.wins}W–${p.losses}L</strong></div>
          <div class="summary-stat"><span>WIN RATE</span><strong>${fmt(altairWinRate(p), 1)}%</strong></div>
          <div class="summary-stat"><span>CURRENT STREAK</span><strong>${p.streak}</strong></div>
        </section>
        <div class="section-heading profile-section-heading"><div><div class="eyebrow">Match breakdown</div><h2>Performance <span>overview.</span></h2></div></div>
        <section class="stats-grid">${stats.map(([label, value], i) => `<article class="stat-card panel"><span class="stat-accent ${i % 3 === 2 ? "soft" : ""}"></span><span class="stat-label">${label}</span><strong>${value}</strong></article>`).join("")}</section>
        <section class="profile-lower">
          <article class="panel history-panel"><div class="panel-heading"><div><div class="eyebrow">RATING HISTORY</div><h3>Elo progression</h3></div><span class="mono muted">Recent matches</span></div>
            ${p.history.length > 1 ? `<div class="chart-wrap"><svg viewBox="0 0 300 112" role="img" aria-label="Elo history chart"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#438dff" stop-opacity=".25"/><stop offset="100%" stop-color="#438dff" stop-opacity="0"/></linearGradient></defs><path class="chart-area" d="M ${points.replaceAll(" ", " L ")} L 300 112 L 0 112 Z"/><polyline class="chart-line" points="${points}"/>${p.history.map((v, i) => `<circle class="chart-point" cx="${i * (300 / (p.history.length - 1 || 1))}" cy="${100 - (v / Math.max(...p.history, p.peak)) * 82}" r="2.8"/>`).join("")}</svg></div>` : `<p class="muted small">Not enough match history yet.</p>`}
            <div class="chart-axis"><span>EARLIER</span><span>RECENT</span></div>
          </article>
          <article class="panel record-panel"><div class="eyebrow">COMPETITIVE RECORD</div><h3>Consistency counts.</h3><div class="record-bar"><span style="width:${altairWinRate(p)}%"></span></div><div class="record-legend"><span>WINS <strong>${p.wins}</strong></span><span>LOSSES <strong>${p.losses}</strong></span></div><p class="muted small">Win rate of current season</p></article>
        </section>`;
    }
  }

  // Starfield: drifting stars + gentle cursor parallax (static if reduced motion)
  const cv = document.createElement("canvas");
  cv.id = "starfield";
  document.body.prepend(cv);
  const cx = cv.getContext("2d"),
    calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W,
    H,
    stars = [],
    mx = 0,
    my = 0;
  const size = () => {
    const r = devicePixelRatio || 1;
    W = cv.width = innerWidth * r;
    H = cv.height = innerHeight * r;
    stars = Array.from(
      { length: Math.round((innerWidth * innerHeight) / 9000) },
      () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        z: 0.3 + Math.random() * 0.7,
        p: Math.random() * 6.28,
        hue: Math.random() < 0.25,
      }),
    );
  };
  const draw = (t) => {
    cx.clearRect(0, 0, W, H);
    for (const s of stars) {
      s.y -= calm ? 0 : s.z * 0.12;
      if (s.y < 0) s.y = H;
      const a = (0.25 + 0.6 * Math.abs(Math.sin(t / 1800 + s.p))) * s.z;
      cx.fillStyle = s.hue
        ? `rgba(244,169,203,${a})`
        : `rgba(235,230,255,${a * 0.8})`;
      cx.beginPath();
      cx.arc(s.x + mx * s.z * 18, s.y + my * s.z * 18, s.z * 1.5, 0, 6.28);
      cx.fill();
    }
    if (!calm) requestAnimationFrame(draw);
  };
  addEventListener("resize", size);
  size();
  requestAnimationFrame(draw);
  const logo = $("#heroLogo");
  if (!calm)
    addEventListener("pointermove", (e) => {
      mx = e.clientX / innerWidth - 0.5;
      my = e.clientY / innerHeight - 0.5;
      if (logo) {
        logo.style.setProperty("--mx", mx * -16 + "px");
        logo.style.setProperty("--my", my * -16 + "px");
      }
    });
})();
