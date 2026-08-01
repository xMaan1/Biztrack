'use client';

import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Search } from 'lucide-react';
import { CRMLeadFilters, PIPELINE_LABELS } from '@/src/models/crm';

type Props = {
  filters: CRMLeadFilters;
  search: string;
  pageSize: number;
  onFiltersChange: (updater: (prev: CRMLeadFilters) => CRMLeadFilters) => void;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onPageSizeChange: (size: number) => void;
};

export function LeadsListControls({
  filters,
  search,
  pageSize,
  onFiltersChange,
  onSearchChange,
  onSearch,
  onPageSizeChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={filters.sort || 'newest'}
          onValueChange={(v) => onFiltersChange((prev) => ({ ...prev, sort: v }))}
        >
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Show most recent first</SelectItem>
            <SelectItem value="oldest">Show oldest first</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="w-[80px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.pipeline || '__all__'}
          onValueChange={(v) =>
            onFiltersChange((prev) => ({
              ...prev,
              pipeline: v === '__all__' ? undefined : v,
            }))
          }
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Pipeline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All pipelines</SelectItem>
            {Object.entries(PIPELINE_LABELS).map(([v, label]) => (
              <SelectItem key={v} value={v}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 w-64 rounded-full h-9"
            placeholder="Enter search criteria..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>
        <Button size="sm" className="rounded-full" onClick={onSearch}>
          Search
        </Button>
      </div>
    </div>
  );
}
