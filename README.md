# 🌌 Porte des étoiles — Énigme d'anniversaire

Un cadeau interactif dans l'univers Stargate. **Épreuve 1** : ouvrir la porte des
étoiles en enclenchant, dans le bon ordre, les 4 runes grecques formant le mot
**ΔΩΡΟ** (« δώρο » = *cadeau* en grec). Réussite → le trou de ver s'ouvre →
**voyage interstellaire** → **Épreuve 2** : une machine alien à spirale de
Fibonacci sur une planète désertique → révélation « Joyeux anniversaire » avec la
clé du jeu.

Le tout est un site statique **sans dépendance et sans build** (HTML/CSS/JS pur),
prévu pour être hébergé gratuitement sur **GitHub Pages**.

---

## 🎮 Comment on joue

1. Écran d'intro → « Établir la connexion ».
2. Parmi ~39 runes, **4 lettres grecques dorées** ressortent : Δ, Ω, Ρ, Ο.
3. Deux façons de jouer :
   - **Cliquer une rune** : l'anneau tourne pour l'amener sous le chevron du haut et l'enclenche.
   - **Faire tourner l'anneau** (glisser à la souris / au doigt) puis **cliquer le chevron du haut** pour verrouiller la rune positionnée.
4. Bonne rune → *« Chevron enclenché »*, un chevron s'allume en orange, le cartouche se remplit.
   Mauvaise rune → *« Connexion interrompue »*, tout se réinitialise.
5. Les 4 dans l'ordre **Δ → Ω → Ρ → Ο** → la porte tourne, kawoosh, trou de ver → **Franchir la porte**.

> L'ordre est l'énigme : il faut comprendre que les 4 signes forment le mot grec
> *cadeau* (ΔΩΡΟ) et les cliquer dans cet ordre de lecture.

---

## 🔑 Avant d'envoyer : remplir la clé

Ouvre [`config.js`](config.js) et remplace les valeurs :

```js
window.GIFT = {
  gameName: "Vintage Story",
  downloadUrl: "https://www.vintagestory.at/",
  gameKey: "TA-CLE-ICI"
};
```

Ces infos **n'apparaissent pas dans l'épreuve 1** : elles ne seront révélées
qu'à la fin de l'épreuve 2 (à construire). ⚠️ Sur un dépôt **public**, ce fichier
reste lisible dans le code source — utilise un dépôt **privé** si tu veux garder
la clé secrète, ou ne la colle qu'au dernier moment.

---

## 🚀 Déployer sur GitHub Pages

```bash
cd stargate-anniversaire
git init
git add .
git commit -m "Porte des etoiles - epreuve 1"
git branch -M main
git remote add origin https://github.com/<ton-user>/stargate-anniversaire.git
git push -u origin main
```

Puis sur GitHub : **Settings → Pages → Source: Deploy from a branch → `main` / `/root` → Save**.
Ton lien : `https://<ton-user>.github.io/stargate-anniversaire/`

---

## 💬 Message Messenger

Colle ton lien avec un message, par exemple :

> Coucou, joyeux anniversaire, voici ton cadeau, bonne chasse 🌌
> 👉 https://<ton-user>.github.io/stargate-anniversaire/

> Messenger bloque souvent l'envoi de fichiers `.html` en pièce jointe — d'où le lien Pages.

---

## 🧪 Tester en local

```bash
cd stargate-anniversaire
python -m http.server 8000
```
Puis ouvre http://localhost:8000

---

## 📁 Structure

```
anniv-enigme-kii/
  index.html        écrans (intro, porte, planète, révélation)
  config.js         URL + clé — révélées à la toute fin
  css/style.css     thème sombre sci-fi, responsive
  js/
    starfield.js    fond étoilé animé
    stargate.js     la porte (anneau, chevrons, runes, rotation, trou de ver)
    puzzle.js       logique épreuve 1 (séquence ΔΩΡΟ, cartouche, messages)
    travel.js       voyage interstellaire (tunnel d'étoiles)
    scene2.js       décor planète désertique + machine (épreuve 2)
    puzzle2.js       machine à spirale de Fibonacci (activation + charge = 13)
    reveal.js       écran festif « Joyeux anniversaire » + clé copiable
    audio.js        sons synthétisés (WebAudio) + mute
```

## 🔮 Suite possible

L'enchaînement épreuve 1 → épreuve 2 → révélation est complet. Une épreuve 3
pourrait s'insérer avant `reveal.js` (le cadeau final lit toujours `window.GIFT`).
