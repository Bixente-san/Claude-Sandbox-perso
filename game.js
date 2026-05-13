/* =========================================================================
   EUROPA CONQUEST V2 — carte géographique, villes, armée composite
   Dépend de data/europe.js (EUROPE_PATHS, EUROPE_VIEWBOX) et data/world.js (CITIES, ADJ)
   ========================================================================= */
'use strict';

// ==========================================================================
// CONFIG
// ==========================================================================
const UNIT_TYPES = {
  inf:  { name: 'Infanterie', icon: '👥', atk: 2, def: 4, cost: 10 },
  tank: { name: 'Blindés',    icon: '⚙️', atk: 5, def: 2, cost: 25 },
  art:  { name: 'Artillerie', icon: '💥', atk: 6, def: 1, cost: 30 },
  air:  { name: 'Aviation',   icon: '✈️', atk: 4, def: 2, cost: 40 },
};
const UNIT_ORDER = ['inf', 'tank', 'art', 'air'];

const COUNTRIES = {
  fr:      { name: 'France',     color: '#2b6cb0', short: 'FR' },
  de:      { name: 'Allemagne',  color: '#4a5468', short: 'DE' },
  uk:      { name: 'R-U',        color: '#c53030', short: 'UK' },
  it:      { name: 'Italie',     color: '#2f855a', short: 'IT' },
  sp:      { name: 'Espagne',    color: '#d69e2e', short: 'ES' },
  ru:      { name: 'URSS',       color: '#822727', short: 'RU' },
  tu:      { name: 'Turquie',    color: '#6b46c1', short: 'TR' },
  // Neutres (chacun sa teinte pour la lisibilité de la carte)
  ir: { name: 'Irlande',     color: '#3f7a4e' },
  pt: { name: 'Portugal',    color: '#b85c00' },
  ch: { name: 'Suisse',      color: '#a04040' },
  at: { name: 'Autriche',    color: '#a0a040' },
  nl: { name: 'Pays-Bas',    color: '#dd6b20' },
  be: { name: 'Belgique',    color: '#9c4221' },
  lu: { name: 'Luxembourg',  color: '#7a6a30' },
  dk: { name: 'Danemark',    color: '#b03030' },
  no: { name: 'Norvège',     color: '#3a5070' },
  sw: { name: 'Suède',       color: '#2c5282' },
  fi: { name: 'Finlande',    color: '#4a6080' },
  is: { name: 'Islande',     color: '#5a7a8a' },
  pl: { name: 'Pologne',     color: '#a04040' },
  cz: { name: 'Tchéquie',    color: '#806030' },
  sk: { name: 'Slovaquie',   color: '#605040' },
  hu: { name: 'Hongrie',     color: '#a0584a' },
  hr: { name: 'Croatie',     color: '#a05050' },
  si: { name: 'Slovénie',    color: '#808040' },
  rs: { name: 'Serbie',      color: '#7a4a2a' },
  ba: { name: 'Bosnie',      color: '#6a5a4a' },
  me: { name: 'Monténégro',  color: '#5a4a4a' },
  mk: { name: 'Macédoine',   color: '#806840' },
  al: { name: 'Albanie',     color: '#604030' },
  bu: { name: 'Bulgarie',    color: '#8a5a30' },
  ro: { name: 'Roumanie',    color: '#9a6a3a' },
  gr: { name: 'Grèce',       color: '#3070a0' },
  ee: { name: 'Estonie',     color: '#4a6070' },
  lv: { name: 'Lettonie',    color: '#506070' },
  lt: { name: 'Lituanie',    color: '#5a6070' },
  md: { name: 'Moldavie',    color: '#806a4a' },
  // Owner spécial
  neutral: { name: 'Neutre', color: '#5a6478' },
};

const PLAYABLE = ['fr', 'de', 'uk', 'it', 'sp', 'ru', 'tu'];

// Maps
const CITY_BY_ID = {};
CITIES.forEach(c => CITY_BY_ID[c.id] = c);

const CITIES_BY_COUNTRY = {};
CITIES.forEach(c => {
  if (!CITIES_BY_COUNTRY[c.country]) CITIES_BY_COUNTRY[c.country] = [];
  CITIES_BY_COUNTRY[c.country].push(c);
});

// ==========================================================================
// ÉTAT
// ==========================================================================
const state = {
  turn: 1,
  phase: 'choose',            // 'choose' | 'play' | 'animating' | 'over'
  humanCountry: null,
  cities: {},                 // { id: { owner, garrison: {inf,tank,art,air}, hasActed, recruited } }
  gold: {},
  alive: {},
  selectedId: null,
};

function initState() {
  state.turn = 1;
  state.phase = 'play';
  state.selectedId = null;
  state.cities = {};
  for (const c of CITIES) {
    state.cities[c.id] = {
      owner: c.country,
      garrison: {
        inf:  c.init.inf  || 0,
        tank: c.init.tank || 0,
        art:  c.init.art  || 0,
        air:  c.init.air  || 0,
      },
      hasActed: false,
      recruited: false,
    };
  }
  state.gold = {};
  PLAYABLE.forEach(c => state.gold[c] = 60);
  state.alive = {};
  PLAYABLE.forEach(c => state.alive[c] = true);
}

