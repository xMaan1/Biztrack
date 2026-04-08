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
import {
  ContactType,
  CRMContactFilters,
  Industry,
} from '@/src/models/crm';
import { User } from '@/src/models';

function assigneeLabel(u: User): string {
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  if (name) return name;
  return u.userName || u.email || (u.id || u.userId || '');
}

const MONTHS = [
  { value: 'all', label: 'Any month' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

type ContactsFiltersCardProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  filters: CRMContactFilters;
  setFilters: React.Dispatch<React.SetStateAction<CRMContactFilters>>;
  onResetFilters: () => void;
  users: User[];
};

export function ContactsFiltersCard({
  search,
  onSearchChange,
  onSearchSubmit,
  filters,
  setFilters,
  onResetFilters,
  users,
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium">Search</label>
            <div className="flex space-x-2">
              <Input
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
              />
              <Button type="button" onClick={onSearchSubmit}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
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
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {Object.values(ContactType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Industry</label>
            <Select
              value={filters.industry || 'all'}
              onValueChange={(value) =>
                setFilters((prev: CRMContactFilters) => ({
                  ...prev,
                  industry: value === 'all' ? undefined : (value as Industry),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All industries</SelectItem>
                {Object.values(Industry).map((ind) => (
                  <SelectItem key={ind} value={ind}>
                    {ind
                      .split('_')
                      .map(
                        (w) =>
                          w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
                      )
                      .join(' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Website contains</label>
            <Input
              placeholder="Filter by website URL..."
              value={filters.website || ''}
              onChange={(e) =>
                setFilters((prev: CRMContactFilters) => ({
                  ...prev,
                  website: e.target.value || undefined,
                }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Birthday month</label>
            <Select
              value={
                filters.birthdayMonth != null
                  ? String(filters.birthdayMonth)
                  : 'all'
              }
              onValueChange={(value) =>
                setFilters((prev: CRMContactFilters) => ({
                  ...prev,
                  birthdayMonth:
                    value === 'all' ? undefined : parseInt(value, 10),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Any month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Country</label>
            <Input
              placeholder="Address country..."
              value={filters.country || ''}
              onChange={(e) =>
                setFilters((prev: CRMContactFilters) => ({
                  ...prev,
                  country: e.target.value || undefined,
                }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Assignee</label>
            <Select
              value={filters.assignedTo || 'all'}
              onValueChange={(value) =>
                setFilters((prev: CRMContactFilters) => ({
                  ...prev,
                  assignedTo: value === 'all' ? undefined : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All assignees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assignees</SelectItem>
                {users.map((u) => {
                  const id = u.id || u.userId;
                  if (!id) return null;
                  return (
                    <SelectItem key={id} value={id}>
                      {assigneeLabel(u)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="button" variant="outline" onClick={onResetFilters}>
              Reset Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
