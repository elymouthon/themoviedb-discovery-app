import type { Meta, StoryObj } from '@storybook/react-vite';
import TopCountryWidget from './TopCountryWidget';

const meta = {
  title: 'Widgets/TopCountryWidget',
  component: TopCountryWidget,
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
  },
} satisfies Meta<typeof TopCountryWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

// Nominal state: United States of America with 725 movies.
export const Nominal: Story = {
  args: {
    status: 'success',
    countryName: 'United States of America',
    movieCount: 725,
  },
};

// Country with a long name, which wraps inside the card.
export const NomLong: Story = {
  args: {
    status: 'success',
    countryName: 'United Kingdom of Great Britain and Northern Ireland',
    movieCount: 312,
  },
};

// No known production country.
export const AucunPays: Story = {
  args: {
    status: 'success',
    countryName: null,
    movieCount: null,
  },
};

// Most represented country still loading.
export const Chargement: Story = {
  args: {
    status: 'loading',
  },
};

// Most represented country could not be loaded.
export const Erreur: Story = {
  args: {
    status: 'error',
  },
};
