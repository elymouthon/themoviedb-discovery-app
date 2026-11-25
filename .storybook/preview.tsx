import type { Preview } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router';
import '../src/front-end/global.css';
import '../src/front-end/app.css';

const preview: Preview = {
  // Toolbar control to preview components in the light and dark themes.
  globalTypes: {
    theme: {
      description: "Thème de l'application",
      toolbar: {
        title: 'Thème',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Clair' },
          { value: 'dark', title: 'Sombre' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [
    // Apply the selected theme the same way the application does.
    (Story, context) => {
      document.documentElement.dataset.theme = context.globals.theme;
      return <Story />;
    },
    // Components using links need a router context.
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default preview;
