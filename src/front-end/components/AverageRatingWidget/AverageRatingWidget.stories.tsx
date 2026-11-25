import type { Meta, StoryObj } from '@storybook/react-vite';
import AverageRatingWidget from './AverageRatingWidget';

const meta = {
  title: 'Widgets/AverageRatingWidget',
  component: AverageRatingWidget,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(300px, 90vw)' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    status: {
      control: 'inline-radio',
      options: ['loading', 'error', 'empty', 'success'],
    },
    averageRating: {
      control: { type: 'number', min: 0, max: 10, step: 0.01 },
    },
  },
} satisfies Meta<typeof AverageRatingWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

// Nominal state: simple average rating of 6,78 / 10.
export const Nominal: Story = {
  args: {
    status: 'success',
    averageRating: 6.78,
    ratedMoviesCount: 1234,
  },
};

// A rating of zero is displayed, unlike a missing rating.
export const NoteZero: Story = {
  args: {
    status: 'success',
    averageRating: 0,
    ratedMoviesCount: 3,
  },
};

// No rated movie in the catalog.
export const SansNotes: Story = {
  args: {
    status: 'success',
    averageRating: null,
  },
};

// Average rating still loading.
export const Chargement: Story = {
  args: {
    status: 'loading',
  },
};

// Average rating could not be loaded.
export const Erreur: Story = {
  args: {
    status: 'error',
  },
};
