import type { Meta, StoryObj } from '@storybook/react-vite';
import MostPopularMovieWidget from './MostPopularMovieWidget';

const meta = {
  title: 'Widgets/MostPopularMovieWidget',
  component: MostPopularMovieWidget,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(340px, 90vw)' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    status: {
      control: 'inline-radio',
      options: ['loading', 'error', 'empty', 'success'],
    },
    popularity: {
      control: { type: 'number', min: 0, step: 0.01 },
    },
  },
  args: {
    status: 'success',
    title: 'Fight Club',
    releaseYear: 1999,
    posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    popularity: 1036.49,
  },
} satisfies Meta<typeof MostPopularMovieWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

// Nominal state: most popular movie with a popularity of 1 036,49.
export const Nominal: Story = {};

// Movie without poster: an explicit placeholder is displayed.
export const AfficheAbsente: Story = {
  args: {
    posterPath: null,
  },
};

// Movie whose popularity is unknown: the movie stays visible.
export const ValeurInconnue: Story = {
  args: {
    popularity: null,
  },
};

// Long title, which wraps inside the card.
export const TitreLong: Story = {
  args: {
    title: 'Le Seigneur des anneaux : Le Retour du roi – Version longue',
    releaseYear: 2003,
    posterPath: null,
  },
};

// Most popular movie still loading.
export const Chargement: Story = {
  args: {
    status: 'loading',
  },
};

// Most popular movie could not be loaded.
export const Erreur: Story = {
  args: {
    status: 'error',
  },
};