// ==========================================================================
// HELPERS
// ==========================================================================
function ownedCities(country) {
  return CITIES.filter(c => state.cities[c.id].owner === country);
}
function capitalCityOf(country) {
  return CITIES.find(c => c.capital && c.country === country);
}
function isCapitalHeld(country) {
  const cap = capitalCityOf(country);
  return cap && state.cities[cap.id].owner === country;
}
function totalUnits(g) {
  return (g.inf||0) + (g.tank||0) + (g.art||0) + (g.air||0);
}
function copyStack(g) {
  return { inf: g.inf||0, tank: g.tank||0, art: g.art||0, air: g.air||0 };
}
function calcAttack(g) {
  return (g.inf||0)*UNIT_TYPES.inf.atk
       + (g.tank||0)*UNIT_TYPES.tank.atk
       + (g.art||0)*UNIT_TYPES.art.atk
       + (g.air||0)*UNIT_TYPES.air.atk;
}
function calcDefense(g, isCapital) {
  let d = (g.inf||0)*UNIT_TYPES.inf.def
        + (g.tank||0)*UNIT_TYPES.tank.def
        + (g.art||0)*UNIT_TYPES.art.def
        + (g.air||0)*UNIT_TYPES.air.def;
  d *= 1.15;                       // bonus terrain défense
  if (isCapital) d *= 1.3;         // capitale fortifiée
  return d;
}
function calcIncome(country) {
  let inc = 5;
  for (const c of CITIES) {
    if (state.cities[c.id].owner === country) {
      inc += c.capital ? 12 : 5;
    }
  }
  return inc;
}
function rng(min, max) { return Math.random() * (max - min) + min; }

// Owner d'un PAYS (par majorité des villes possédées sur son territoire historique)
function countryDominator(countryId) {
  const homeCities = CITIES_BY_COUNTRY[countryId] || [];
  if (homeCities.length === 0) return null;
  const counts = {};
  for (const c of homeCities) {
    const o = state.cities[c.id].owner;
    counts[o] = (counts[o] || 0) + 1;
  }
  let best = null, bestN = -1;
  for (const [o, n] of Object.entries(counts)) {
    if (n > bestN) { bestN = n; best = o; }
  }
  return best;
}

// ==========================================================================
// COMBAT
// ==========================================================================
function applyDamage(stack, totalLost) {
  // Pertes d'abord sur l'infanterie, puis artillerie, blindés, aviation en dernier.
  let remaining = totalLost;
  for (const t of ['inf', 'art', 'tank', 'air']) {
    if (remaining <= 0) break;
    const cur = stack[t] || 0;
    const lost = Math.min(cur, remaining);
    stack[t] = cur - lost;
    remaining -= lost;
  }
}

function resolveCombat(attackerStack, defenderStack, defenderIsCapital) {
  const aPower = calcAttack(attackerStack) * rng(0.85, 1.15);
  const dPower = calcDefense(defenderStack, defenderIsCapital) * rng(0.9, 1.15);
  const attackerWins = aPower > dPower;
  const aUnits = totalUnits(attackerStack);
  const dUnits = totalUnits(defenderStack);

  const aBefore = copyStack(attackerStack);
  const dBefore = copyStack(defenderStack);

  let aLoss, dLoss;
  if (attackerWins) {
    dLoss = dUnits;
    aLoss = Math.min(aUnits - 1, Math.max(1, Math.round(dUnits * rng(0.4, 0.7))));
  } else {
    aLoss = Math.min(aUnits, Math.max(1, Math.round(aUnits * rng(0.55, 0.8))));
    dLoss = Math.min(dUnits - 1, Math.max(0, Math.round(aUnits * rng(0.15, 0.4))));
  }
  applyDamage(attackerStack, aLoss);
  applyDamage(defenderStack, dLoss);

  const attackerLosses = {};
  const defenderLosses = {};
  for (const t of UNIT_ORDER) {
    attackerLosses[t] = (aBefore[t]||0) - (attackerStack[t]||0);
    defenderLosses[t] = (dBefore[t]||0) - (defenderStack[t]||0);
  }
  return { attackerWins, attackerLosses, defenderLosses, aPower, dPower };
}

// ==========================================================================
// ACTIONS
// ==========================================================================
function recruit(cityId, unitType, ownerId) {
  const s = state.cities[cityId];
  if (!s || s.owner !== ownerId) return false;
  if (s.recruited) return false;
  const ut = UNIT_TYPES[unitType];
  if (!ut) return false;
  if (state.gold[ownerId] < ut.cost) return false;
  s.garrison[unitType] = (s.garrison[unitType] || 0) + 1;
  state.gold[ownerId] -= ut.cost;
  s.recruited = true;
  return true;
}

