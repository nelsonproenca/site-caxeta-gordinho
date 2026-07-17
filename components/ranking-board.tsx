import type { RankingEntry } from "@/lib/scoring/get-ranking";
import { TableWrap, Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@/components/ui/table";

export function RankingBoard({ ranking }: { ranking: RankingEntry[] }) {
  if (ranking.length === 0) {
    return <p className="text-ink-dim">Ainda sem resultados registrados.</p>;
  }

  const podium = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <div className="flex flex-col gap-6">
      <div className="podium">
        {podium.map((entry, index) => (
          <div key={entry.playerId} className={`podium-spot rank-${index + 1}`}>
            <div className="podium-number">{index + 1}</div>
            <div className="podium-name">{entry.displayName}</div>
            <div className="podium-handle">@{entry.tiktokHandle}</div>
            <div className="podium-points">{entry.totalPoints}</div>
          </div>
        ))}
      </div>

      {rest.length > 0 && (
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
              {rest.map((entry, index) => (
                <TableRow key={entry.playerId}>
                  <TableCell className="pos-cell">{String(index + 4).padStart(2, "0")}</TableCell>
                  <TableCell className="driver-cell">
                    {entry.displayName} <span className="text-titanium">(@{entry.tiktokHandle})</span>
                  </TableCell>
                  <TableCell className="mono-data">{entry.totalPoints}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrap>
      )}
    </div>
  );
}
