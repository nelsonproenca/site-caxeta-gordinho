import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, TableWrap } from "./table";

const meta = {
  title: "UI/Table",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const rows = [
  { pos: "01", name: "Fulano da Silva", handle: "fulano", points: 42 },
  { pos: "02", name: "Ciclana Souza", handle: "ciclana", points: 37 },
  { pos: "03", name: "Beltrano Costa", handle: "beltrano", points: -3 },
];

export const RankingTable: Story = {
  render: () => (
    <TableWrap>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Pos</TableHeaderCell>
            <TableHeaderCell>Jogador</TableHeaderCell>
            <TableHeaderCell>Pontos</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.handle}>
              <TableCell className="pos-cell">{r.pos}</TableCell>
              <TableCell className="driver-cell">
                {r.name} <span className="text-titanium">(@{r.handle})</span>
              </TableCell>
              <TableCell className="mono-data">{r.points > 0 ? `+${r.points}` : r.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableWrap>
  ),
};
