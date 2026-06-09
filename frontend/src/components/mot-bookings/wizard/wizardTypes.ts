export type MotDeliveryOption = 'drop_off' | 'wait_security' | 'wait_on_site';

export type MotWizardStep = 1 | 2 | 3 | 4 | 5;

export type MotVehicleSubStep = 'details' | 'model';

export type MotWizardVehicle = {
  registration: string;
  mileage: string;
  make: string;
  year: string;
  model: string;
};

export type MotWizardServices = {
  motInspection: boolean;
  motPrice: number;
  otherServices: string;
};

export type MotWizardDateTime = {
  deliveryOption: MotDeliveryOption | '';
  bookingDate: string;
  bookingTime: string;
};

export type MotContactConsent = {
  email: boolean;
  post: boolean;
  telephone: boolean;
  sms: boolean;
};

export type MotWizardCustomer = {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  county: string;
  telephone: string;
  houseNumber: string;
  street: string;
  town: string;
  postcode: string;
  contactConsent: MotContactConsent;
  additionalComments: string;
  privacyAccepted: boolean;
  termsAccepted: boolean;
};

export type MotWizardData = {
  vehicle: MotWizardVehicle;
  services: MotWizardServices;
  dateTime: MotWizardDateTime;
  customer: MotWizardCustomer;
};

export const MOT_TITLE_OPTIONS = ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof'];

export const MOT_WIZARD_STEPS: { step: MotWizardStep; label: string }[] = [
  { step: 1, label: 'Your Vehicle' },
  { step: 2, label: 'Services' },
  { step: 3, label: 'Date & Time' },
  { step: 4, label: 'Your Details' },
  { step: 5, label: 'Confirm' },
];

export const MOT_DELIVERY_OPTIONS: {
  value: MotDeliveryOption;
  label: string;
  description?: string;
}[] = [
  {
    value: 'drop_off',
    label: 'I will drop my vehicle off and make my own onward travel plans',
  },
  {
    value: 'wait_security',
    label: 'I would like to wait while my vehicle is in the workshop (security update)',
  },
  {
    value: 'wait_on_site',
    label: 'I would like to wait for my vehicle whilst it is in the workshop',
  },
];

export const MOT_INSPECTION_PRICE = 49;

export const MOT_HOURLY_SLOTS = Array.from({ length: 10 }, (_, i) => {
  const hour = 8 + i;
  return `${String(hour).padStart(2, '0')}:00`;
});

export function emptyMotWizardData(): MotWizardData {
  return {
    vehicle: {
      registration: '',
      mileage: '',
      make: '',
      year: '',
      model: '',
    },
    services: {
      motInspection: true,
      motPrice: MOT_INSPECTION_PRICE,
      otherServices: '',
    },
    dateTime: {
      deliveryOption: '',
      bookingDate: '',
      bookingTime: '',
    },
    customer: {
      title: '',
      firstName: '',
      lastName: '',
      email: '',
      county: '',
      telephone: '',
      houseNumber: '',
      street: '',
      town: '',
      postcode: '',
      contactConsent: { email: false, post: false, telephone: false, sms: false },
      additionalComments: '',
      privacyAccepted: false,
      termsAccepted: false,
    },
  };
}
