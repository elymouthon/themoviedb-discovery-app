import type { Meta, StoryObj } from '@storybook/react-vite';
import AverageRuntimeWidget from './AverageRuntimeWidget';

const meta = {
  title: 'Widgets/AverageRuntimeWidget',
  component: AverageRuntimeWidget,
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
    averageRuntime: {
      control: 'number',
    },
  },
} satisfies Meta<typeof AverageRuntimeWidget>;

export default meta;

type Story = StoryObj<typeof meta>;

// Nominal state: average runtime of 107 minutes.
export const Nominal: Story = {
  args: {
    status: 'success',
    averageRuntime: 107,
  },
};

// Nominal state displayed on a mobile screen.
export const Mobile: Story = {
  args: {
    status: 'success',
    averageRuntime: 107,
  },
  globals: {
    viewport: { value: 'mobile1', isRotated: false },
  },
};

// No movie with a known runtime.
export const SansDonnees: Story = {
  args: {
    status: 'success',
    averageRuntime: null,
  },
};

// Average runtime still loading.
export const Chargement: Story = {
  args: {
    status: 'loading',
  },
};

// Average runtime could not be loaded.
export const Erreur: Story = {
  args: {
    status: 'error',
  },
};
