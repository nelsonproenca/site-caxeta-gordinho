import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Field, FormGrid, Input, PhoneInput, Select, Textarea } from "./field";

const meta = {
  title: "UI/Field",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextInput: Story = {
  render: () => (
    <Field label="@tiktok" htmlFor="handle" className="max-w-xs">
      <Input id="handle" placeholder="usuario" />
    </Field>
  ),
};

export const WithHint: Story = {
  render: () => (
    <Field label="WhatsApp" htmlFor="whatsapp" hint="Opcional" className="max-w-xs">
      <PhoneInput id="whatsapp" placeholder="(11) 91234-5678" />
    </Field>
  ),
};

export const WithInfo: Story = {
  render: () => (
    <Field label="WhatsApp" htmlFor="whatsapp2" info="Usado só para chamar suplentes" className="max-w-xs">
      <Input id="whatsapp2" placeholder="(11) 91234-5678" />
    </Field>
  ),
};

export const WithError: Story = {
  render: () => (
    <Field label="@tiktok" htmlFor="handle-error" error="Já existe um jogador com esse @." className="max-w-xs">
      <Input id="handle-error" defaultValue="usuario" />
    </Field>
  ),
};

export const SelectField: Story = {
  render: () => (
    <Field label="Regra de encerramento" htmlFor="close_rule" className="max-w-xs">
      <Select id="close_rule" defaultValue="time">
        <option value="time">Por tempo</option>
        <option value="count">Por quantidade</option>
      </Select>
    </Field>
  ),
};

export const TextareaField: Story = {
  render: () => (
    <Field label="Notas" htmlFor="notes" className="max-w-xs">
      <Textarea id="notes" placeholder="Observações da live..." rows={3} />
    </Field>
  ),
};

export const Grid: Story = {
  render: () => (
    <FormGrid>
      <Field label="Data do evento" htmlFor="event_date">
        <Input id="event_date" type="date" />
      </Field>
      <Field label="Inscrições abrem" htmlFor="opens_at">
        <Input id="opens_at" type="datetime-local" />
      </Field>
      <Field label="Vagas principais" htmlFor="max_principals">
        <Input id="max_principals" type="number" min={1} />
      </Field>
    </FormGrid>
  ),
};
