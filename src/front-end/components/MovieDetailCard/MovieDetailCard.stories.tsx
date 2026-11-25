import type { Meta, StoryObj } from '@storybook/react-vite';
import type { MovieDetails } from '../../../back-end/types/MoviesTypes';
import MovieDetailCard from './MovieDetailCard';

// Representative movie details used by the stories.
const movie: MovieDetails = {
  id: 550,
  title: 'Fight Club',
  original_title: 'Fight Club',
  original_language: 'en',
  overview:
    "Un employé de bureau insomniaque et désabusé croise la route d'un vendeur de savon charismatique. Ensemble, ils fondent un club de combat clandestin.",
  release_date: '1999-10-15',
  vote_average: 8.438,
  vote_count: 30000,
  popularity: 70.5,
  poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  backdrop_path: null,
  tagline: 'Le chaos commence ici.',
  genres: [
    { id: 18, name: 'Drame' },
    { id: 53, name: 'Thriller' },
  ],
};

const meta = {
  title: 'Components/MovieDetailCard',
  component: MovieDetailCard,
  parameters: {
    layout: 'padded',
  },
  args: {
    movie,
  },
} satisfies Meta<typeof MovieDetailCard>;

export default meta;

type Story = StoryObj<typeof meta>;

// Full movie details: poster, tagline and genres.
export const Complet: Story = {};

// Minimal movie details: no poster, tagline or genres.
export const Minimal: Story = {
  args: {
    movie: { ...movie, poster_path: null, tagline: null, genres: [] },
  },
};
