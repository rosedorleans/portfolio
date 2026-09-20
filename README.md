# Portfolio

## Ajouter un projet

Ajouter le projet dans `data/portfolio.json`, placer son image dans `assets/images/`, puis publier les modifications comme d'habitude. Le champ `url` suffit pour identifier une vidéo YouTube ou un jeu Steam : aucun compteur ni identifiant supplémentaire à saisir.

- Les statistiques sont récupérées automatiquement pendant chaque déploiement Netlify.
- Le navigateur affiche les derniers chiffres enregistrés, puis récupère les chiffres récents via les fonctions Netlify. Cela inclut les nouveaux projets absents des fichiers de statistiques.
- Le workflow GitHub Actions actualise également les fichiers `data/youtube-views.json` et `data/steam-reviews.json` à chaque modification des projets sur `main` et toutes les heures (selon les délais de GitHub). Le site peut lire ces fichiers directement depuis GitHub, sans attendre un nouveau déploiement.
- Si une vidéo ou un jeu est momentanément inaccessible, les derniers chiffres connus sont conservés et les autres projets continuent à être mis à jour. Un compteur inconnu reste masqué ; les avis Steam à zéro restent masqués comme auparavant.
- Les projets masqués et les liens vers d'autres plateformes sont ignorés lors de l'actualisation des fichiers.

Les vues proviennent du service Return YouTube Dislike déjà utilisé par le site ; leur disponibilité et leur fraîcheur dépendent de ce service. Les avis sont récupérés via l'API publique Steam, toutes langues et tous types d'achat confondus. Aucune clé API supplémentaire n'est nécessaire.

L'automatisation côté serveur nécessite un déploiement Netlify du dépôt avec ses fonctions et sa configuration `netlify.toml`. GitHub Actions doit être activé sur le dépôt. Une simple prévisualisation statique locale utilise les fichiers enregistrés et les copies disponibles sur GitHub.

## Vérifier ou actualiser localement

Avec Node.js 20 ou plus récent :

```sh
node --test tests/project-statistics.test.mjs
node scripts/update-youtube-views.mjs
node scripts/update-steam-reviews.mjs
```

Ces deux dernières commandes sont déjà exécutées automatiquement lors de la publication ; elles ne sont pas nécessaires à chaque ajout de projet.
