"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TAB_LABELS = [
  { segment: "pontuacao", label: "Pontuação" },
  { segment: "jogadores", label: "Jogadores" },
  { segment: "lives", label: "Lives" },
  { segment: "ranking", label: "Ranking" },
  { segment: "caxetao", label: "Caxetão" },
];

export function AccountTabs({ accountId }: { accountId: string }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-2 border-b border-stroke pb-3">
      {TAB_LABELS.map((tab) => {
        const href = `/admin/${accountId}/${tab.segment}`;
        // Nested routes (e.g. /caxetao/[eventId], /ranking/[periodId]) should
        // still highlight their parent tab.
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={tab.segment}
            href={href}
            className={cn("btn btn-ghost btn-sm tab-link", isActive && "is-active")}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
