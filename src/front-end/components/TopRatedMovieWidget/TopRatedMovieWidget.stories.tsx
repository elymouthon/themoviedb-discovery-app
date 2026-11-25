import type { Meta, StoryObj } from '@storybook/react-vite';
import TopRatedMovieWidget from './TopRatedMovieWidget';

const meta = {
  title: 'Widgets/TopRatedMovieWidget',
  component: TopRatedMovieWidget,
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
    rating: {
      control: { type: 'number', min: 0, max: 10, step: 0.1 },
    },
  },
  args: {
    status: 'success',
    title: 'Fight Club',
    releaseYear: 1999,
    posterPath: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
    rating: 9.1,
  },
} satisfies Meta<typeof TopRatedMovieWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

// Nominal state: top rated movie with a demonstration rating of 9,1 / 10.
export const Nominal: Story = {};

// Movie without poster: an explicit placeholder is displayed.
export const AfficheAbsente: Story = {
  args: {
    posterPath: null,
  },
};

// Poster that cannot be loaded: the placeholder replaces it.
export const AfficheInaccessible: Story = {
  args: {
    posterPath: '/affiche-introuvable.jpg',
  },
};

// Long title and unknown release year.
export const TitreLongAnneeInconnue: Story = {
  args: {
    title:
      'Docteur Folamour ou : comment j’ai appris à ne plus m’en faire et à aimer la bombe',
    releaseYear: null,
    posterPath: null,
  },
};

// No rated movie in the catalog.
export const AucunFilmNote: Story = {
  args: {
    title: null,
    releaseYear: null,
    posterPath: null,
    rating: null,
  },
};

// Top rated movie still loading.
export const Chargement: Story = {
  args: {
    status: 'loading',
  },
};

// Top rated movie could not be loaded.
export const Erreur: Story = {
  args: {
    status: 'error',
  },
};
