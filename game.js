/* =========================================================================
   EUROPA CONQUEST - jeu de stratégie mobile au tour par tour
   ========================================================================= */

'use strict';

// =====================================================================
// DONNÉES : pays jouables, territoires, adjacences
// =====================================================================

const COUNTRIES = {
  fr:      { name: 'France',    color: '#3b82f6', shortName: 'FR' },
  de:      { name: 'Allemagne', color: '#6b7280', shortName: 'DE' },
  uk:      { name: 'R-U',       color: '#dc2626', shortName: 'UK' },
  it:      { name: 'Italie',    color: '#16a34a', shortName: 'IT' },
  sp:      { name: 'Espagne',   color: '#eab308', shortName: 'ES' },
  ru:      { name: 'URSS',      color: '#7c2d12', shortName: 'RU' },
  tu:      { name: 'Turquie',   color: '#7e22ce', shortName: 'TR' },
  neutral: { name: 'Neutre',    color: '#525c6e', shortName: 'N'  }
};

const PLAYABLE = ['fr', 'de', 'uk', 'it', 'sp', 'ru', 'tu'];

// Territoires : (id, name, x, y, initOwner, initArmies, capital?)
// Disposition stylisée portrait dans viewBox 600x850
const TERRITORIES = [
  // Nord
  { id: 'is', name: 'Islande',     x:  90, y:  80, owner: 'neutral', armies: 1 },
  { id: 'no', name: 'Norvège',     x: 280, y:  80, owner: 'neutral', armies: 2 },
  { id: 'fi', name: 'Finlande',    x: 460, y:  80, owner: 'ru',      armies: 2 },
  { id: 'sw', name: 'Suède',       x: 370, y: 170, owner: 'neutral', armies: 2 },
  // Mer du Nord
  { id: 'uk', name: 'R-U',         x: 170, y: 250, owner: 'uk',      armies: 6, capital: true },
  { id: 'ir', name: 'Irlande',     x:  75, y: 290, owner: 'uk',      armies: 1 },
  { id: 'dk', name: 'Danemark',    x: 280, y: 230, owner: 'neutral', armies: 1 },
  { id: 'ba', name: 'Baltes',      x: 460, y: 200, owner: 'ru',      armies: 2 },
  { id: 'ru', name: 'Russie',      x: 540, y: 290, owner: 'ru',      armies: 7, capital: true },
  // Centre-nord
  { id: 'nl', name: 'Pays-Bas',    x: 210, y: 320, owner: 'neutral', armies: 1 },
  { id: 'de', name: 'Allemagne',   x: 320, y: 340, owner: 'de',      armies: 5, capital: true },
  { id: 'pl', name: 'Pologne',     x: 420, y: 320, owner: 'de',      armies: 3 },
  { id: 'br', name: 'Biélorussie', x: 510, y: 380, owner: 'ru',      armies: 2 },
  { id: 'be', name: 'Belgique',    x: 200, y: 400, owner: 'fr',      armies: 2 },
  { id: 'cz', name: 'Tchéquie',    x: 360, y: 400, owner: 'de',      armies: 2 },
  // Centre
  { id: 'fr', name: 'France',      x: 180, y: 480, owner: 'fr',      armies: 5, capital: true },
  { id: 'ch', name: 'Suisse',      x: 270, y: 480, owner: 'neutral', armies: 2 },
  { id: 'at', name: 'Autriche',    x: 360, y: 480, owner: 'de',      armies: 2 },
  { id: 'hu', name: 'Hongrie',     x: 450, y: 470, owner: 'neutral', armies: 2 },
  { id: 'ua', name: 'Ukraine',     x: 540, y: 460, owner: 'ru',      armies: 3 },
  // Sud
  { id: 'sp', name: 'Espagne',     x: 130, y: 580, owner: 'sp',      armies: 4, capital: true },
  { id: 'it', name: 'Italie',      x: 280, y: 570, owner: 'it',      armies: 5, capital: true },
  { id: 'yu', name: 'Yougoslavie', x: 370, y: 560, owner: 'neutral', armies: 2 },
  { id: 'ro', name: 'Roumanie',    x: 470, y: 550, owner: 'neutral', armies: 2 },
  // Extrême sud
  { id: 'pt', name: 'Portugal',    x:  60, y: 630, owner: 'sp',      armies: 1 },
  { id: 'al', name: 'Albanie',     x: 360, y: 640, owner: 'it',      armies: 1 },
  { id: 'bu', name: 'Bulgarie',    x: 470, y: 640, owner: 'tu',      armies: 2 },
  { id: 'gr', name: 'Grèce',       x: 400, y: 740, owner: 'it',      armies: 2 },
  { id: 'tu', name: 'Turquie',     x: 510, y: 750, owner: 'tu',      armies: 4, capital: true },
];

