"use client";

import { Button } from "@/src/components/ui/button";
import { Download, Plus } from "lucide-react";
import type { LedgerTransactionsHeaderProps } from "./types";

export function LedgerTransactionsHeader({
  onExport,
  onAddTransaction,
}: LedgerTransactionsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Ledger Transactions</h1>
        <p className="text-muted-foreground">
          Manage and view all general ledger transactions
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button onClick={onAddTransaction}>
          <Plus className="h-4 w-4 mr-2" />
          New Transaction
        </Button>
      </div>
    </div>
  );
}
