import type { Preview } from '@storybook/nextjs-vite'
import '../app/globals.css'

// globals.css sets body{ background:var(--carbon); color:var(--ink); ... },
// so importing it here is enough to get the site's single dark theme inside
// the Storybook canvas — no light/dark toggle to wire up (see CLAUDE.md,
// "Single dark theme by design").
const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    },

    backgrounds: { disable: true },

    layout: 'padded',
  },
};

export default preview;
