import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "select",
      options: ["purple", "green", "red", "yellow", "neutral"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Green: Story = { args: { variant: "green", children: "Confirmado" } };
export const Yellow: Story = { args: { variant: "yellow", children: "Suplente" } };
export const Red: Story = { args: { variant: "red", children: "Cancelado" } };
export const Purple: Story = { args: { variant: "purple", children: "Chamado" } };
export const Neutral: Story = { args: { variant: "neutral", children: "Agendado" } };

// prd.md §9's status mapping: green=Confirmado, yellow=Suplente, red=Eliminado,
// purple=Campeão, neutral=sem status — every variant side by side.
export const AllVariants: Story = {
  args: { children: "" },
  render: () => (
    <div className="flex gap-3">
      <Badge variant="green">Confirmado</Badge>
      <Badge variant="yellow">Suplente</Badge>
      <Badge variant="red">Cancelado</Badge>
      <Badge variant="purple">Chamado</Badge>
      <Badge variant="neutral">Agendado</Badge>
    </div>
  ),
};
