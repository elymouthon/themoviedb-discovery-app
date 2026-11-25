import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import ThemeToggle from './ThemeToggle';

const meta = {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
  },
  args: {
    onToggle: fn(),
  },
} satisfies Meta<typeof ThemeToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

// Button shown while the light theme is active.
export const ThemeClair: Story = {
  args: {
    theme: 'light',
  },
};

// Button shown while the dark theme is active.
export const ThemeSombre: Story = {
  args: {
    theme: 'dark',
  },
};
