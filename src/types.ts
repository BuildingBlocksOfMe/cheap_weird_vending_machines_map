export type VendingMachineType = 'cheap' | 'weird';

export interface VendingMachine {
  id: number;
  lat: number;
  lng: number;
  type: VendingMachineType;
  price?: number;
  description?: string;
  image_path?: string;
  created_at?: string;
}
