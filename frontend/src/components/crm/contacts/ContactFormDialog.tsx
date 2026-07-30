'use client';

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Alert, AlertDescription } from '@/src/components/ui/alert';
import { Label } from '@/src/components/ui/label';
import { Camera } from 'lucide-react';
import { Contact, ContactCreate } from '@/src/models/crm';
import FileUploadService from '@/src/services/FileUploadService';
import { CustomOption } from '@/src/services/CustomOptionsService';
import { ContactFormCoreFields } from './contact-form/ContactFormCoreFields';
import { ContactFormNotesSection } from './contact-form/ContactFormNotesSection';
import { ContactFormAdditionalSection } from './contact-form/ContactFormAdditionalSection';
import { ContactFormAddressesSection } from './contact-form/ContactFormAddressesSection';
import { ContactFormSocialSection } from './contact-form/ContactFormSocialSection';
import { ContactFormAttachmentsSection } from './contact-form/ContactFormAttachmentsSection';
import { User } from '@/src/models';
import { type UserSearchItem } from '@/src/components/ui/user-search';

type CompanyOption = { id: string; name: string };

type ContactFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingContact: Contact | null;
  formData: ContactCreate;
  setFormData: React.Dispatch<React.SetStateAction<ContactCreate>>;
  companies: CompanyOption[];
  customContactTypes: CustomOption[];
  onRequestCustomContactType: () => void;
  users: User[];
  selectedAssignee: UserSearchItem | null;
  openAdditional: boolean;
  onToggleAdditional: () => void;
  openAddresses: boolean;
  onToggleAddresses: () => void;
  openContactDetails: boolean;
  onToggleContactDetails: () => void;
  errorMessage: string;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  onCancel: () => void;
  attachmentFileInputRef: React.RefObject<HTMLInputElement | null>;
  onAttachmentFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  attachmentUploading: boolean;
  onRemoveAttachment: (index: number) => void;
};

export function ContactFormDialog({
  open,
  onOpenChange,
  editingContact,
  formData,
  setFormData,
  companies,
  customContactTypes,
  onRequestCustomContactType,
  users,
  selectedAssignee,
  openAdditional,
  onToggleAdditional,
  openAddresses,
  onToggleAddresses,
  openContactDetails,
  onToggleContactDetails,
  errorMessage,
  onSubmit,
  submitting,
  onCancel,
  attachmentFileInputRef,
  onAttachmentFile,
  attachmentUploading,
  onRemoveAttachment,
}: ContactFormDialogProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const contactPhotoInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setPhotoPreview(formData.image_url || null);
  }, [formData.image_url, open]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setPhotoUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
      const res = await FileUploadService.uploadImage(file);
      setFormData((prev) => ({ ...prev, image_url: res.file_url }));
    } catch {
      // keep local preview visible even if upload fails
    } finally {
      setPhotoUploading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingContact ? 'Edit Contact' : 'Create New Contact'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-4 pb-4 border-b">
            <div
              className="w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center bg-muted cursor-pointer overflow-hidden shrink-0"
              onClick={() => contactPhotoInputRef.current?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Profile photo (optional)</Label>
              <input
                ref={contactPhotoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => contactPhotoInputRef.current?.click()} disabled={photoUploading}>
                {photoUploading ? 'Uploading...' : 'Choose image'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ContactFormCoreFields
              formData={formData}
              setFormData={setFormData}
              companies={companies}
              customContactTypes={customContactTypes}
              onRequestCustomContactType={onRequestCustomContactType}
              users={users}
              selectedAssignee={selectedAssignee}
            />

            <ContactFormNotesSection
              formData={formData}
              setFormData={setFormData}
            />

            <ContactFormAdditionalSection
              formData={formData}
              setFormData={setFormData}
              open={openAdditional}
              onToggle={onToggleAdditional}
            />

            <ContactFormAddressesSection
              formData={formData}
              setFormData={setFormData}
              open={openAddresses}
              onToggle={onToggleAddresses}
            />

            <ContactFormSocialSection
              formData={formData}
              setFormData={setFormData}
              open={openContactDetails}
              onToggle={onToggleContactDetails}
            />

            <ContactFormAttachmentsSection
              formData={formData}
              attachmentFileInputRef={attachmentFileInputRef}
              onAttachmentFile={onAttachmentFile}
              attachmentUploading={attachmentUploading}
              onRemoveAttachment={onRemoveAttachment}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? 'Saving...'
                : editingContact
                  ? 'Update Contact'
                  : 'Create Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
