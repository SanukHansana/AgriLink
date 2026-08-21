export type DriverAvailabilityStatus = 'offline' | 'available' | 'busy';
export type VehicleType =
  | 'motorcycle'
  | 'threeWheeler'
  | 'van'
  | 'lorry'
  | 'refrigeratedTruck'
  | 'other';
export type DeliveryJobStatus =
  | 'available'
  | 'accepted'
  | 'collecting'
  | 'inTransit'
  | 'delivered'
  | 'cancelled';

export type DriverProfile = {
  _id: string;
  user: string;
  phone: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  baseLocation: {
    city?: string;
    district: string;
  };
  availabilityStatus: DriverAvailabilityStatus;
  createdAt: string;
  updatedAt: string;
};

export type DriverProfileInput = {
  phone: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  baseLocation: {
    city?: string;
    district: string;
  };
  availabilityStatus?: DriverAvailabilityStatus;
};

export type DriverVehicle = {
  _id: string;
  driver: string;
  vehicleType: VehicleType;
  registrationNumber: string;
  make?: string;
  model?: string;
  capacityKg: number;
  isRefrigerated: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DriverVehicleInput = {
  vehicleType: VehicleType;
  registrationNumber: string;
  make?: string;
  model?: string;
  capacityKg: number;
  isRefrigerated?: boolean;
};

export type DeliveryContactLocation = {
  contactName: string;
  phone?: string;
  addressLine: string;
  city: string;
  district: string;
};

export type DeliveryPickupPoint = DeliveryContactLocation & {
  _id: string;
  sequence: number;
  notes?: string;
};

export type DeliveryOrderSummary = {
  _id: string;
  orderCode: string;
  product: string;
  quantity: number;
  unit: 'kg' | 'piece' | 'box';
  status: string;
};

export type DeliveryStatusUpdate = {
  status: DeliveryJobStatus;
  note?: string;
  recordedAt: string;
};

export type DeliveryProof = {
  photoAttached: boolean;
  receiverName?: string;
  receiverSignature?: string;
  confirmedAt?: string;
};

export type DeliveryJob = {
  _id: string;
  jobCode: string;
  createdBy: string | { _id: string; name: string };
  orders: Array<string | DeliveryOrderSummary>;
  pickupPoints: DeliveryPickupPoint[];
  destination: DeliveryContactLocation;
  cargoDescription: string;
  totalWeightKg: number;
  routeDistanceKm?: number;
  payoutAmount: number;
  scheduledPickupAt: string;
  sharedDelivery: boolean;
  status: DeliveryJobStatus;
  assignedDriver?: string | { _id: string; name: string };
  vehicle?: string | DriverVehicle;
  acceptedAt?: string;
  pickupArrivedAt?: string;
  transitStartedAt?: string;
  deliveredAt?: string;
  deliveryProof?: DeliveryProof;
  statusUpdates: DeliveryStatusUpdate[];
  createdAt: string;
  updatedAt: string;
};

export type DeliveryStatusInput = {
  status: Extract<DeliveryJobStatus, 'collecting' | 'inTransit' | 'delivered'>;
  note?: string;
  proof?: {
    photoData: string;
    receiverName: string;
    receiverSignature: string;
  };
};
