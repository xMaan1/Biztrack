export interface MotRetailer {
  id: string;
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  county?: string;
  postcode: string;
  phone?: string;
  email?: string;
  is_default: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MotRetailerCreate {
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  county?: string;
  postcode: string;
  phone?: string;
  email?: string;
  is_default?: boolean;
}

export interface MotRetailerUpdate extends Partial<MotRetailerCreate> {
  is_active?: boolean;
}

export interface MotRetailersResponse {
  retailers: MotRetailer[];
  total: number;
}
