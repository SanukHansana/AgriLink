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
  | 'cancelled'
  | 'paused'
  | 'completedWithIssues';
// Paused trips retain driver custody until administrator reassignment.

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
  latitude?: number;
  longitude?: number;
  contactName: string;
  phone?: string;
  addressLine: string;
  city: string;
  district: string;
};

export type DeliveryPickupPoint = DeliveryContactLocation & {
  completedAt?: string;
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
  orders: (string | DeliveryOrderSummary)[];
  pickupPoints: DeliveryPickupPoint[];
  destination: DeliveryContactLocation;
  dropoffPoints?: (DeliveryContactLocation & { _id: string; orders: string[]; completedAt?: string; receiverName?: string; outcome?: 'delivered' | 'failed' | 'partial'; failureReason?: string; returnCompletedAt?: string; photoAttached?: boolean })[];
  driverLocation?: { latitude: number; longitude: number; recordedAt: string };
  pauseReason?: string;
  payoutStatus?: 'unpaid' | 'onHold' | 'paid';
  paymentReference?: string;
  paidAt?: string;
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

export type DriverEarningsData = {
  summary: {
    monthEarnings: number;
    todayEarnings: number;
    totalEarnings: number;
    totalTrips: number;
    paidAmount: number;
    unpaidAmount: number;
    heldAmount: number;
  };
  weekly: {
    amount: number;
    date: string;
    label: string;
  }[];
  transactions: Pick<
      DeliveryJob,
      '_id' | 'jobCode' | 'cargoDescription' | 'payoutAmount' | 'payoutStatus' | 'paymentReference' | 'deliveredAt' | 'destination' | 'scheduledPickupAt'
    >[];
};

export type DeliveryIssueType =
  | 'delay'
  | 'vehicle'
  | 'cargo'
  | 'route'
  | 'customer'
  | 'payment'
  | 'other';
export type DeliveryIssueStatus = 'open' | 'inReview' | 'resolved';

export type DeliveryIssue = {
  _id: string;
  job: string | Pick<DeliveryJob, '_id' | 'jobCode' | 'cargoDescription' | 'status'>;
  driver: string;
  issueType: DeliveryIssueType;
  description: string;
  photoAttached: boolean;
  status: DeliveryIssueStatus;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryIssueInput = {
  jobId: string;
  issueType: DeliveryIssueType;
  description: string;
  photoData?: string;
};