function moveOrAttack(fromId, toId, send) {
  const from = state.cities[fromId];
  const to = state.cities[toId];
  if (!from || !to) return { error: 'invalid' };
  if (!ADJ[fromId] || !ADJ[fromId].includes(toId)) return { error: 'not-adjacent' };
  if (from.hasActed) return { error: 'already-acted' };
  let sent = 0;
  for (const t of UNIT_ORDER) {
    const n = send[t] || 0;
    if (n < 0 || n > (from.garrison[t] || 0)) return { error: 'bad-count' };
    sent += n;
  }
  if (sent === 0) return { error: 'empty-send' };

  // Mouvement vers une ville amie
  if (to.owner === from.owner) {
    for (const t of UNIT_ORDER) {
      from.garrison[t] = (from.garrison[t]||0) - (send[t]||0);
      to.garrison[t]   = (to.garrison[t]||0)   + (send[t]||0);
    }
    from.hasActed = true;
    return { type: 'move' };
  }

  // Attaque
  const toCity = CITY_BY_ID[toId];
  const attackerStack = copyStack(send);
  const r = resolveCombat(attackerStack, to.garrison, !!toCity.capital);
  for (const t of UNIT_ORDER) {
    from.garrison[t] = (from.garrison[t]||0) - (send[t]||0);
  }
  from.hasActed = true;
  let conquered = false;
  if (r.attackerWins) {
    to.garrison = attackerStack;
    to.owner = from.owner;
    to.hasActed = true;
    to.recruited = true;
    conquered = true;
  } else {
    // Survivants attaquants se replient
    for (const t of UNIT_ORDER) {
      from.garrison[t] = (from.garrison[t]||0) + (attackerStack[t]||0);
    }
  }
  return { type: 'attack', conquered, result: r };
}

// ==========================================================================
// IA
// ==========================================================================
function aiTurn(country) {
  if (!state.alive[country]) return;
  state.gold[country] += calcIncome(country);

  const owned = ownedCities(country);
  if (owned.length === 0) return;
  const cap = capitalCityOf(country);

  // Phase recrutement : essayer de produire dans chaque ville frontalière
  // Frontière = ville voisine d'un ennemi
  const frontier = owned.filter(c =>
    ADJ[c.id] && ADJ[c.id].some(n => state.cities[n].owner !== country));
  const sortedTargets = [...frontier].sort((a, b) =>
    totalUnits(state.cities[a.id].garrison) - totalUnits(state.cities[b.id].garrison));

  // Profil de production selon les besoins
  function pickUnitType(cityState) {
    const g = cityState.garrison;
    const has = totalUnits(g);
    if (has < 3) return 'inf';                               // base
    if ((g.tank||0) < 1 && state.gold[country] >= 25) return 'tank';
    if ((g.art||0)  < 1 && state.gold[country] >= 30) return 'art';
    if ((g.air||0)  < 1 && state.gold[country] >= 40 && Math.random() < 0.3) return 'air';
    return 'inf';
  }

  let safety = 200;
  // recruter sur frontière, puis capitale, jusqu'à épuisement
  outer: while (state.gold[country] >= UNIT_TYPES.inf.cost && safety-- > 0) {
    for (const city of sortedTargets) {
      const s = state.cities[city.id];
      if (s.recruited) continue;
      const t = pickUnitType(s);
      if (state.gold[country] < UNIT_TYPES[t].cost) continue;
      if (recruit(city.id, t, country)) continue outer;
    }
    // pas pu sur frontière, essayer capitale puis autres
    const fallback = [cap, ...owned.filter(c => c !== cap)].filter(Boolean);
    for (const city of fallback) {
      if (!city) continue;
      const s = state.cities[city.id];
      if (s.recruited) continue;
      const t = pickUnitType(s);
      if (state.gold[country] < UNIT_TYPES[t].cost) continue;
      if (recruit(city.id, t, country)) continue outer;
    }
    break;
  }

  // Phase action : pour chaque ville, attaque opportune sinon consolidation
  const order = [...owned].sort(() => Math.random() - 0.5);
  for (const city of order) {
    const s = state.cities[city.id];
    if (s.hasActed) continue;
    if (totalUnits(s.garrison) < 2) continue;

    const neighbors = (ADJ[city.id] || []).map(id => ({
      id, st: state.cities[id], data: CITY_BY_ID[id]
    }));
    const enemies = neighbors.filter(n => n.st.owner !== country);

    // Score chaque cible
    let target = null, best = -Infinity;
    for (const e of enemies) {
      const aPow = calcAttack(s.garrison);
      const dPow = calcDefense(e.st.garrison, !!e.data.capital);
      let score = aPow - dPow * 1.25;
      if (e.st.owner === 'neutral' || !PLAYABLE.includes(e.st.owner)) score += 3;
      if (e.data.capital && e.st.owner !== country && PLAYABLE.includes(e.st.owner)) score += 8;
      if (score > best) { best = score; target = e; }
    }

    if (target && best > 3) {
      // Envoyer une part substantielle mais garder une garnison réserve
      const total = totalUnits(s.garrison);
      const keepFraction = total <= 3 ? 0 : 0.25;   // garde 25% pour défendre
      const send = copyStack(s.garrison);
      // Retire du `send` une fraction (priorité infanterie pour la défense)
      let toKeep = Math.floor(total * keepFraction);
      for (const t of ['inf', 'art', 'tank', 'air']) {
        if (toKeep <= 0) break;
        const take = Math.min(send[t], toKeep);
        send[t] -= take;
        toKeep -= take;
      }
      if (totalUnits(send) === 0) continue;
      moveOrAttack(city.id, target.id, send);
    }
  }
}

