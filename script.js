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

document.getElementById('theme-select').addEventListener('change', (e) => loadTheme(e.target.value));

loadTheme('DDEA');
