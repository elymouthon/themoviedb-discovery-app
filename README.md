# themoviedb-discovery-app

Application web de découverte de films qui s'appuie sur l'API de [The Movie Database (TMDB)](https://www.themoviedb.org/). Elle affiche les films populaires en France et permet de consulter leur fiche détaillée.

## Fonctionnalités

- Liste des films populaires, avec pagination et paramètres de langue et de région.
- Fiche détaillée pour chaque film.
- Pages « À propos » et « Page introuvable ».
- Thème clair ou sombre, conservé dans le navigateur.
- API Express intermédiaire pour appeler TMDB sans exposer le jeton dans le navigateur.

Les paramètres par défaut sont la langue `fr-FR`, la région `FR` et la première page.

## Prérequis

- Node.js 24 (version indiquée dans `.nvmrc`).
- npm.
- Un jeton d'accès à l'API TMDB. Vous pouvez en obtenir un depuis les paramètres de votre compte TMDB, dans la section API.

## Installation et démarrage

1. Installez les dépendances :

   ```sh
   npm install
   ```

2. Créez un fichier `.env` à la racine du projet et ajoutez votre jeton d'accès :

   ```dotenv
   TMDB_ACCESS_TOKEN=votre_jeton_d_acces_tmdb
   ```

   Gardez ce jeton privé et ne le publiez pas dans le dépôt.

3. Démarrez le serveur et l'application :

   ```sh
   npm run dev
   ```

4. Ouvrez [http://localhost:5173](http://localhost:5173).

Le serveur Express écoute sur le port `3000`. Vite sert l'interface sur le port `5173` et transmet les requêtes `/api` au serveur Express.

## Création de la base de données

Après l'installation des dépendances, créez et initialisez la base SQLite avec le CLI du backend :

```sh
npx tsx src/back-end/backend-cli.ts create-database
```

Par défaut, le fichier `data/movies.sqlite` est créé avec le schéma nécessaire. Pour choisir un autre emplacement, utilisez l'option `--path` :

```sh
npx tsx src/back-end/backend-cli.ts create-database --path ./data/ma-base.sqlite
```

La commande initialise le schéma sans supprimer les données d'une base existante.

## Import des films depuis un CSV

Le fichier CSV des films doit contenir exactement les colonnes suivantes, dans
n'importe quel ordre et sans distinction de casse :

```text
id,title,original_title,original_language,overview,release_date,popularity,vote_average,vote_count,poster_path,backdrop_path,runtime_minutes,budget,revenue,collected_at
```

Le fichier d'exemple [data/movies.csv](data/movies.csv) peut être importé avec :

```sh
npx tsx src/back-end/backend-cli.ts add-movies ./data/movies.csv
```

Pour utiliser une autre base SQLite, indiquez `--path` avant la sous-commande :

```sh
npx tsx src/back-end/backend-cli.ts --path ./data/custom-movies.sqlite add-movies ./data/movies.csv
```

Règles de validation :

- `id` est un entier strictement positif ; un film déjà présent est actualisé
  sans créer de doublon.
- `title`, `original_title`, `original_language`, `overview` et `collected_at`
  sont obligatoires.
- `popularity` et `vote_average` sont numériques, `vote_count` est entier.
- `runtime_minutes`, `budget` et `revenue` sont des entiers strictement positifs.
- Les champs optionnels vides sont enregistrés comme `NULL`, jamais comme zéro.

Le CSV est validé avant l'ouverture de la base et l'import est transactionnel :
en cas d'erreur, aucune donnée n'est modifiée. La commande ferme la connexion et
affiche le nombre de films importés ainsi que le chemin de la base utilisée.

## Import et nettoyage des genres

Le fichier CSV des genres doit contenir exactement les colonnes `id` et `name`.
Le fichier d'exemple [data/genres.csv](data/genres.csv) peut être importé avec :

```sh
npx tsx src/back-end/backend-cli.ts add-genres ./data/genres.csv
```

Pour utiliser une autre base SQLite, indiquez `--path` avant la sous-commande :

```sh
npx tsx src/back-end/backend-cli.ts --path ./data/custom-movies.sqlite add-genres ./data/genres.csv
```

Pour supprimer les genres qui ne sont associés à aucun film :

```sh
npx tsx src/back-end/backend-cli.ts clean-genres
```

La commande conserve les genres associés à un film et affiche le nombre de genres
importés ou supprimés ainsi que le chemin de la base utilisée.

## Import et nettoyage des pays

Le fichier CSV des pays doit contenir exactement les colonnes `code` et `name`.
Les codes sont composés de deux lettres majuscules. Le fichier d'exemple
[data/countries.csv](data/countries.csv) peut être importé avec :

```sh
npx tsx src/back-end/backend-cli.ts add-countries ./data/countries.csv
```

Pour utiliser une autre base SQLite, indiquez `--path` avant la sous-commande :

```sh
npx tsx src/back-end/backend-cli.ts --path ./data/custom-movies.sqlite add-countries ./data/countries.csv
```

Pour supprimer les pays qui ne sont associés à aucun film :

```sh
npx tsx src/back-end/backend-cli.ts clean-countries
```

La commande conserve les pays associés à un film et affiche le nombre de pays
importés ou supprimés ainsi que le chemin de la base utilisée.

## API locale

| Méthode | Route                  | Description                                                       |
| ------- | ---------------------- | ----------------------------------------------------------------- |
| `GET`   | `/api/health`          | Vérifie que le serveur répond.                                    |
| `GET`   | `/api/discover/movies` | Recherche les films TMDB par année de sortie.                     |
| `GET`   | `/api/movies/popular`  | Renvoie les films populaires.                                     |
| `GET`   | `/api/movies/:id`      | Renvoie les détails du film correspondant à son identifiant TMDB. |

Les routes des films acceptent les paramètres `language`, `page` et `region`. Exemple :

```text
/api/movies/popular?language=fr-FR&page=1&region=FR
```

Pour rechercher les films d'une année via TMDB Discover, l'année est obligatoire
et les paramètres `language`, `page` et `region` sont facultatifs :

```text
/api/discover/movies?year=2020
/api/discover/movies?year=2020&language=en-US&page=2&region=US
```

La route consulte une seule page de résultats et ne stocke pas les films dans
SQLite. L'année doit être une chaîne de quatre chiffres comprise entre `1000` et
`9999`.

## Vérifications

```sh
npm test          # Lance les tests avec la couverture
npm run test:verbose
npm run lint      # Vérifie le code
npm run fmt:check # Vérifie le formatage
```

La configuration de couverture des tests exige 100 % pour les instructions, branches, fonctions et lignes.