// Connexions terrestres / maritimes courtes
const ADJACENCIES = [
  ['is','uk'], ['is','no'],
  ['no','sw'], ['no','fi'], ['no','dk'], ['no','uk'],
  ['sw','fi'], ['sw','dk'], ['sw','ba'],
  ['fi','ru'], ['fi','ba'],
  ['dk','de'], ['dk','nl'],
  ['uk','ir'], ['uk','nl'], ['uk','fr'],
  ['nl','de'], ['nl','be'],
  ['be','fr'], ['be','de'],
  ['fr','sp'], ['fr','ch'], ['fr','de'], ['fr','it'],
  ['sp','pt'], ['sp','it'],
  ['de','ch'], ['de','at'], ['de','cz'], ['de','pl'],
  ['ch','at'], ['ch','it'],
  ['at','cz'], ['at','hu'], ['at','it'], ['at','yu'],
  ['it','yu'], ['it','al'], ['it','gr'],
  ['cz','pl'], ['cz','hu'],
  ['pl','ba'], ['pl','br'], ['pl','hu'], ['pl','ua'],
  ['hu','yu'], ['hu','ro'],
  ['yu','ro'], ['yu','bu'], ['yu','al'],
  ['ro','bu'], ['ro','ua'],
  ['bu','gr'], ['bu','tu'],
  ['al','gr'],
  ['gr','tu'],
  ['ba','br'], ['ba','ru'],
  ['br','ru'], ['br','ua'],
  ['ua','ru'],
];

const ADJ = {};
TERRITORIES.forEach(t => ADJ[t.id] = []);
ADJACENCIES.forEach(([a, b]) => {
  if (!ADJ[a].includes(b)) ADJ[a].push(b);
  if (!ADJ[b].includes(a)) ADJ[b].push(a);
});

const T_BY_ID = {};
TERRITORIES.forEach(t => T_BY_ID[t.id] = t);

// =====================================================================
// PARAMÈTRES ÉCONOMIQUES
// =====================================================================
const RECRUIT_COST   = 10;
const INCOME_BASE    = 5;
const INCOME_PER_T   = 3;
const INCOME_CAPITAL = 8;
const MAX_ARMIES     = 20;
const RECRUIT_MIN_ARMIES_TARGET = 1;  // territoire doit déjà être à toi

// =====================================================================
// ÉTAT
// =====================================================================
const state = {
  turn: 1,
  phase: 'choose',           // 'choose' | 'play' | 'animating' | 'over'
  humanCountry: null,
  territories: {},           // { id: { owner, armies, hasActed } }
  gold: {},                  // { countryId: gold }
  selectedId: null,
  alive: {},                 // { countryId: bool }
  log: [],
};

function initState() {
  state.turn = 1;
  state.phase = 'play';
  state.selectedId = null;
  state.territories = {};
  TERRITORIES.forEach(t => {
    state.territories[t.id] = { owner: t.owner, armies: t.armies, hasActed: false };
  });
  state.gold = {};
  PLAYABLE.forEach(c => state.gold[c] = 30);
  state.alive = {};
  PLAYABLE.forEach(c => state.alive[c] = true);
}

// =====================================================================
// HELPERS
// =====================================================================
function ownedBy(countryId) {
  return TERRITORIES.filter(t => state.territories[t.id].owner === countryId);
}

function capitalOf(countryId) {
  return TERRITORIES.find(t => t.capital && t.owner === countryId);
}

function isCapitalHeld(countryId) {
  const cap = capitalOf(countryId);
  return cap && state.territories[cap.id].owner === countryId;
}

