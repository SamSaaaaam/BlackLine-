/* Classement en ligne (FACULTATIF). Tant que ces deux valeurs sont vides, le jeu reste 100 % local : aucun appel réseau, aucun écran de classement.
   Pour l'activer : suis docs/supabase-installation.md, puis colle ici l'adresse de ton projet Supabase et sa clé PUBLIQUE « anon ».
   La clé « anon » est publique par conception (protégée par les règles SQL). Ne colle JAMAIS ici la clé « service_role » : elle est secrète. */
(function (root) {
  var BL = root.BL = root.BL || {};
  BL.lbConfig = BL.lbConfig || {
    url: "https://sjerqbkxrvkqekinvmsv.supabase.co",       /* exemple : "https://abcdefghijklmnop.supabase.co" */
    anonKey: "sb_publishable_zGaEn-e9J4rV9lGWp9uqnw_ZMpFNtet"    /* exemple : "eyJhbGciOi..." (longue chaîne, commence souvent par eyJ) */
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
