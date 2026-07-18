import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RankingBoard } from "./ranking-board";
import type { RankingEntry } from "@/lib/scoring/get-ranking";

const mockRanking: RankingEntry[] = [
  { playerId: "1", displayName: "Fulano da Silva", tiktokHandle: "fulano", totalPoints: 42, positiveResults: 15 },
  { playerId: "2", displayName: "Ciclana Souza", tiktokHandle: "ciclana", totalPoints: 37, positiveResults: 13 },
  { playerId: "3", displayName: "Beltrano Costa", tiktokHandle: "beltrano", totalPoints: 29, positiveResults: 10 },
  { playerId: "4", displayName: "Sicrano Lima", tiktokHandle: "sicrano", totalPoints: 18, positiveResults: 7 },
  { playerId: "5", displayName: "Fulaninha Alves", tiktokHandle: "fulaninha", totalPoints: 12, positiveResults: 5 },
  { playerId: "6", displayName: "Zé Pereira", tiktokHandle: "zepereira", totalPoints: -4, positiveResults: 1 },
];

const meta = {
  title: "Composite/RankingBoard",
  component: RankingBoard,
  parameters: { layout: "padded" },
} satisfies Meta<typeof RankingBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithResults: Story = { args: { ranking: mockRanking } };
export const Empty: Story = { args: { ranking: [] } };