function calcIncome(countryId) {
  let inc = INCOME_BASE;
  TERRITORIES.forEach(t => {
    if (state.territories[t.id].owner === countryId) {
      inc += t.capital ? INCOME_CAPITAL : INCOME_PER_T;
    }
  });
  return inc;
}

function rng(min, max) { return Math.random() * (max - min) + min; }

// =====================================================================
// COMBAT
// =====================================================================
// Renvoie {attackerLosses, defenderLosses, attackerWins}
function resolveCombat(attackerArmies, defenderArmies) {
  // Force avec aléa + bonus défenseur
  const aPower = attackerArmies * rng(0.85, 1.25);
  const dPower = defenderArmies * rng(1.0, 1.45);  // bonus défenseur

  const attackerWins = aPower > dPower;

  let attackerLosses, defenderLosses;
  if (attackerWins) {
    // L'attaquant gagne mais perd ~50-80% des effectifs adverses
    defenderLosses = defenderArmies;
    attackerLosses = Math.min(
      attackerArmies - 1,
      Math.max(1, Math.round(defenderArmies * rng(0.6, 0.95)))
    );
  } else {
    // L'attaquant perd lourdement, le défenseur souffre aussi
    attackerLosses = Math.max(1, Math.round(attackerArmies * rng(0.6, 0.95)));
    defenderLosses = Math.max(0, Math.round(defenderArmies * rng(0.2, 0.5)));
  }

  return { attackerLosses, defenderLosses, attackerWins };
}

// =====================================================================
// ACTIONS DE JEU
// =====================================================================
function recruit(territoryId, owner) {
  const t = state.territories[territoryId];
  if (!t || t.owner !== owner) return false;
  if (state.gold[owner] < RECRUIT_COST) return false;
  if (t.armies >= MAX_ARMIES) return false;
  state.gold[owner] -= RECRUIT_COST;
  t.armies += 1;
  return true;
}

// Bouge ou attaque depuis "from" vers "to" avec un nombre d'armées donné
// renvoie { type:'move'|'attack', success, ...details }
function moveOrAttack(fromId, toId, sendCount) {
  const from = state.territories[fromId];
  const to = state.territories[toId];
  if (!from || !to) return { error: 'invalid' };
  if (!ADJ[fromId].includes(toId)) return { error: 'not-adjacent' };
  if (from.hasActed) return { error: 'already-acted' };
  if (sendCount < 1 || sendCount > from.armies - 1) return { error: 'bad-count' };

  // Déplacement vers territoire ami
  if (to.owner === from.owner) {
    const dest = to.armies + sendCount;
    if (dest > MAX_ARMIES) {
      const overflow = dest - MAX_ARMIES;
      to.armies = MAX_ARMIES;
      from.armies -= (sendCount - overflow);
    } else {
      to.armies = dest;
      from.armies -= sendCount;
    }
    from.hasActed = true;
    return { type: 'move' };
  }

  // Attaque
  const combat = resolveCombat(sendCount, to.armies);
  from.armies -= sendCount;            // toutes les troupes envoyées quittent
  from.hasActed = true;
  let conquered = false;

  if (combat.attackerWins) {
    const survivors = sendCount - combat.attackerLosses;
    to.armies = Math.max(1, survivors);
    to.owner = from.owner;
    to.hasActed = true;                // le territoire conquis ne peut plus agir ce tour
    conquered = true;
  } else {
    // Survivants attaquants rentrent au bercail
    const survivors = sendCount - combat.attackerLosses;
    from.armies += Math.max(0, survivors);
    to.armies = Math.max(1, to.armies - combat.defenderLosses);
  }

  return {
    type: 'attack',
    conquered,
    attackerLosses: combat.attackerLosses,
    defenderLosses: combat.defenderLosses,
    sent: sendCount
  };
}

