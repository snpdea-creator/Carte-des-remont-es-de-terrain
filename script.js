// Un thème = un fichier JSON dans /data, généré par convert.py.
// Le fichier JSON décrit lui-même ses champs (clé "_fields"), donc ajouter un
// thème se limite à : générer data/<NOM>.json avec convert.py, l'ajouter ici,
// puis ajouter une <option> dans index.html.
const THEMES = {
  DDEA: { file: 'data/DDEA.json' },
    TRM: { file: 'data/TRM.json' }
};

let currentData = {};
let currentFields = [];
let currentRegion = null;

async function loadTheme(themeName) {
  const cfg = THEMES[themeName];
  const detail = document.getElementById('detail');
  try {
    const res = await fetch(cfg.file);
    if (!res.ok) throw new Error('fichier ' + cfg.file + ' introuvable (' + res.status + ')');
    const raw = await res.json();
    currentFields = raw._fields || [];
    currentData = raw;

    document.querySelectorAll('.bubble').forEach((b) => {
      const code = b.dataset.region;
      b.classList.toggle('has-data', code !== '_fields' && !!currentData[code]);
      b.classList.remove('active');
    });

    currentRegion = null;
    detail.innerHTML =
      '<p style="font-size:13px;color:var(--text-muted);margin:0;">Survolez une région pour voir le détail complet.</p>';
  } catch (err) {
    detail.innerHTML =
      '<p style="font-size:13px;color:#a32d2d;margin:0;">Impossible de charger ce thème : ' + err.message + '</p>';
  }
}

function selectRegion(code) {
  currentRegion = code;
  document.querySelectorAll('.bubble').forEach((b) => {
    b.classList.toggle('active', b.dataset.region === code);
  });

  const detail = document.getElementById('detail');
  const region = currentData[code];

  if (!region) {
    detail.innerHTML =
      '<p style="font-size:13px;color:var(--text-muted);margin:0;">Aucune remontée pour cette région sur ce thème.</p>';
    return;
  }

  let html = '<p style="font-weight:700;font-size:14px;margin:0 0 8px;">' + region.label + '</p>';
  currentFields.forEach(([key, label]) => {
    const f = region[key];
    if (!f) return;
    const cls = f.color ? 'fvalue' : 'fvalue plain';
    const style = f.color ? ' style="background:' + f.color + ';"' : '';
    html += '<div class="field"><p class="flabel">' + label + '</p><p class="' + cls + '"' + style + '>' + f.text + '</p></div>';
  });
  detail.innerHTML = html;
}

document.querySelectorAll('.bubble').forEach((b) => {
  b.addEventListener('mouseenter', () => selectRegion(b.dataset.region));
  b.addEventListener('click', () => selectRegion(b.dataset.region));
});

document.getElementById('theme-select').addEventListener('change', (e) => loadTheme(e.target.value));

loadTheme('DDEA');
