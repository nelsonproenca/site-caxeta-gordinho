import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ThemeToggle } from "./theme-toggle";

const meta = {
  title: "Composite/ThemeToggle",
  component: ThemeToggle,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

// Click it — toggles data-theme on <html>, which every token in
// globals.css reads through, so the whole Storybook canvas reskins.
export const Default: Story = {};