// =====================================================================
// IA
// =====================================================================
function aiTurn(countryId) {
  if (!state.alive[countryId]) return;

  // Revenu
  state.gold[countryId] += calcIncome(countryId);

  // Phase recrutement : dépense l'or sur capitale et frontière
  const owned = ownedBy(countryId);
  if (owned.length === 0) return;
  const cap = capitalOf(countryId);
  let safety = 200;
  while (state.gold[countryId] >= RECRUIT_COST && safety-- > 0) {
    // priorité aux territoires de frontière avec moins d'armées
    const frontier = owned.filter(t => {
      if (state.territories[t.id].owner !== countryId) return false;
      if (state.territories[t.id].armies >= MAX_ARMIES) return false;
      return ADJ[t.id].some(a => state.territories[a].owner !== countryId);
    });
    let target;
    if (frontier.length) {
      frontier.sort((a, b) => state.territories[a.id].armies - state.territories[b.id].armies);
      target = frontier[0];
    } else if (cap && state.territories[cap.id].owner === countryId
               && state.territories[cap.id].armies < MAX_ARMIES) {
      target = cap;
    } else {
      target = owned.find(t =>
        state.territories[t.id].owner === countryId
        && state.territories[t.id].armies < MAX_ARMIES);
    }
    if (!target) break;
    if (!recruit(target.id, countryId)) break;
  }

  // Phase action : pour chaque territoire, soit attaque opportune, soit consolidation
  const actionOrder = [...owned].sort(() => Math.random() - 0.5);
  for (const t of actionOrder) {
    const s = state.territories[t.id];
    if (s.hasActed) continue;
    if (s.armies < 2) continue;

    const enemies = ADJ[t.id]
      .map(id => ({ id, st: state.territories[id] }))
      .filter(e => e.st.owner !== countryId);
    const enemyEnemies = enemies.filter(e => e.st.owner !== 'neutral');
    const neutralEnemies = enemies.filter(e => e.st.owner === 'neutral');

    // Cible facile en priorité (capitale ennemie ou neutre faible)
    let target = null;
    let bestScore = -Infinity;
    for (const e of enemies) {
      const myStr = s.armies;
      const enStr = e.st.armies;
      let score = myStr - enStr * 1.2;
      const tdata = T_BY_ID[e.id];
      if (tdata.capital && e.st.owner !== 'neutral') score += 5;     // bonus capitale ennemie
      if (e.st.owner === 'neutral') score += 1;                       // bonus expansion
      if (myStr < enStr + 1) score -= 5;                              // ne pas attaquer si trop faible
      if (score > bestScore) { bestScore = score; target = e; }
    }

    if (target && bestScore > 0) {
      // envoyer ce qu'on peut (laisse 1 en garnison)
      const send = s.armies - 1;
      moveOrAttack(t.id, target.id, send);
    } else {
      // sinon consolidation : envoie au territoire ami le plus proche d'un ennemi
      const friends = ADJ[t.id].filter(id => state.territories[id].owner === countryId);
      if (friends.length && s.armies > 3 && Math.random() < 0.4) {
        // choisir un ami frontalier
        const front = friends.find(id => ADJ[id].some(a => state.territories[a].owner !== countryId));
        if (front) {
          const send = Math.floor((s.armies - 1) / 2);
          if (send > 0) moveOrAttack(t.id, front, send);
        }
      }
    }
  }
}

// =====================================================================
// CYCLE DE TOUR
// =====================================================================
function deathCheck() {
  PLAYABLE.forEach(c => {
    if (state.alive[c] && !isCapitalHeld(c)) {
      state.alive[c] = false;
      // Les territoires restants se rebellent et deviennent neutres
      TERRITORIES.forEach(t => {
        if (state.territories[t.id].owner === c) {
          state.territories[t.id].owner = 'neutral';
          state.territories[t.id].armies = Math.max(1, Math.floor(state.territories[t.id].armies / 2));
        }
      });
    }
  });
}

