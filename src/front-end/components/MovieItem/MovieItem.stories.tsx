import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Movie } from '../../../back-end/types/MoviesTypes';
import MovieItem from './MovieItem';

// Representative movie used by the stories.
const movie: Movie = {
  id: 550,
  title: 'Fight Club',
  original_title: 'Fight Club',
  original_language: 'en',
  overview:
    "Un employé de bureau insomniaque croise la route d'un vendeur de savon.",
  release_date: '1999-10-15',
  vote_average: 8.438,
  vote_count: 30000,
  popularity: 70.5,
  poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  backdrop_path: null,
  genre_ids: [18],
};

const meta = {
  title: 'Components/MovieItem',
  component: MovieItem,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 220 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    movie,
  },
} satisfies Meta<typeof MovieItem>;

export default meta;

type Story = StoryObj<typeof meta>;

// Movie card with its poster.
export const AvecAffiche: Story = {};

// Movie card when TMDB provides no poster.
export const SansAffiche: Story = {
  args: {
    movie: { ...movie, poster_path: '' },
  },
};
