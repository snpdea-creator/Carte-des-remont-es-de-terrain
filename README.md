# Remontées de terrain SNPDEA — carte interactive

Page statique (HTML/CSS/JS, aucune dépendance) qui affiche les remontées des
référents régionaux sur des bulles positionnées par région, avec un menu
déroulant pour choisir le thème.

## Structure

```
index.html          page principale
style.css             mise en forme
script.js              logique (chargement des thèmes, panneau de détail)
convert.html            convertit un export .xlsx en JSON, dans le navigateur, rien à installer
convert.py              même conversion, en ligne de commande (Python)
data/
  DDEA.json            données du thème DDEA (une entrée par région)
```

## Mettre à jour un thème existant (ex. DDEA)

Le fichier `data/DDEA.json` n'est pas modifié à la main : il est régénéré à
partir du fichier `.xlsx` exporté depuis votre Google Sheet, en reprenant le
texte de chaque cellule **et** sa couleur de surlignage. Deux façons de le
faire, au choix — le résultat est rigoureusement identique.

### Option A — sans rien installer (convert.html)

Pratique si vous n'avez pas les droits pour installer quoi que ce soit sur
le poste. Tout se passe dans le navigateur, rien n'est envoyé sur internet.

1. Dans Google Sheets : **Fichier → Télécharger → Microsoft Excel (.xlsx)**.
2. Ouvrir `convert.html` (double-clic) dans le navigateur.
3. Sélectionner le fichier `.xlsx` téléchargé.
4. Cliquer sur **Télécharger DDEA.json** — le fichier s'enregistre dans le
   dossier Téléchargements.
5. Déposer ce fichier dans `data/DDEA.json` sur GitHub (voir plus bas).

### Option B — avec Python (convert.py)

1. Dans Google Sheets : **Fichier → Télécharger → Microsoft Excel (.xlsx)**.
2. En local (ou ici, dans cette conversation) :
   ```
   pip install openpyxl        # une seule fois (Windows/Mac)
   python convert.py chemin/vers/export.xlsx DDEA
   ```
   Sous Mac/Linux, la commande s'appelle parfois `python3` au lieu de
   `python` ; si `pip install openpyxl` échoue avec une erreur mentionnant
   "externally managed environment", utiliser
   `pip install openpyxl --break-system-packages`.

### Publier le résultat sur GitHub (les deux options)

- Le plus simple, sans rien installer : sur la page du fichier
  `data/DDEA.json` dans le dépôt GitHub, bouton crayon (**Edit**) → coller
  le nouveau contenu → **Commit changes**. Ou **Add file → Upload files**
  pour glisser-déposer le fichier téléchargé directement.
- Avec `git` installé : `git add data/DDEA.json && git commit -m "maj DDEA" && git push`.

GitHub Pages republie la page automatiquement, en général en moins d'une
minute.

Autre option, à tout moment : redonne-moi le fichier `.xlsx` mis à jour dans
une conversation, je fais tourner la conversion et te renvoie le
`data/DDEA.json` prêt à déposer sur GitHub.

## Ajouter un nouveau thème

1. Exporter le Google Form du nouveau thème en `.xlsx`, avec en colonne A
   "Thème", en colonne B "Région", puis une colonne par question.
2. Le convertir avec `convert.html` ou `convert.py` (voir plus haut), en
   indiquant le nom du thème (ex. `MOYENS`) à la place de `DDEA` — les champs
   et leurs libellés sont détectés automatiquement depuis les en-têtes de
   colonnes.
3. Dans `script.js`, ajouter une ligne dans `THEMES` :
   `NOMDUTHEME: { file: 'data/NOMDUTHEME.json' }`.
4. Dans `index.html`, ajouter une `<option>` dans le menu déroulant
   `#theme-select` avec cette même valeur.

Une région absente du fichier JSON du thème s'affiche en gris ("pas de
remontée") ; il n'y a rien d'autre à faire pour ça. Si une région du fichier
n'est pas reconnue, l'outil de conversion l'indique pour vérification (nom
mal orthographié, région à ajouter dans `REGION_CODES`, etc.).

## Héberger sur GitHub Pages

1. Créer un dépôt GitHub et y pousser tout le contenu de ce dossier.
2. Dans le dépôt : **Settings → Pages**.
3. Source : **Deploy from a branch**, branche `main`, dossier `/ (root)`.
4. La page sera disponible quelques minutes après à une adresse du type
   `https://<votre-compte>.github.io/<nom-du-depot>/`.

## Note importante

Le chargement des fichiers `data/*.json` par `index.html` se fait via
`fetch`, ce qui ne fonctionne que servi par un serveur web (GitHub Pages, ou
un serveur local type `python3 -m http.server`) — **pas** en ouvrant
`index.html` directement depuis l'explorateur de fichiers (double-clic), le
navigateur bloque cette requête pour des raisons de sécurité.

`convert.html`, lui, fonctionne très bien en double-clic : il ne lit pas de
fichier via `fetch`, seulement le fichier que tu sélectionnes toi-même.
