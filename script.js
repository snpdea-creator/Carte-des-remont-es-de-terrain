// Un thème = un fichier JSON dans /data, généré par convert.py.
// Le fichier JSON décrit lui-même ses champs (clé "_fields"), donc ajouter un
// thème se limite à : générer data/<NOM>.json avec convert.py, l'ajouter ici,
// puis ajouter une <option> dans index.html.
const THEMES = {
  DDEA: { file: 'data/DDEA.json' },
  TRM: { file: 'data/TRM.json' }
};

// Noms forcés à l'affichage, quelle que soit l'écriture dans le fichier source.
const DISPLAY_NAMES = {
  DROM: 'DROM-COM'
};

let currentData = {};
let currentFields = [];
let currentRegion = null;

// Une réponse est "complète" si tous les champs du thème sont renseignés.
function isComplete(region) {
  return currentFields.every(([key]) => {
    const f = region[key];
    return f && f.text && f.text !== 'Non renseigné';
  });
}

async function loadTheme(themeName) {
  const cfg = THEMES[themeName];
  const detail = document.getElementById('detail');
  try {
    const res = await fetch(cfg.file);
    if (!res.ok) throw new Error('fichier ' + cfg.file + ' introuvable (' + res.status + ')');
    const raw = await res.json();
    currentFields = raw._fields || [];
    currentData = raw;

    document.querySelectorAll('[data-region]').forEach((el) => {
      const code = el.dataset.region;
      const region = code !== '_fields' ? currentData[code] : null;
      el.classList.remove('complete', 'partial', 'active');
      if (region) {
        el.classList.add(isComplete(region) ? 'complete' : 'partial');
      }
    });

    currentRegion = null;
    detail.innerHTML =
      '<p style="font-size:13px;color:var(--text-muted);margin:0;">Survolez une région pour voir le détail complet.</p>';

    fillColumnSelect();
    renderCompare();
  } catch (err) {
    detail.innerHTML =
      '<p style="font-size:13px;color:#a32d2d;margin:0;">Impossible de charger ce thème : ' + err.message + '</p>';
  }
}

function selectRegion(code, fallbackName) {
  currentRegion = code;
  document.querySelectorAll('[data-region]').forEach((el) => {
    el.classList.toggle('active', el.dataset.region === code);
  });

  const detail = document.getElementById('detail');
  const region = currentData[code];
  const name = DISPLAY_NAMES[code] || (region && region.label) || fallbackName || code;

  let html = '<p style="font-weight:700;font-size:14px;margin:0 0 8px;">' + name + '</p>';

  if (!region) {
    html += '<p style="font-size:13px;color:var(--text-muted);margin:0;">Aucune remontée sur ce thème.</p>';
    detail.innerHTML = html;
    return;
  }

  currentFields.forEach(([key, label]) => {
    const f = region[key];
    if (!f) return;
    const cls = f.color ? 'fvalue' : 'fvalue plain';
    const style = f.color ? ' style="background:' + f.color + ';"' : '';
    html += '<div class="field"><p class="flabel">' + label + '</p><p class="' + cls + '"' + style + '>' + f.text + '</p></div>';
  });
  detail.innerHTML = html;
}

document.querySelectorAll('.region').forEach((el) => {
  // le <title> du tracé SVG sert de nom affiché quand la région n'a pas de données
  const titleEl = el.querySelector('title');
  const name = titleEl ? titleEl.textContent : null;
  el.addEventListener('mouseenter', () => selectRegion(el.dataset.region, name));
  el.addEventListener('click', () => selectRegion(el.dataset.region, name));
});

// --- Vue comparative : une colonne, toutes les régions ---

// Rang de tri d'une couleur de surlignage : rouge d'abord, vert ensuite,
// cellules non surlignées à la fin. Calculé depuis la teinte, donc n'importe
// quelle couleur du tableur est classée automatiquement.
function colorRank(hex) {
  if (!hex) return 1000;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 900; // gris : juste avant les non surlignées
  let h;
  const d = max - min;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = h * 60;
  if (h < 0) h += 360;
  return h;
}

function fillColumnSelect() {
  const sel = document.getElementById('col-select');
  sel.innerHTML = '';
  currentFields.forEach(([key, label]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = label;
    sel.appendChild(opt);
  });
}

function renderCompare() {
  const key = document.getElementById('col-select').value;
  const grid = document.getElementById('cmp-grid');
  const summary = document.getElementById('cmp-summary');
  if (!key) {
    grid.innerHTML = '';
    summary.innerHTML = '';
    return;
  }

  // on ne garde que les régions ayant réellement répondu sur cette colonne
  const rows = [];
  Object.keys(currentData).forEach((code) => {
    if (code === '_fields') return;
    const region = currentData[code];
    const f = region[key];
    if (!f || !f.text || f.text === 'Non renseigné') return;
    rows.push({
      code: code,
      label: DISPLAY_NAMES[code] || region.label || code,
      text: f.text,
      color: f.color
    });
  });

  if (!rows.length) {
    summary.innerHTML = '';
    grid.innerHTML = '<p class="cmp-empty">Aucune région n\'a renseigné cette colonne.</p>';
    return;
  }

  rows.sort((a, b) => colorRank(a.color) - colorRank(b.color));

  // compteur des réponses identiques (comparaison insensible à la casse/espaces)
  const groups = new Map();
  rows.forEach((r) => {
    const k = r.text.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!groups.has(k)) groups.set(k, { text: r.text.trim(), color: r.color, n: 0 });
    groups.get(k).n += 1;
  });
  const repeated = [...groups.values()].filter((g) => g.n > 1).sort((a, b) => b.n - a.n);
  summary.innerHTML = repeated.length
    ? repeated.map((g) => {
        const dot = g.color
          ? '<span class="cmp-dot" style="background:' + g.color + ';"></span>'
          : '<span class="cmp-dot"></span>';
        const short = g.text.length > 60 ? g.text.slice(0, 60) + '…' : g.text;
        return '<span class="cmp-count">' + dot + short + ' — ' + g.n + ' régions</span>';
      }).join('')
    : '<span style="font-size:13px;color:var(--text-muted);">Toutes les réponses sont différentes.</span>';

  grid.innerHTML = rows.map((r) => {
    const cls = r.color ? 'cmp-value' : 'cmp-value plain';
    const style = r.color ? ' style="background:' + r.color + ';"' : '';
    return '<div class="cmp-card"><p class="cmp-region">' + r.label + '</p>' +
           '<p class="' + cls + '"' + style + '>' + r.text + '</p></div>';
  }).join('');
}

document.getElementById('col-select').addEventListener('change', renderCompare);

document.getElementById('theme-select').addEventListener('change', (e) => loadTheme(e.target.value));

loadTheme('DDEA');
