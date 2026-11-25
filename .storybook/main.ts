import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  // Stories are colocated with the components they document.
  stories: ['../src/front-end/**/*.stories.@(ts|tsx)'],
  addons: [],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
};

export default config;
