import type { Meta, StoryObj } from '@storybook/react-vite';
import DashboardPage from './DashboardPage';

const meta = {
  title: 'Pages/DashboardPage',
  component: DashboardPage,
} satisfies Meta<typeof DashboardPage>;

export default meta;

type Story = StoryObj<typeof meta>;

// Dashboard page before any widget is available: explicit empty state.
export const SansWidgets: Story = {};