function endHumanTurn() {
  if (state.phase !== 'play') return;
  state.phase = 'animating';
  state.selectedId = null;
  ui.clearHighlights();
  ui.toast('Tours des adversaires...', 'info', 900);

  setTimeout(() => {
    // 1. Morts causées par les actions du joueur
    deathCheck();

    // 2. Tours des IA vivantes, mortalité vérifiée après chacune
    const aiCountries = PLAYABLE.filter(c => c !== state.humanCountry && state.alive[c]);
    aiCountries.forEach(c => {
      if (!state.alive[c]) return;
      for (const id in state.territories) state.territories[id].hasActed = false;
      aiTurn(c);
      deathCheck();
    });

    // 4. Reset général pour le tour suivant
    for (const id in state.territories) state.territories[id].hasActed = false;

    // 5. Avancer le tour
    state.turn += 1;

    // 6. Revenu du joueur humain (si toujours en vie)
    if (state.alive[state.humanCountry]) {
      state.gold[state.humanCountry] += calcIncome(state.humanCountry);
    }

    // 7. Vérifier fin de partie
    const winner = checkWin();
    if (winner) {
      state.phase = 'over';
      ui.showGameOver(winner);
    } else {
      state.phase = 'play';
    }

    ui.refresh();
  }, 350);
}

function checkWin() {
  if (!state.alive[state.humanCountry]) return 'loss';
  const enemiesAlive = PLAYABLE.filter(c => c !== state.humanCountry && state.alive[c]);
  if (enemiesAlive.length === 0) return 'win';

  // Victoire de domination : 60% des territoires
  const mine = ownedBy(state.humanCountry).length;
  if (mine >= Math.ceil(TERRITORIES.length * 0.6)) return 'win';
  return null;
}

