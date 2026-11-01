# SOLARYS Stream

Site de streaming prêt pour Vercel (HTML/JS + fonctions Node, sans build).

## Déploiement
1. Importer ce dossier sur Vercel (ou `vercel --prod`).
2. Variables d'environnement :
   - `ADMIN_PASSWORD` (obligatoire) : accès à `/admin`
   - `TMDB_API_KEY` (recommandée) : catalogue, affiches, bandes-annonces (clé gratuite sur themoviedb.org)
   - Upstash Redis via Vercel Marketplace (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) pour conserver les sources ajoutées
3. Sans clé TMDB, le site fonctionne avec les films libres de `data/free-library.json`.

## Pages
`#/` accueil · `#/categories` · `#/profile` (stocké sur l'appareil) · `/admin`

## Ajouter une source légale (zip)
Dans `/admin`, envoyer un zip contenant `manifest.json` (voir `public/exemple-source.zip`).
Le site le valide (licence, HTTPS, pas d'adresse privée), teste l'API et l'active seul.
Le zip est déclaratif : aucun code n'est exécuté. L'API cible doit renvoyer du JSON avec,
pour chaque film, un identifiant, un titre et une URL de flux HTTPS (MP4 ou HLS).