// ==========================================================================
// TOUR DE JEU
// ==========================================================================
function deathCheck() {
  PLAYABLE.forEach(c => {
    if (state.alive[c] && !isCapitalHeld(c)) {
      state.alive[c] = false;
      // Les villes possédées par ce pays perdu deviennent neutres (révolte)
      for (const city of CITIES) {
        if (state.cities[city.id].owner === c) {
          state.cities[city.id].owner = 'neutral';
          // Garde une garnison réduite
          const g = state.cities[city.id].garrison;
          for (const t of UNIT_ORDER) g[t] = Math.floor((g[t] || 0) / 2);
          if (totalUnits(g) === 0) g.inf = 1;
        }
      }
    }
  });
}

function endHumanTurn() {
  if (state.phase !== 'play') return;
  state.phase = 'animating';
  state.selectedId = null;
  ui.clearHighlights();
  ui.toast('Tour des adversaires...', 'info', 900);

  setTimeout(() => {
    deathCheck();

    const aiCountries = PLAYABLE.filter(c => c !== state.humanCountry && state.alive[c]);
    aiCountries.forEach(c => {
      if (!state.alive[c]) return;
      // reset hasActed/recruited pour chaque IA
      for (const id in state.cities) {
        state.cities[id].hasActed = false;
        state.cities[id].recruited = false;
      }
      aiTurn(c);
      deathCheck();
    });

    // Reset pour le tour suivant du joueur
    for (const id in state.cities) {
      state.cities[id].hasActed = false;
      state.cities[id].recruited = false;
    }
    state.turn += 1;
    if (state.alive[state.humanCountry]) {
      state.gold[state.humanCountry] += calcIncome(state.humanCountry);
    }
    const winner = checkWin();
    if (winner) {
      state.phase = 'over';
      ui.refresh();
      ui.showGameOver(winner);
    } else {
      state.phase = 'play';
      ui.refresh();
    }
  }, 350);
}

function checkWin() {
  if (!state.alive[state.humanCountry]) return 'loss';
  const enemiesAlive = PLAYABLE.filter(c => c !== state.humanCountry && state.alive[c]);
  if (enemiesAlive.length === 0) return 'win';
  // Domination : 60% des villes
  const totalCities = CITIES.length;
  const mine = ownedCities(state.humanCountry).length;
  if (mine >= Math.ceil(totalCities * 0.6)) return 'win';
  return null;
}

// ==========================================================================
// CAMÉRA (pan + zoom)
// ==========================================================================
const camera = {
  scale: 1,
  tx: 0,
  ty: 0,
  minScale: 0.8,
  maxScale: 5,

  init() {
    const container = document.getElementById('map-container');
    const cameraLayer = document.getElementById('layer-camera');

    let touchStart = null;       // { x, y, tx, ty }
    let pinchStart = null;       // { dist, scale, midX, midY }
    let didMove = false;

    function distance(t1, t2) {
      const dx = t1.clientX - t2.clientX, dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx*dx + dy*dy);
    }

    container.addEventListener('touchstart', (e) => {
      didMove = false;
      if (e.touches.length === 1) {
        const t = e.touches[0];
        touchStart = { x: t.clientX, y: t.clientY, tx: camera.tx, ty: camera.ty };
      } else if (e.touches.length === 2) {
        const t1 = e.touches[0], t2 = e.touches[1];
        const rect = container.getBoundingClientRect();
        pinchStart = {
          dist: distance(t1, t2),
          scale: camera.scale,
          tx: camera.tx,
          ty: camera.ty,
          midX: (t1.clientX + t2.clientX) / 2 - rect.left,
          midY: (t1.clientY + t2.clientY) / 2 - rect.top,
          rect,
        };
        touchStart = null;
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && touchStart) {
        const t = e.touches[0];
        const dx = t.clientX - touchStart.x;
        const dy = t.clientY - touchStart.y;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) didMove = true;
        camera.tx = touchStart.tx + dx;
        camera.ty = touchStart.ty + dy;
        camera.apply();
        e.preventDefault();
      } else if (e.touches.length === 2 && pinchStart) {
        const t1 = e.touches[0], t2 = e.touches[1];
        const newDist = distance(t1, t2);
        const ratio = newDist / pinchStart.dist;
        const newScale = Math.max(camera.minScale,
                          Math.min(camera.maxScale, pinchStart.scale * ratio));
        // Garder le point milieu stable
        const k = newScale / pinchStart.scale;
        camera.scale = newScale;
        camera.tx = pinchStart.midX - k * (pinchStart.midX - pinchStart.tx);
        camera.ty = pinchStart.midY - k * (pinchStart.midY - pinchStart.ty);
        camera.apply();
        didMove = true;
        e.preventDefault();
      }
    }, { passive: false });

    container.addEventListener('touchend', (e) => {
      if (e.touches.length === 0) { touchStart = null; pinchStart = null; }
      else if (e.touches.length === 1) {
        // sortie de pinch
        const t = e.touches[0];
        touchStart = { x: t.clientX, y: t.clientY, tx: camera.tx, ty: camera.ty };
        pinchStart = null;
      }
    }, { passive: true });

    container.addEventListener('click', (e) => {
      // intercepter le clic s'il y a eu un drag/zoom
      if (didMove) { e.stopPropagation(); didMove = false; }
    }, true);

    // Boutons
    document.getElementById('btn-zoom-in').addEventListener('click', () => camera.zoomBy(1.4));
    document.getElementById('btn-zoom-out').addEventListener('click', () => camera.zoomBy(1/1.4));
    document.getElementById('btn-zoom-reset').addEventListener('click', () => camera.reset());
  },

  zoomBy(factor) {
    const container = document.getElementById('map-container');
    const rect = container.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const newScale = Math.max(camera.minScale, Math.min(camera.maxScale, camera.scale * factor));
    const k = newScale / camera.scale;
    camera.tx = cx - k * (cx - camera.tx);
    camera.ty = cy - k * (cy - camera.ty);
    camera.scale = newScale;
    camera.apply();
  },

  reset() {
    camera.scale = 1; camera.tx = 0; camera.ty = 0; camera.apply();
  },

  apply() {
    const cl = document.getElementById('layer-camera');
    cl.setAttribute('transform', `translate(${camera.tx} ${camera.ty}) scale(${camera.scale})`);
  },
};

