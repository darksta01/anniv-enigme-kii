/* =========================================================================
   CONFIG
   -------------------------------------------------------------------------
   L'URL et la clé n'apparaissent qu'à la TOUTE FIN (après l'épreuve 2).

   La clé est OBFUSQUÉE (gameKeyEnc) : elle n'est pas en texte clair, pour
   échapper aux robots qui scannent GitHub. Ce n'est pas du chiffrement fort
   (le code sait la décoder), mais ça suffit pour un cadeau.

   Pour CHANGER la clé plus tard, tu as deux options :
     • simple : remplace la ligne par  gameKey: "TA-CLE-EN-CLAIR"
       (reveal.js accepte les deux ; mais alors elle est lisible dans le code) ;
     • propre : redonne-moi la nouvelle clé et je te régénère le gameKeyEnc.
   ========================================================================= */

window.GIFT = {
  gameName: "Vintage Story",
  downloadUrl: "https://account.vintagestory.at/createaccount",   // page de téléchargement / connexion
  gameKeyEnc: "OBEuNic8DmoxODEUGUBAMhs3JDsiWRs4TgM/NgwJDxYEGSFmUA4uAx4GMlw="
};
