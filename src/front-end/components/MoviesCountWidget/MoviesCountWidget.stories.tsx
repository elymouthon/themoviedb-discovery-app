import type { Meta, StoryObj } from '@storybook/react-vite';
import MoviesCountWidget from './MoviesCountWidget';

const meta = {
  title: 'Widgets/MoviesCountWidget',
  component: MoviesCountWidget,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 300 }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    status: {
      control: 'inline-radio',
      options: ['loading', 'error', 'empty', 'success'],
    },
  },
} satisfies Meta<typeof MoviesCountWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

// Movies released over several years.
export const AvecDonnees: Story = {
  args: {
    status: 'success',
    count: 1234,
    firstYear: 2015,
    lastYear: 2024,
  },
};

// A single movie released in a single year.
export const UnSeulFilm: Story = {
  args: {
    status: 'success',
    count: 1,
    firstYear: 2020,
    lastYear: 2020,
  },
};

// Movies whose release period is unknown.
export const SansPeriode: Story = {
  args: {
    status: 'success',
    count: 87,
  },
};

// Database loaded but without any movie.
export const Vide: Story = {
  args: {
    status: 'success',
    count: 0,
  },
};

// Count still loading.
export const Chargement: Story = {
  args: {
    status: 'loading',
  },
};

// Count could not be loaded.
export const Erreur: Story = {
  args: {
    status: 'error',
  },
};
