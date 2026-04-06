import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Users, Edit, Trash2, Eye, Building2 } from 'lucide-react';
import CRMService from '@/src/services/CRMService';
import { Contact } from '@/src/models/crm';
import { contactTypeDisplayLabel } from './contactUtils';

type ContactsListCardProps = {
  contacts: Contact[];
  onView: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
};

export function ContactsListCard({
  contacts,
  onView,
  onEdit,
  onDelete,
}: ContactsListCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contacts ({contacts.length})</CardTitle>
        <CardDescription>
          Manage your customer contacts and track interactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="font-medium">
                        {contact.firstName} {contact.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(() => {
                          const ev = (contact.emails || []).filter((e) =>
                            e.value.trim(),
                          );
                          if (ev.length > 0) {
                            return ev.map((e) => e.value).join(', ');
                          }
                          return contact.email?.trim() || 'No email';
                        })()}
                      </div>
                    </div>
                  </div>
                  {contact.companyId && (
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Building2 className="w-4 h-4" />
                      <span>Company ID: {contact.companyId}</span>
                    </div>
                  )}
                  {contact.jobTitle && (
                    <span className="text-sm text-gray-500">
                      {contact.jobTitle}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline">
                    {contactTypeDisplayLabel(contact)}
                  </Badge>
                  <Badge variant={contact.isActive ? 'default' : 'secondary'}>
                    {contact.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {contact.notes && (
                  <div className="text-sm text-gray-600 mt-2">
                    {contact.notes}
                  </div>
                )}
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>
                    Created: {CRMService.formatDate(contact.createdAt)}
                  </span>
                  {contact.lastContactDate && (
                    <span>
                      Last Contact:{' '}
                      {CRMService.formatDate(contact.lastContactDate)}
                    </span>
                  )}
                  {contact.nextFollowUpDate && (
                    <span>
                      Next Follow-up:{' '}
                      {CRMService.formatDate(contact.nextFollowUpDate)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onView(contact)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(contact)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(contact)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