// =====================================================================
// UI / RENDU
// =====================================================================
const ui = {
  svg: null,
  layerConn: null,
  layerTerr: null,
  layerLabel: null,
  layerFx: null,

  init() {
    this.svg = document.getElementById('map');
    this.layerConn = document.getElementById('layer-connections');
    this.layerTerr = document.getElementById('layer-territories');
    this.layerLabel = document.getElementById('layer-labels');
    this.layerFx = document.getElementById('layer-fx');

    this.drawConnections();
    this.drawTerritories();

    document.getElementById('btn-recruit').addEventListener('click', () => this.onRecruit());
    document.getElementById('btn-end-turn').addEventListener('click', () => this.onEndTurn());

    // Tap on background to deselect
    this.svg.addEventListener('click', (e) => {
      if (e.target === this.svg || e.target.tagName === 'rect') {
        state.selectedId = null;
        this.refresh();
      }
    });
  },

  drawConnections() {
    const drawn = new Set();
    ADJACENCIES.forEach(([a, b]) => {
      const key = [a, b].sort().join('-');
      if (drawn.has(key)) return;
      drawn.add(key);
      const ta = T_BY_ID[a], tb = T_BY_ID[b];
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', ta.x);
      line.setAttribute('y1', ta.y);
      line.setAttribute('x2', tb.x);
      line.setAttribute('y2', tb.y);
      line.setAttribute('class', 'connection');
      this.layerConn.appendChild(line);
    });
  },

  drawTerritories() {
    TERRITORIES.forEach(t => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'territory' + (t.capital ? ' capital' : ''));
      g.setAttribute('data-id', t.id);
      g.setAttribute('transform', `translate(${t.x},${t.y})`);

      // shape: hex pour capitale, cercle sinon
      let shape;
      const radius = t.capital ? 30 : 26;
      if (t.capital) {
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const pts = [];
        for (let i = 0; i < 6; i++) {
          const ang = (Math.PI / 3) * i - Math.PI / 2;
          pts.push(`${(Math.cos(ang) * radius).toFixed(1)},${(Math.sin(ang) * radius).toFixed(1)}`);
        }
        shape.setAttribute('points', pts.join(' '));
      } else {
        shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        shape.setAttribute('r', radius);
      }
      shape.setAttribute('class', 'territory-shape');
      shape.setAttribute('data-shape', t.id);
      g.appendChild(shape);

      // Capital star
      if (t.capital) {
        const star = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const sr = 7;
        const pts = [];
        for (let i = 0; i < 10; i++) {
          const r = (i % 2 === 0) ? sr : sr / 2.4;
          const ang = (Math.PI / 5) * i - Math.PI / 2;
          pts.push(`${(Math.cos(ang) * r).toFixed(1)},${(Math.sin(ang) * r - 16).toFixed(1)}`);
        }
        star.setAttribute('points', pts.join(' '));
        star.setAttribute('class', 'capital-marker');
        g.appendChild(star);
      }

      // Army badge
      const badge = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      badge.setAttribute('class', 'army-badge');
      badge.setAttribute('transform', `translate(0, 5)`);
      const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      bgCircle.setAttribute('r', 13);
      bgCircle.setAttribute('class', 'army-badge-bg');
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('class', 'army-badge-text');
      txt.setAttribute('data-armies', t.id);
      txt.textContent = '0';
      badge.appendChild(bgCircle);
      badge.appendChild(txt);
      g.appendChild(badge);

      // Name label (au-dessus)
      const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      lbl.setAttribute('class', 'territory-label');
      lbl.setAttribute('y', -(radius + 6));
      lbl.textContent = t.name;
      this.layerLabel.appendChild(this.makeLabelGroup(t, lbl));

      g.addEventListener('click', (e) => {
        e.stopPropagation();
        this.onTerritoryClick(t.id);
      });

      this.layerTerr.appendChild(g);
    });
  },

  makeLabelGroup(t, textEl) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${t.x},${t.y})`);
    g.appendChild(textEl);
    return g;
  },

  refresh() {
    // top bar
    document.getElementById('ui-turn').textContent = 'T' + state.turn;
    const country = state.humanCountry;
    document.getElementById('ui-country').textContent = country ? COUNTRIES[country].name : '-';
    document.getElementById('ui-gold').textContent = country ? state.gold[country] : '0';
    document.getElementById('ui-territories').textContent =
      country ? ownedBy(country).length + '/' + TERRITORIES.length : '0';

    // territoires : couleur et armées
    TERRITORIES.forEach(t => {
      const s = state.territories[t.id];
      const shape = document.querySelector(`[data-shape="${t.id}"]`);
      const txt = document.querySelector(`[data-armies="${t.id}"]`);
      if (shape) shape.setAttribute('fill', COUNTRIES[s.owner].color);
      if (txt) txt.textContent = s.armies;
    });

    // sélection et surbrillances
    this.clearHighlights();
    if (state.selectedId) {
      const g = document.querySelector(`.territory[data-id="${state.selectedId}"]`);
      if (g) g.classList.add('selected');
      const t = state.territories[state.selectedId];
      // surbrillance des adjacents
      ADJ[state.selectedId].forEach(id => {
        const ag = document.querySelector(`.territory[data-id="${id}"]`);
        if (!ag) return;
        const adj = state.territories[id];
        if (t.owner === state.humanCountry && !t.hasActed && t.armies > 1) {
          if (adj.owner === state.humanCountry) ag.classList.add('reachable');
          else ag.classList.add('attackable');
        }
      });
    }

    // panneau info
    this.updateInfoPanel();
  },

  clearHighlights() {
    document.querySelectorAll('.territory').forEach(g =>
      g.classList.remove('selected', 'reachable', 'attackable'));
  },

  updateInfoPanel() {
    const nameEl = document.getElementById('ui-selected-name');
    const statsEl = document.getElementById('ui-selected-stats');
    const recruitBtn = document.getElementById('btn-recruit');

    if (!state.selectedId) {
      nameEl.textContent = 'Sélectionnez un territoire';
      statsEl.innerHTML = state.humanCountry
        ? `Tour ${state.turn} • Revenu prévu: +${calcIncome(state.humanCountry)}💰`
        : '';
      recruitBtn.disabled = true;
      return;
    }

    const t = T_BY_ID[state.selectedId];
    const s = state.territories[state.selectedId];
    const co = COUNTRIES[s.owner];
    nameEl.innerHTML = `${t.name}${t.capital ? ' ★' : ''}`;

    const ownerTag = `<span class="owner-tag" style="background:${co.color}">${co.name}</span>`;
    const hint = (s.owner === state.humanCountry)
      ? (s.hasActed
        ? '<em style="color:#888">Ce territoire a déjà agi ce tour</em>'
        : (s.armies < 2 ? '<em style="color:#888">Pas assez d\'armées pour bouger</em>' : 'Touchez un voisin pour bouger/attaquer'))
      : '';
    statsEl.innerHTML = `${ownerTag} ⚔️ ${s.armies} armées<br>${hint}`;

    const canRecruit = state.phase === 'play'
      && s.owner === state.humanCountry
      && state.gold[state.humanCountry] >= RECRUIT_COST
      && s.armies < MAX_ARMIES;
    recruitBtn.disabled = !canRecruit;
  },

  onTerritoryClick(id) {
    if (state.phase !== 'play') return;

    const clicked = state.territories[id];

    // Pas encore sélectionné -> sélectionner (si c'est à toi, sinon juste afficher)
    if (!state.selectedId) {
      state.selectedId = id;
      this.refresh();
      return;
    }

    // Re-clic sur le même -> désélectionne
    if (state.selectedId === id) {
      state.selectedId = null;
      this.refresh();
      return;
    }

    // Sélection courante : si c'est à moi et action possible et voisin -> action
    const sel = state.territories[state.selectedId];
    const isAdjacent = ADJ[state.selectedId].includes(id);
    const canAct = sel.owner === state.humanCountry && !sel.hasActed && sel.armies > 1;

    if (canAct && isAdjacent) {
      // Bouge ou attaque
      if (clicked.owner === state.humanCountry) {
        this.promptMove(state.selectedId, id);
      } else {
        this.promptAttack(state.selectedId, id);
      }
      return;
    }

    // Sinon, changer la sélection
    state.selectedId = id;
    this.refresh();
  },

  onRecruit() {
    if (!state.selectedId) return;
    const ok = recruit(state.selectedId, state.humanCountry);
    if (ok) {
      this.toast('+1 armée recrutée', 'success', 800);
      this.refresh();
    }
  },

  onEndTurn() {
    if (state.phase !== 'play') return;
    endHumanTurn();
  },

  // ----- Modales -----
  showModal(html) {
    const m = document.getElementById('modal');
    const c = document.getElementById('modal-content');
    c.innerHTML = html;
    m.classList.remove('hidden');
  },
  hideModal() {
    document.getElementById('modal').classList.add('hidden');
  },

  promptMove(fromId, toId) {
    const from = state.territories[fromId];
    const max = from.armies - 1;
    const fromName = T_BY_ID[fromId].name;
    const toName = T_BY_ID[toId].name;
    const initial = max;
    this.showModal(`
      <h2>Déplacer</h2>
      <p><strong>${fromName}</strong> ➜ <strong>${toName}</strong></p>
      <div class="slider-row">
        <label><span>Armées à envoyer</span><span id="mv-count">${initial}</span></label>
        <input type="range" id="mv-slider" min="1" max="${max}" value="${initial}">
      </div>
      <div class="modal-actions">
        <button id="mv-cancel" style="background:#444">Annuler</button>
        <button id="mv-confirm">Confirmer</button>
      </div>
    `);
    const slider = document.getElementById('mv-slider');
    const out = document.getElementById('mv-count');
    slider.addEventListener('input', () => out.textContent = slider.value);
    document.getElementById('mv-cancel').addEventListener('click', () => this.hideModal());
    document.getElementById('mv-confirm').addEventListener('click', () => {
      moveOrAttack(fromId, toId, parseInt(slider.value, 10));
      this.hideModal();
      state.selectedId = toId;
      this.refresh();
    });
  },

  promptAttack(fromId, toId) {
    const from = state.territories[fromId];
    const to = state.territories[toId];
    const max = from.armies - 1;
    const fromName = T_BY_ID[fromId].name;
    const toName = T_BY_ID[toId].name;
    const toOwner = COUNTRIES[to.owner];
    const initial = max;
    this.showModal(`
      <h2>⚔️ Attaque</h2>
      <p><strong>${fromName}</strong> attaque <strong>${toName}</strong></p>
      <p style="font-size:13px">Défense: <span class="owner-tag" style="background:${toOwner.color}">${toOwner.name}</span> ${to.armies} armées</p>
      <div class="slider-row">
        <label><span>Armées d'assaut</span><span id="at-count">${initial}</span></label>
        <input type="range" id="at-slider" min="1" max="${max}" value="${initial}">
      </div>
      <p style="font-size:12px;color:#888">Le défenseur a un bonus de terrain. Envoyer assez d'armées augmente vos chances.</p>
      <div class="modal-actions">
        <button id="at-cancel" style="background:#444">Annuler</button>
        <button id="at-confirm" style="background:#c9433f">Attaquer !</button>
      </div>
    `);
    const slider = document.getElementById('at-slider');
    const out = document.getElementById('at-count');
    slider.addEventListener('input', () => out.textContent = slider.value);
    document.getElementById('at-cancel').addEventListener('click', () => this.hideModal());
    document.getElementById('at-confirm').addEventListener('click', () => {
      const send = parseInt(slider.value, 10);
      const r = moveOrAttack(fromId, toId, send);
      this.hideModal();
      this.showCombatResult(fromId, toId, send, r);
    });
  },

  showCombatResult(fromId, toId, sent, r) {
    const fromName = T_BY_ID[fromId].name;
    const toName = T_BY_ID[toId].name;
    this.playFx(toId, r.conquered ? '#5cb85c' : '#d9534f');
    const outcome = r.conquered
      ? `<div class="combat-row outcome win">VICTOIRE — ${toName} conquis !</div>`
      : `<div class="combat-row outcome loss">DÉFAITE — l'attaque est repoussée</div>`;
    this.showModal(`
      <h2>Bataille</h2>
      <div class="combat-result">
        <div class="combat-row"><span>Forces envoyées</span><span>${sent}</span></div>
        <div class="combat-row"><span>Pertes attaquant</span><span style="color:#d9534f">-${r.attackerLosses}</span></div>
        <div class="combat-row"><span>Pertes défenseur</span><span style="color:#d9534f">-${r.defenderLosses}</span></div>
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
      // si défaite humain
      if (!state.alive[state.humanCountry]) { /* should not happen here */ }
    });
  },

  playFx(territoryId, color) {
    const t = T_BY_ID[territoryId];
    const circ = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circ.setAttribute('cx', t.x);
    circ.setAttribute('cy', t.y);
    circ.setAttribute('r', 25);
    circ.setAttribute('fill', 'none');
    circ.setAttribute('stroke', color);
    circ.setAttribute('stroke-width', 4);
    circ.setAttribute('class', 'fx-flash');
    this.layerFx.appendChild(circ);
    setTimeout(() => circ.remove(), 700);
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
      const c = COUNTRIES[id];
      const territories = TERRITORIES.filter(t => t.owner === id);
      const totalArmies = territories.reduce((s, t) => s + t.armies, 0);
      return `
        <div class="country-card" data-country="${id}">
          <div class="color-chip" style="background:${c.color}"></div>
          <div>${c.name}</div>
          <div class="difficulty">${territories.length} régions • ${totalArmies} armées</div>
        </div>`;
    }).join('');

    this.showModal(`
      <h1>⚔️ Europa Conquest</h1>
      <p class="subtitle">Choisissez votre puissance</p>
      <div class="country-grid" id="cs-grid">${cards}</div>
      <p style="font-size:12px;color:#8090b0;text-align:center">
        Conquérez toutes les capitales ennemies ou contrôlez 60% de l'Europe.<br>
        Perdez votre capitale et c'est la fin.
      </p>
    `);

    document.querySelectorAll('.country-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.country;
        state.humanCountry = id;
        state.phase = 'play';
        this.hideModal();
        this.toast(`Vous dirigez ${COUNTRIES[id].name}`, 'success', 1500);
        this.refresh();
      });
    });
  },

  showGameOver(result) {
    // Scores
    const scores = PLAYABLE.map(c => ({
      id: c,
      name: COUNTRIES[c].name,
      color: COUNTRIES[c].color,
      territories: ownedBy(c).length,
      alive: state.alive[c]
    })).sort((a, b) => b.territories - a.territories);

    const rows = scores.map(s => `
      <div class="score-row">
        <span class="score-chip" style="background:${s.color}"></span>
        <span class="score-name">${s.name}${s.id === state.humanCountry ? ' (vous)' : ''}</span>
        <span class="score-detail">${s.territories} régions ${s.alive ? '' : '☠️'}</span>
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
      this.showCountrySelect();
      this.refresh();
    });
  }
};

// =====================================================================
// BOOT
// =====================================================================
document.addEventListener('DOMContentLoaded', () => {
  initState();
  ui.init();
  ui.refresh();
  state.phase = 'choose';
  ui.showCountrySelect();
});

// Empêcher le pinch-zoom intempestif (Safari iOS)
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault());
