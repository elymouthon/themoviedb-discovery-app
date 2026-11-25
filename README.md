# themoviedb-discovery-app

Application web de découverte de films qui s'appuie sur l'API de [The Movie Database (TMDB)](https://www.themoviedb.org/). Elle affiche les films populaires en France et permet de consulter leur fiche détaillée.

## Fonctionnalités

- Liste des films populaires, avec pagination et paramètres de langue et de région.
- Fiche détaillée pour chaque film.
- Page « Tableau de bord » des films (`/dashboard`), accessible depuis la barre
  de navigation ; elle affiche un état vide en attendant les widgets.
- Widgets « Films en base », « Durée moyenne », « Note moyenne », « Pays le plus représenté », « Film le mieux noté » et « Film le plus populaire » pour le tableau de bord, visibles dans Storybook.
- Pages « À propos » et « Page introuvable ».
- Storybook pour visualiser les composants et leurs différents états.
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

## Synchronisation des films depuis TMDB

La commande `sync-movies` met à jour la base à partir des API TMDB. Elle utilise
le jeton `TMDB_ACCESS_TOKEN` du fichier `.env` ; les autres commandes du CLI
n'en ont pas besoin.

```sh
# Films sortis en 2020, première page Discover (20 films)
npx tsx src/back-end/backend-cli.ts sync-movies --from 2020

# Films sortis de 2015 à 2024, 3 pages Discover par année
npx tsx src/back-end/backend-cli.ts sync-movies --from 2015 --to 2024 --pages 3

# Autre base SQLite et libellés en anglais
npx tsx src/back-end/backend-cli.ts --path ./data/custom-movies.sqlite sync-movies --from 2020 --language en-US
```

| Option                  | Description                                   | Défaut   |
| ----------------------- | --------------------------------------------- | -------- |
| `--from <year>`         | Année de sortie de début (obligatoire).       | -        |
| `--to <year>`           | Année de sortie de fin.                       | `--from` |
| `--pages <count>`       | Nombre de pages Discover par année (1 à 500). | `1`      |
| `--language <language>` | Langue des libellés des genres et des pays.   | `fr-FR`  |

Déroulement :

1. Les catalogues des genres (`GET /genre/movie/list`) et des pays
   (`GET /configuration/countries`) sont importés ou actualisés.
2. Pour chaque année, les pages de `GET /discover/movie` sont parcourues avec le
   filtre `primary_release_year`, jusqu'au nombre de pages demandé ou à la
   dernière page disponible.
3. Le détail de chaque film (`GET /movie/{movie_id}`) apporte la durée, le
   budget, les recettes, les genres et les pays de production.
4. Chaque page est enregistrée dans une transaction : le film est inséré ou
   actualisé avec la date d'observation, et ses genres et pays remplacent les
   associations précédentes.

Règles appliquées :

- Un film déjà présent est actualisé sans doublon ; les films des autres années
  sont conservés.
- Les durées, budgets et recettes absents ou égaux à zéro sont enregistrés comme
  `NULL` ; popularité, note et nombre de votes absents restent `NULL`.
- Un pays présent dans le détail d'un film mais absent du catalogue est créé ;
  un pays existant conserve le nom traduit du catalogue.
- Les options sont validées avant l'ouverture de la base. En cas d'erreur TMDB,
  les pages déjà enregistrées sont conservées et l'erreur est affichée.

La commande affiche l'avancement par page, puis le nombre de films, de genres et
de pays synchronisés ainsi que le chemin de la base utilisée.

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

## Storybook

[Storybook](https://storybook.js.org/) permet de visualiser les composants React de l'interface de façon isolée, dans leurs différents états, sans lancer le serveur Express ni appeler TMDB. Il servira notamment à développer et valider les widgets du tableau de bord.

### Lancer Storybook

```sh
npm run storybook        # Lance Storybook sur http://localhost:6006
npm run build-storybook  # Génère la version statique dans storybook-static/
```

La barre d'outils propose un sélecteur **Thème** pour afficher les composants en mode clair ou sombre.

### Organisation

- La configuration se trouve dans le dossier `.storybook/` :
  - `main.ts` déclare l'emplacement des stories et le framework `@storybook/react-vite`, qui réutilise la configuration Vite du projet.
  - `preview.tsx` charge les styles globaux, applique le thème choisi et fournit un `MemoryRouter` aux composants qui utilisent des liens.
- Les stories sont colocalisées avec leur composant, dans un fichier `NomDuComposant.stories.tsx`.
- Les stories sont exclues de la couverture des tests.

### Stories disponibles

| Story                            | États                                                                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `Pages/DashboardPage`            | Sans widgets                                                                                                                 |
| `Components/MovieItem`           | Avec affiche, sans affiche                                                                                                   |
| `Components/MovieDetailCard`     | Complet, minimal                                                                                                             |
| `Components/ThemeToggle`         | Thème clair, thème sombre                                                                                                    |
| `Widgets/MoviesCountWidget`      | Avec données, un seul film, sans période, vide, chargement, erreur                                                           |
| `Widgets/AverageRuntimeWidget`   | Nominal (107 min), mobile, sans données, chargement, erreur                                                                  |
| `Widgets/AverageRatingWidget`    | Nominal (6,78 / 10), note zéro, sans notes, chargement, erreur                                                               |
| `Widgets/TopCountryWidget`       | Nominal (United States of America, 725 films), nom long, aucun pays, chargement, erreur                                      |
| `Widgets/TopRatedMovieWidget`    | Nominal (9,1 / 10), affiche absente, affiche inaccessible, titre long et année inconnue, aucun film noté, chargement, erreur |
| `Widgets/MostPopularMovieWidget` | Nominal (1 036,49 popularité), affiche absente, valeur inconnue, titre long, chargement, erreur                              |

### Widgets du tableau de bord

Les widgets s'appuient sur le composant commun `DashboardWidget` (`src/front-end/components/DashboardWidget/`). Il affiche le titre du widget et gère ses états grâce à la propriété `status` :

| `status`  | Affichage                                                   |
| --------- | ----------------------------------------------------------- |
| `loading` | Message « Chargement… » annoncé aux lecteurs d'écran.       |
| `error`   | Message d'erreur (`errorMessage`) annoncé comme une alerte. |
| `empty`   | Message d'absence de données (`emptyMessage`).              |
| `success` | Contenu propre au widget.                                   |

Pour afficher leur contenu, les widgets utilisent les classes communes `dashboard-widget-value` (valeur principale), `dashboard-widget-label` (texte principal, comme un nom de pays, qui passe à la ligne s'il est long), `dashboard-widget-unit` (unité) et `dashboard-widget-caption` (précision sous la valeur), définies dans `DashboardWidget.css`.

Les widgets qui mettent un film en avant utilisent le composant commun `MovieHighlight` (`src/front-end/components/MovieHighlight/`). Il affiche l'affiche du film (ou un remplacement explicite si elle est absente ou ne se charge pas), son titre, son année de sortie (ou « Année inconnue ») et l'indicateur propre au widget.

Widgets disponibles :

- **Films en base** (`MoviesCountWidget`) : nombre de films enregistrés et période de sortie couverte (`count`, `firstYear`, `lastYear`). Un chargement réussi sans aucun film affiche l'état vide.
- **Durée moyenne** (`AverageRuntimeWidget`) : durée moyenne des films, en minutes.

  | Propriété        | Type                            | Description                                                                                        |
  | ---------------- | ------------------------------- | -------------------------------------------------------------------------------------------------- |
  | `status`         | `WidgetStatus`                  | État d'affichage du widget.                                                                        |
  | `averageRuntime` | `number` ou `null`, facultative | Durée moyenne en minutes, calculée sur les durées valides uniquement et arrondie à la minute près. |

  Une durée absente, nulle, négative ou invalide n'est jamais affichée comme zéro : le widget affiche son état vide.

- **Note moyenne** (`AverageRatingWidget`) : moyenne simple des notes TMDB des films, sur une échelle de 0 à 10.

  | Propriété          | Type                            | Description                                                                                                                                                                                                                              |
  | ------------------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `status`           | `WidgetStatus`                  | État d'affichage du widget.                                                                                                                                                                                                              |
  | `averageRating`    | `number` ou `null`, facultative | Moyenne simple (non pondérée) des notes, calculée sur l'ensemble des films notés du catalogue et non par le composant. Elle est affichée au format français avec deux décimales, suivie de l'échelle `/ 10` (par exemple « 6,78 / 10 »). |
  | `ratedMoviesCount` | `number`, facultative           | Nombre de films notés pris en compte, affiché sous la note.                                                                                                                                                                              |

  Une note de zéro est affichée comme une note (« 0,00 / 10 »). Une note absente, hors de l'échelle 0 à 10 ou invalide affiche l'état vide. La mention « Moyenne simple » distingue cette note de la note pondérée.

- **Pays le plus représenté** (`TopCountryWidget`) : pays de production associé au plus grand nombre de films, avec son nombre de films.

  | Propriété     | Type                            | Description                                                                                                                                                                                                                        |
  | ------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `status`      | `WidgetStatus`                  | État d'affichage du widget.                                                                                                                                                                                                        |
  | `countryName` | `string` ou `null`, facultative | Nom du pays le plus représenté, affiché en entier : un nom long passe à la ligne.                                                                                                                                                  |
  | `movieCount`  | `number` ou `null`, facultative | Nombre de films associés au pays, affiché tel qu'il est fourni avec l'unité « films ». Un film coproduit par plusieurs pays est compté pour chacun d'eux par la source de données ; le composant ne recompte pas ces associations. |

  Sans nom de pays, ou avec un nombre de films absent, nul ou invalide, le widget affiche l'état vide.

- **Film le mieux noté** (`TopRatedMovieWidget`) : affiche, titre, année et note du film le mieux noté, tels qu'ils sont fournis.

  | Propriété     | Type                            | Description                                                                                                      |
  | ------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
  | `status`      | `WidgetStatus`                  | État d'affichage du widget.                                                                                      |
  | `title`       | `string` ou `null`, facultative | Titre du film, affiché en entier : un titre long passe à la ligne.                                               |
  | `releaseYear` | `number` ou `null`, facultative | Année de sortie ; « Année inconnue » est affiché lorsqu'elle est absente.                                        |
  | `posterPath`  | `string` ou `null`, facultative | Chemin TMDB de l'affiche (par exemple `/abc.jpg`).                                                               |
  | `rating`      | `number` ou `null`, facultative | Note TMDB du film, affichée au format français avec une décimale et l'échelle `/ 10` (par exemple « 9,1 / 10 »). |

  Sans titre, ou avec une note absente, hors de l'échelle 0 à 10 ou invalide, le widget affiche l'état « Aucun film noté ». Une affiche absente ou qui ne se charge pas est remplacée par un cadre « Affiche indisponible », annoncé aux lecteurs d'écran.

- **Film le plus populaire** (`MostPopularMovieWidget`) : affiche, titre, année et indice de popularité TMDB du film le plus populaire, tels qu'ils sont fournis.

  | Propriété     | Type                            | Description                                                                                                                                   |
  | ------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
  | `status`      | `WidgetStatus`                  | État d'affichage du widget.                                                                                                                   |
  | `title`       | `string` ou `null`, facultative | Titre du film, affiché en entier : un titre long passe à la ligne.                                                                            |
  | `releaseYear` | `number` ou `null`, facultative | Année de sortie ; « Année inconnue » est affiché lorsqu'elle est absente.                                                                     |
  | `posterPath`  | `string` ou `null`, facultative | Chemin TMDB de l'affiche (par exemple `/abc.jpg`).                                                                                            |
  | `popularity`  | `number` ou `null`, facultative | Indice de popularité TMDB, affiché au format français avec deux décimales et le libellé « popularité » (par exemple « 1 036,49 popularité »). |

  L'indice de popularité n'a pas de maximum : il n'est présenté ni comme une note sur 10 ni comme un nombre de votes. Une popularité absente, négative ou invalide est affichée « Popularité inconnue », sans masquer le film. Sans titre, le widget affiche l'état vide.

### Tester les stories

Les stories peuvent être rendues dans les tests Vitest avec `composeStories`, qui leur applique la configuration de `.storybook/preview.tsx`. Ces tests sont placés dans un fichier `NomDuComposant.stories.test.tsx` :

```tsx
import { composeStories } from '@storybook/react-vite';
import preview from '../../../../.storybook/preview';
import * as stories from './MonWidget.stories';

const { AvecDonnees } = composeStories(stories, preview);

render(<AvecDonnees />);
```

### Ajouter une story

Créer un fichier `NomDuComposant.stories.tsx` à côté du composant, puis déclarer une story par état à visualiser :

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import MonWidget from './MonWidget';

const meta = {
  title: 'Widgets/MonWidget',
  component: MonWidget,
} satisfies Meta<typeof MonWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Chargement: Story = { args: { loading: true } };
export const AvecDonnees: Story = { args: { value: 42 } };
```

## Vérifications

```sh
npm test          # Lance les tests avec la couverture
npm run test:verbose
npm run lint      # Vérifie le code
npm run fmt:check # Vérifie le formatage
```

La configuration de couverture des tests exige 100 % pour les instructions, branches, fonctions et lignes.
