import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import { Filter, Search } from 'lucide-react';
import { ContactType, CRMContactFilters } from '@/src/models/crm';

type ContactsFiltersCardProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  filters: CRMContactFilters;
  setFilters: React.Dispatch<React.SetStateAction<CRMContactFilters>>;
  onResetFilters: () => void;
};

export function ContactsFiltersCard({
  search,
  onSearchChange,
  onSearchSubmit,
  filters,
  setFilters,
  onResetFilters,
}: ContactsFiltersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="w-4 h-4 mr-2" />
          Filters & Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Search</label>
            <div className="flex space-x-2">
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onSearchSubmit()}
              />
              <Button onClick={onSearchSubmit}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Type</label>
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) =>
                setFilters((prev: CRMContactFilters) => ({
                  ...prev,
                  type: value === 'all' ? undefined : (value as ContactType),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.values(ContactType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={onResetFilters}>
              Reset Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
