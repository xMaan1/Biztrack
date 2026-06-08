'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import motRetailerService from '@/src/services/MotRetailerService';
import motBookingService from '@/src/services/MotBookingService';
import type { MotRetailer } from '@/src/models/workshop/MotRetailer';
import type { MotVehicleSubStep, MotWizardData, MotWizardStep } from '@/src/components/workshop/mot-bookings/wizard/wizardTypes';
import { emptyMotWizardData } from '@/src/components/workshop/mot-bookings/wizard/wizardTypes';
import {
  bookingToWizardData,
  clearWizardDraft,
  isCustomerDetailsComplete,
  isDateTimeComplete,
  isRetailerComplete,
  isServicesComplete,
  isVehicleDetailsComplete,
  isVehicleModelComplete,
  loadWizardDraft,
  retailerToWizard,
  saveWizardDraft,
  wizardDataToBookingPayload,
  wizardRetailerToPayload,
} from '@/src/components/workshop/mot-bookings/wizard/wizardUtils';

export function useMotBookingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const amendId = searchParams.get('amend');

  const [currentStep, setCurrentStep] = useState<MotWizardStep>(1);
  const [vehicleSubStep, setVehicleSubStep] = useState<MotVehicleSubStep>('details');
  const [data, setData] = useState<MotWizardData>(emptyMotWizardData());
  const [savedRetailers, setSavedRetailers] = useState<MotRetailer[]>([]);
  const [savingRetailer, setSavingRetailer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [amendBookingId, setAmendBookingId] = useState<string | null>(null);

  const maxAvailableStep = useMemo(() => {
    if (!isVehicleModelComplete(data)) return 1;
    if (!isRetailerComplete(data)) return 2;
    if (!isServicesComplete(data)) return 3;
    if (!isDateTimeComplete(data)) return 4;
    if (!isCustomerDetailsComplete(data)) return 5;
    return 6;
  }, [data]);

  const fetchRetailers = useCallback(async (applyDefault = false) => {
    try {
      const response = await motRetailerService.getRetailers();
      const retailers = response.retailers || [];
      setSavedRetailers(retailers);
      if (applyDefault) {
        const defaultRetailer = retailers.find((r) => r.is_default);
        if (defaultRetailer) {
          setData((prev) => {
            if (prev.retailer.id || prev.retailer.name) return prev;
            return { ...prev, retailer: retailerToWizard(defaultRetailer) };
          });
        }
      }
    } catch {
      setSavedRetailers([]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (amendId) {
        try {
          const booking = await motBookingService.getBooking(amendId);
          setData(bookingToWizardData(booking));
          setAmendBookingId(amendId);
          setCurrentStep(6);
          setVehicleSubStep('model');
        } catch {
          setData(emptyMotWizardData());
        }
        await fetchRetailers(false);
        setLoading(false);
        return;
      }

      const draft = loadWizardDraft();
      if (draft) {
        setData(draft.data);
        setCurrentStep(Math.min(draft.step, 6) as MotWizardStep);
        setVehicleSubStep(draft.vehicleSubStep === 'model' ? 'model' : 'details');
      }
      await fetchRetailers(!draft);
      setLoading(false);
    };
    init();
  }, [amendId, fetchRetailers]);

  useEffect(() => {
    if (!loading) {
      saveWizardDraft(data, currentStep, vehicleSubStep);
    }
  }, [data, currentStep, vehicleSubStep, loading]);

  const updateVehicle = useCallback((patch: Partial<MotWizardData['vehicle']>) => {
    setData((prev) => ({ ...prev, vehicle: { ...prev.vehicle, ...patch } }));
  }, []);

  const updateRetailer = useCallback((patch: Partial<MotWizardData['retailer']>) => {
    setData((prev) => ({ ...prev, retailer: { ...prev.retailer, ...patch } }));
  }, []);

  const updateServices = useCallback((patch: Partial<MotWizardData['services']>) => {
    setData((prev) => ({ ...prev, services: { ...prev.services, ...patch } }));
  }, []);

  const updateDateTime = useCallback((patch: Partial<MotWizardData['dateTime']>) => {
    setData((prev) => ({ ...prev, dateTime: { ...prev.dateTime, ...patch } }));
  }, []);

  const updateCustomer = useCallback((patch: Partial<MotWizardData['customer']>) => {
    setData((prev) => ({ ...prev, customer: { ...prev.customer, ...patch } }));
  }, []);

  const updateContactConsent = useCallback(
    (patch: Partial<MotWizardData['customer']['contactConsent']>) => {
      setData((prev) => ({
        ...prev,
        customer: {
          ...prev.customer,
          contactConsent: { ...prev.customer.contactConsent, ...patch },
        },
      }));
    },
    [],
  );

  const goToStep = useCallback(
    (step: MotWizardStep) => {
      if (step > 6) return;
      setCurrentStep(step);
      if (step === 1) {
        setVehicleSubStep(isVehicleDetailsComplete(data) ? 'model' : 'details');
      }
    },
    [data],
  );

  const confirmVehicleDetails = useCallback(() => {
    if (!isVehicleDetailsComplete(data)) return;
    setVehicleSubStep('model');
  }, [data]);

  const completeVehicleStep = useCallback(() => {
    if (!isVehicleModelComplete(data)) return;
    setCurrentStep(2);
  }, [data]);

  const selectSavedRetailer = useCallback((retailer: MotRetailer) => {
    setData((prev) => ({ ...prev, retailer: retailerToWizard(retailer) }));
  }, []);

  const saveRetailer = useCallback(
    async (setAsDefault: boolean) => {
      if (!isRetailerComplete(data)) return;
      setSavingRetailer(true);
      try {
        const payload = wizardRetailerToPayload(data.retailer, setAsDefault);
        let saved: MotRetailer;
        if (data.retailer.id) {
          saved = await motRetailerService.updateRetailer(data.retailer.id, payload);
        } else {
          saved = await motRetailerService.createRetailer(payload);
        }
        if (setAsDefault && saved.id) {
          saved = await motRetailerService.setDefaultRetailer(saved.id);
        }
        setData((prev) => ({ ...prev, retailer: retailerToWizard(saved) }));
        await fetchRetailers();
      } catch {
      } finally {
        setSavingRetailer(false);
      }
    },
    [data, fetchRetailers],
  );

  const openPrivacyModal = useCallback(() => {
    if (!isCustomerDetailsComplete(data)) return;
    setPrivacyModalOpen(true);
  }, [data]);

  const confirmPrivacyAndGoToStep6 = useCallback(() => {
    setPrivacyModalOpen(false);
    setCurrentStep(6);
  }, []);

  const submitBooking = useCallback(async () => {
    setConfirming(true);
    try {
      const payload = wizardDataToBookingPayload(data);
      let booking;
      if (amendBookingId) {
        booking = await motBookingService.updateBooking(amendBookingId, payload);
      } else {
        booking = await motBookingService.createBooking(payload);
      }
      clearWizardDraft();
      router.push(`/workshop-management/mot-bookings/${booking.id}/confirmation`);
    } catch {
    } finally {
      setConfirming(false);
    }
  }, [amendBookingId, data, router]);

  const handlePrimaryNext = useCallback(() => {
    if (currentStep === 1) {
      if (vehicleSubStep === 'details') confirmVehicleDetails();
      else completeVehicleStep();
      return;
    }
    if (currentStep === 2 && isRetailerComplete(data)) {
      setCurrentStep(3);
      return;
    }
    if (currentStep === 3 && isServicesComplete(data)) {
      setCurrentStep(4);
      return;
    }
    if (currentStep === 4 && isDateTimeComplete(data)) {
      setCurrentStep(5);
      return;
    }
    if (currentStep === 5 && isCustomerDetailsComplete(data)) {
      openPrivacyModal();
    }
  }, [
    currentStep,
    vehicleSubStep,
    data,
    confirmVehicleDetails,
    completeVehicleStep,
    openPrivacyModal,
  ]);

  const canPrimaryNext = useMemo(() => {
    if (currentStep === 1) {
      return vehicleSubStep === 'details'
        ? isVehicleDetailsComplete(data)
        : isVehicleModelComplete(data);
    }
    if (currentStep === 2) return isRetailerComplete(data);
    if (currentStep === 3) return isServicesComplete(data);
    if (currentStep === 4) return isDateTimeComplete(data);
    if (currentStep === 5) return isCustomerDetailsComplete(data);
    return false;
  }, [currentStep, vehicleSubStep, data]);

  const primaryNextLabel = useMemo(() => {
    if (currentStep === 1 && vehicleSubStep === 'details') return 'Confirm';
    if (currentStep === 4) return 'Continue to Step 5';
    if (currentStep === 5) return 'Next Step';
    return 'Next Step';
  }, [currentStep, vehicleSubStep]);

  const showSidebarNext = currentStep >= 1 && currentStep <= 5;

  return {
    loading,
    currentStep,
    vehicleSubStep,
    data,
    savedRetailers,
    savingRetailer,
    confirming,
    privacyModalOpen,
    setPrivacyModalOpen,
    maxAvailableStep,
    canPrimaryNext,
    primaryNextLabel,
    showSidebarNext,
    updateVehicle,
    updateRetailer,
    updateServices,
    updateDateTime,
    updateCustomer,
    updateContactConsent,
    goToStep,
    confirmVehicleDetails,
    completeVehicleStep,
    selectSavedRetailer,
    saveRetailer,
    handlePrimaryNext,
    confirmPrivacyAndGoToStep6,
    submitBooking,
    setVehicleSubStep,
    setCurrentStep,
  };
}