// ==========================================================================
// UI / RENDU
// ==========================================================================
const ui = {
  init() {
    this.drawCountries();
    this.drawConnections();
    this.drawCities();

    document.getElementById('btn-recruit').addEventListener('click', () => this.onRecruit());
    document.getElementById('btn-end-turn').addEventListener('click', () => this.onEndTurn());

    // Tap on background to deselect
    const svg = document.getElementById('map');
    svg.addEventListener('click', (e) => {
      if (e.target.tagName === 'svg' || e.target.tagName === 'rect') {
        state.selectedId = null;
        this.refresh();
      }
    });
  },

  drawCountries() {
    const layer = document.getElementById('layer-countries');
    for (const [cid, path] of Object.entries(EUROPE_PATHS)) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      el.setAttribute('d', path);
      el.setAttribute('class', 'country');
      el.setAttribute('data-country', cid);
      el.setAttribute('fill', (COUNTRIES[cid] || COUNTRIES.neutral).color);
      layer.appendChild(el);
    }
  },

  drawConnections() {
    const layer = document.getElementById('layer-connections');
    const drawn = new Set();
    for (const a in ADJ) {
      for (const b of ADJ[a]) {
        const key = a < b ? a + '-' + b : b + '-' + a;
        if (drawn.has(key)) continue;
        drawn.add(key);
        const ca = CITY_BY_ID[a], cb = CITY_BY_ID[b];
        if (!ca || !cb) continue;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', ca.x); line.setAttribute('y1', ca.y);
        line.setAttribute('x2', cb.x); line.setAttribute('y2', cb.y);
        // détecter si c'est une route maritime (pays différents et distance significative)
        const isSea = (ca.country !== cb.country)
          && Math.hypot(ca.x - cb.x, ca.y - cb.y) > 50;
        line.setAttribute('class', 'connection' + (isSea ? ' sea' : ''));
        layer.appendChild(line);
      }
    }
  },

  drawCities() {
    const layer = document.getElementById('layer-cities');
    const labelLayer = document.getElementById('layer-labels');
    for (const c of CITIES) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'city' + (c.capital ? ' capital' : ''));
      g.setAttribute('data-id', c.id);
      g.setAttribute('transform', `translate(${c.x} ${c.y})`);

      const radius = c.capital ? 18 : 14;
      const circ = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circ.setAttribute('r', radius);
      circ.setAttribute('class', 'city-fill');
      circ.setAttribute('data-circle', c.id);
      g.appendChild(circ);

      if (c.capital) {
        // étoile décorative
        const star = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const pts = [];
        const sr = 6;
        for (let i = 0; i < 10; i++) {
          const r = (i % 2 === 0) ? sr : sr/2.3;
          const ang = (Math.PI/5) * i - Math.PI/2;
          pts.push(`${(Math.cos(ang)*r).toFixed(1)},${(Math.sin(ang)*r - radius - 8).toFixed(1)}`);
        }
        star.setAttribute('points', pts.join(' '));
        star.setAttribute('class', 'capital-star');
        g.appendChild(star);
      }

      // total armies text
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('class', 'city-army-count');
      txt.setAttribute('data-count', c.id);
      txt.setAttribute('dy', '0.35em');
      txt.textContent = '0';
      g.appendChild(txt);

      g.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onCityClick(c.id);
      });
      layer.appendChild(g);

      // label
      const labelG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      labelG.setAttribute('transform', `translate(${c.x} ${c.y})`);
      const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      lbl.setAttribute('class', 'city-label' + (c.capital ? ' capital' : ''));
      lbl.setAttribute('y', -(radius + 10));
      lbl.textContent = c.name;
      labelG.appendChild(lbl);
      labelLayer.appendChild(labelG);
    }
  },

  refresh() {
    // top bar
    document.getElementById('ui-turn').textContent = 'T' + state.turn;
    const country = state.humanCountry;
    document.getElementById('ui-country').textContent = country ? COUNTRIES[country].name : '-';
    document.getElementById('ui-gold').textContent = country ? state.gold[country] : '0';
    document.getElementById('ui-cities').textContent =
      country ? ownedCities(country).length + '/' + CITIES.length : '0';

    // Mettre à jour la couleur des pays selon majorité
    for (const cid of Object.keys(EUROPE_PATHS)) {
      const path = document.querySelector(`.country[data-country="${cid}"]`);
      if (!path) continue;
      const dom = countryDominator(cid);
      const baseColor = dom ? (COUNTRIES[dom] || COUNTRIES.neutral).color : COUNTRIES[cid].color;
      path.setAttribute('fill', baseColor);
    }

    // Mettre à jour les villes
    for (const c of CITIES) {
      const s = state.cities[c.id];
      const circ = document.querySelector(`[data-circle="${c.id}"]`);
      const txt = document.querySelector(`[data-count="${c.id}"]`);
      if (circ) circ.setAttribute('fill', (COUNTRIES[s.owner] || COUNTRIES.neutral).color);
      if (txt) {
        const tot = totalUnits(s.garrison);
        txt.textContent = tot;
        txt.style.display = tot > 0 ? '' : 'none';
      }
    }

    // Surbrillances
    this.clearHighlights();
    if (state.selectedId) {
      const g = document.querySelector(`.city[data-id="${state.selectedId}"]`);
      if (g) g.classList.add('selected');
      const sel = state.cities[state.selectedId];
      const canAct = sel.owner === state.humanCountry && !sel.hasActed
                     && totalUnits(sel.garrison) > 0;
      if (canAct) {
        for (const id of ADJ[state.selectedId] || []) {
          const ag = document.querySelector(`.city[data-id="${id}"]`);
          if (!ag) continue;
          const adj = state.cities[id];
          if (adj.owner === state.humanCountry) ag.classList.add('reachable');
          else ag.classList.add('attackable');
        }
      }
    }

    this.updateInfoPanel();
  },

  clearHighlights() {
    document.querySelectorAll('.city').forEach(g =>
      g.classList.remove('selected', 'reachable', 'attackable'));
  },

  updateInfoPanel() {
    const nameEl = document.getElementById('ui-selected-name');
    const flagEl = document.getElementById('ui-selected-flag');
    const hintEl = document.getElementById('ui-hint');
    const recruitBtn = document.getElementById('btn-recruit');

    // Garrison icons
    for (const t of UNIT_ORDER) {
      document.getElementById('g-' + t).textContent = '0';
    }

    if (!state.selectedId) {
      nameEl.textContent = state.humanCountry ? 'Touchez une ville' : 'Choisissez votre pays';
      flagEl.innerHTML = '';
      hintEl.textContent = state.humanCountry
        ? `Revenu prévu: +${calcIncome(state.humanCountry)}💰 — Tour ${state.turn}`
        : '';
      recruitBtn.disabled = true;
      return;
    }

    const c = CITY_BY_ID[state.selectedId];
    const s = state.cities[state.selectedId];
    const co = COUNTRIES[s.owner] || COUNTRIES.neutral;
    nameEl.innerHTML = c.name + (c.capital ? ' ★' : '');
    flagEl.innerHTML = `<span class="owner-tag" style="background:${co.color}">${co.name}</span>`;

    for (const t of UNIT_ORDER) {
      document.getElementById('g-' + t).textContent = s.garrison[t] || 0;
    }

    let hint = '';
    if (s.owner !== state.humanCountry) {
      hint = '⚔️ Cible ennemie';
    } else {
      const parts = [];
      if (s.recruited) parts.push('produit ce tour');
      if (s.hasActed) parts.push('a agi ce tour');
      else if (totalUnits(s.garrison) > 0) parts.push('touchez un voisin pour bouger/attaquer');
      hint = parts.join(' · ') || 'Aucune unité';
    }
    hintEl.textContent = hint;

    recruitBtn.disabled = !(s.owner === state.humanCountry && !s.recruited);
  },

  onCityClick(id) {
    if (state.phase !== 'play') return;
    const clicked = state.cities[id];

    if (!state.selectedId) {
      state.selectedId = id;
      this.refresh();
      return;
    }
    if (state.selectedId === id) {
      state.selectedId = null;
      this.refresh();
      return;
    }

    const sel = state.cities[state.selectedId];
    const isAdj = ADJ[state.selectedId] && ADJ[state.selectedId].includes(id);
    const canAct = sel.owner === state.humanCountry && !sel.hasActed
                   && totalUnits(sel.garrison) > 0;

    if (canAct && isAdj) {
      const friendly = clicked.owner === state.humanCountry;
      this.promptComposition(state.selectedId, id, friendly);
      return;
    }
    state.selectedId = id;
    this.refresh();
  },

  onRecruit() {
    if (!state.selectedId) return;
    const s = state.cities[state.selectedId];
    if (s.owner !== state.humanCountry || s.recruited) return;
    this.showRecruitModal(state.selectedId);
  },

  onEndTurn() {
    if (state.phase !== 'play') return;
    endHumanTurn();
  },

  // ----- Modales -----
  showModal(html) {
    const m = document.getElementById('modal');
    document.getElementById('modal-content').innerHTML = html;
    m.classList.remove('hidden');
  },
  hideModal() {
    document.getElementById('modal').classList.add('hidden');
  },

  showRecruitModal(cityId) {
    const c = CITY_BY_ID[cityId];
    const gold = state.gold[state.humanCountry];
    const cards = UNIT_ORDER.map(t => {
      const u = UNIT_TYPES[t];
      const dis = gold < u.cost;
      return `
        <div class="recruit-card${dis ? ' disabled' : ''}" data-type="${t}">
          <div class="ricon">${u.icon}</div>
          <div class="rname">${u.name}</div>
          <div class="rcost">${u.cost}💰</div>
          <div class="rstats">ATK ${u.atk} · DEF ${u.def}</div>
        </div>`;
    }).join('');
    this.showModal(`
      <h2>Recruter à ${c.name}</h2>
      <p style="font-size:12px">Or disponible: <strong>${gold}💰</strong> — 1 unité par ville par tour.</p>
      <div class="recruit-grid">${cards}</div>
      <div class="modal-actions">
        <button id="rec-close" style="background:#444">Fermer</button>
      </div>
    `);
    document.querySelectorAll('.recruit-card').forEach(card => {
      card.addEventListener('click', () => {
        const t = card.dataset.type;
        if (recruit(cityId, t, state.humanCountry)) {
          this.toast('+1 ' + UNIT_TYPES[t].name, 'success', 700);
          this.hideModal();
          this.refresh();
        }
      });
    });
    document.getElementById('rec-close').addEventListener('click', () => this.hideModal());
  },

  promptComposition(fromId, toId, friendly) {
    const from = state.cities[fromId];
    const to = state.cities[toId];
    const fromName = CITY_BY_ID[fromId].name;
    const toName = CITY_BY_ID[toId].name;
    const toOwner = COUNTRIES[to.owner] || COUNTRIES.neutral;

    const titleIcon = friendly ? '➜' : '⚔️';
    const action = friendly ? 'Déplacer' : 'Attaquer';

    const rows = UNIT_ORDER.map(t => {
      const max = from.garrison[t] || 0;
      const u = UNIT_TYPES[t];
      const disabled = max === 0;
      return `
        <div class="comp-row${disabled ? ' disabled' : ''}">
          <span class="icon">${u.icon}</span>
          <span class="label">${u.name}</span>
          <input type="range" data-type="${t}" min="0" max="${max}" value="${max}" ${disabled?'disabled':''}>
          <span class="count" data-out="${t}">${max}</span>
        </div>`;
    }).join('');

    let defenseInfo = '';
    if (!friendly) {
      const dPow = Math.round(calcDefense(to.garrison, !!CITY_BY_ID[toId].capital));
      defenseInfo = `<p style="font-size:12px">Défenseurs: ${COUNTRIES[to.owner]?.name || 'Neutre'} — puissance défensive ~<strong>${dPow}</strong>${CITY_BY_ID[toId].capital?' (capitale fortifiée)':''}</p>`;
    }

    this.showModal(`
      <h2>${titleIcon} ${action}</h2>
      <p><strong>${fromName}</strong> ➜ <strong>${toName}</strong></p>
      ${defenseInfo}
      <div class="composition-list">${rows}</div>
      <p id="comp-power" style="font-size:12px;color:#8090b0"></p>
      <div class="modal-actions">
        <button id="comp-cancel" style="background:#444">Annuler</button>
        <button id="comp-confirm" style="${friendly?'':'background:#c9433f'}">${friendly?'Déplacer':'Lancer l\'assaut'}</button>
      </div>
    `);

    const updatePower = () => {
      const send = this.readComposition();
      const aPow = Math.round(calcAttack(send));
      document.getElementById('comp-power').innerHTML =
        `Force envoyée: ${totalUnits(send)} unités · puissance offensive ~<strong>${aPow}</strong>`;
    };

    document.querySelectorAll('.comp-row input').forEach(input => {
      input.addEventListener('input', () => {
        document.querySelector(`[data-out="${input.dataset.type}"]`).textContent = input.value;
        updatePower();
      });
    });
    updatePower();

    document.getElementById('comp-cancel').addEventListener('click', () => this.hideModal());
    document.getElementById('comp-confirm').addEventListener('click', () => {
      const send = this.readComposition();
      if (totalUnits(send) === 0) {
        this.toast('Aucune unité sélectionnée', 'danger', 1000);
        return;
      }
      const r = moveOrAttack(fromId, toId, send);
      this.hideModal();
      if (r.error) {
        this.toast('Action impossible', 'danger', 1000);
      } else if (r.type === 'move') {
        this.toast('Unités déplacées', 'success', 800);
        state.selectedId = toId;
        this.refresh();
      } else if (r.type === 'attack') {
        this.showCombatResult(fromId, toId, send, r);
      }
    });
  },

  readComposition() {
    const send = { inf: 0, tank: 0, art: 0, air: 0 };
    document.querySelectorAll('.comp-row input').forEach(input => {
      send[input.dataset.type] = parseInt(input.value, 10) || 0;
    });
    return send;
  },

  showCombatResult(fromId, toId, sent, r) {
    const toName = CITY_BY_ID[toId].name;
    this.playFx(toId, r.conquered ? '#5cb85c' : '#d9534f');

    const aRows = UNIT_ORDER.map(t => {
      const lost = r.result.attackerLosses[t] || 0;
      const sent0 = sent[t] || 0;
      return `<div class="combat-unit"><div class="uic">${UNIT_TYPES[t].icon}</div>
        <div>${sent0}${lost?' <span class="loss">-'+lost+'</span>':''}</div></div>`;
    }).join('');
    const dRows = UNIT_ORDER.map(t => {
      const lost = r.result.defenderLosses[t] || 0;
      return `<div class="combat-unit"><div class="uic">${UNIT_TYPES[t].icon}</div>
        <div>${lost?'<span class="loss">-'+lost+'</span>':'·'}</div></div>`;
    }).join('');

    const outcome = r.conquered
      ? `<div class="combat-outcome win">🏆 ${toName} conquis !</div>`
      : `<div class="combat-outcome loss">❌ Assaut repoussé</div>`;

    this.showModal(`
      <h2>Bataille de ${toName}</h2>
      <div class="combat-result">
        <div class="combat-side">
          <h3>Vos forces (${Math.round(r.result.aPower)})</h3>
          <div class="combat-units">${aRows}</div>
        </div>
        <div class="combat-side">
          <h3>Défense (${Math.round(r.result.dPower)})</h3>
          <div class="combat-units">${dRows}</div>
        </div>
        ${outcome}
      </div>
      <div class="modal-actions">
        <button id="bt-ok">Continuer</button>
      </div>
    `);
    document.getElementById('bt-ok').addEventListener('click', () => {
      this.hideModal();
      state.selectedId = r.conquered ? toId : fromId;
      this.refresh();
    });
  },

  playFx(cityId, color) {
    const c = CITY_BY_ID[cityId];
    const layer = document.getElementById('layer-fx');
    const circ = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circ.setAttribute('cx', c.x); circ.setAttribute('cy', c.y);
    circ.setAttribute('r', 20);
    circ.setAttribute('fill', 'none');
    circ.setAttribute('stroke', color);
    circ.setAttribute('stroke-width', 3);
    circ.setAttribute('class', 'fx-flash');
    layer.appendChild(circ);
    setTimeout(() => circ.remove(), 800);
  },

  toast(msg, type, dur) {
    const el = document.getElementById('toast');
    if (this._toastTimer) clearTimeout(this._toastTimer);
    el.textContent = msg;
    el.className = 'toast ' + (type || 'info');
    this._toastTimer = setTimeout(() => el.classList.add('hidden'), dur || 1500);
  },

  showCountrySelect() {
    const cards = PLAYABLE.map(id => {
      const co = COUNTRIES[id];
      const cities = CITIES.filter(c => c.country === id);
      const totalArm = cities.reduce((s, c) => s + (c.init.inf||0)+(c.init.tank||0)+(c.init.art||0)+(c.init.air||0), 0);
      return `
        <div class="country-card" data-country="${id}">
          <div class="color-chip" style="background:${co.color}"></div>
          <div>${co.name}</div>
          <div class="difficulty">${cities.length} villes • ${totalArm} unités</div>
        </div>`;
    }).join('');
    this.showModal(`
      <h1>⚔️ Europa Conquest</h1>
      <p class="subtitle">Choisissez votre puissance · 1939</p>
      <div class="country-grid">${cards}</div>
      <p style="font-size:11px;color:#8090b0;text-align:center;line-height:1.45">
        Conquérez les villes ennemies. Perdez votre capitale = défaite. <br>
        Domination = 60% des villes d'Europe.
      </p>
    `);
    document.querySelectorAll('.country-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.country;
        state.humanCountry = id;
        state.phase = 'play';
        this.hideModal();
        this.toast(`Vous dirigez ${COUNTRIES[id].name}`, 'success', 1400);
        this.refresh();
      });
    });
  },

  showGameOver(result) {
    const scores = PLAYABLE.map(c => ({
      id: c, name: COUNTRIES[c].name, color: COUNTRIES[c].color,
      cities: ownedCities(c).length, alive: state.alive[c],
    })).sort((a, b) => b.cities - a.cities);
    const rows = scores.map(s => `
      <div class="score-row">
        <span class="score-chip" style="background:${s.color}"></span>
        <span class="score-name">${s.name}${s.id === state.humanCountry ? ' (vous)' : ''}</span>
        <span class="score-detail">${s.cities} villes ${s.alive ? '' : '☠️'}</span>
      </div>`).join('');
    const title = result === 'win' ? '🏆 VICTOIRE' : '☠️ DÉFAITE';
    const sub = result === 'win'
      ? `L'Europe est sous votre contrôle au tour ${state.turn}`
      : `Votre capitale est tombée au tour ${state.turn}`;
    this.showModal(`
      <h1>${title}</h1>
      <p class="subtitle">${sub}</p>
      <div class="score-list">${rows}</div>
      <div class="modal-actions">
        <button id="go-restart">Nouvelle partie</button>
      </div>
    `);
    document.getElementById('go-restart').addEventListener('click', () => {
      this.hideModal();
      initState();
      state.phase = 'choose';
      camera.reset();
      this.showCountrySelect();
      this.refresh();
    });
  },
};

// ==========================================================================
// BOOT
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initState();
  ui.init();
  camera.init();
  ui.refresh();
  state.phase = 'choose';
  ui.showCountrySelect();
});

document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault());
