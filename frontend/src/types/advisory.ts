export type OfficerSpecialization =
  | 'cropProduction'
  | 'soilManagement'
  | 'pestManagement'
  | 'qualityCertification'
  | 'marketDevelopment'
  | 'generalAgriculture';

export type AssistanceRequestCategory =
  | 'farmerRegistration'
  | 'qualityCertification'
  | 'fertilizerSubsidy'
  | 'cropGuidance'
  | 'marketGuidance'
  | 'other';

export type AssistanceRequestPriority = 'low' | 'medium' | 'high';
export type AssistanceRequestStatus =
  | 'pending'
  | 'inReview'
  | 'approved'
  | 'revisionRequired'
  | 'rejected'
  | 'resolved';
export type OfficialResponseType =
  | 'approved'
  | 'approvedAndScheduled'
  | 'revisionRequired'
  | 'rejected'
  | 'information';

export type AdvisoryUser = {
  _id: string;
  name: string;
  email: string;
};

export type OfficerProfile = {
  _id: string;
  user: AdvisoryUser;
  employeeId: string;
  phone: string;
  assignedCenter: {
    name: string;
    district: string;
    address?: string;
  };
  specialization: OfficerSpecialization;
  division?: string;
  createdAt: string;
  updatedAt: string;
};

export type OfficerProfileInput = Pick<
  OfficerProfile,
  'employeeId' | 'phone' | 'assignedCenter' | 'specialization' | 'division'
>;

export type AssistanceRequest = {
  _id: string;
  farmer: AdvisoryUser;
  category: AssistanceRequestCategory;
  title: string;
  description: string;
  farmLocation: {
    address?: string;
    district: string;
  };
  farmSizeAcres?: number;
  attachments: {
    _id: string;
    name: string;
    url: string;
    fileType?: string;
  }[];
  priority: AssistanceRequestPriority;
  status: AssistanceRequestStatus;
  assignedOfficer?: AdvisoryUser;
  internalNotes?: string;
  responses: {
    _id: string;
    type: OfficialResponseType;
    message: string;
    scheduledVisitAt?: string;
    respondedBy: AdvisoryUser;
    respondedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
};

export type AdvisoryNotice = {
  _id: string;
  officer: AdvisoryUser;
  type: 'general' | 'subsidy' | 'training' | 'emergency' | 'marketSurplus';
  title: string;
  description: string;
  targetAudience: 'allFarmers' | 'district';
  targetDistrict?: string;
  languages: ('en' | 'si' | 'ta')[];
  isEmergency: boolean;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdvisoryNoticeInput = Pick<
  AdvisoryNotice,
  'type' | 'title' | 'description' | 'targetAudience' | 'languages' | 'isEmergency'
> & {
  targetDistrict?: string;
};

export type QualityGuideline = {
  _id: string;
  officer: AdvisoryUser;
  cropName: string;
  growingRegion?: string;
  maxMoisture: string;
  minPurity: string;
  sizingGrade: string;
  requiredCertification: string;
  status: 'active' | 'archived';
  effectiveDate: string;
  createdAt: string;
  updatedAt: string;
};

export type QualityGuidelineInput = Pick<
  QualityGuideline,
  | 'cropName'
  | 'growingRegion'
  | 'maxMoisture'
  | 'minPurity'
  | 'sizingGrade'
  | 'requiredCertification'
> & {
  effectiveDate?: string;
};

export type SurplusAdvisory = {
  _id: string;
  officer: AdvisoryUser;
  cropName: string;
  harvestSeason?: string;
  affectedDistricts: string[];
  surplusVolumeMt: number;
  level: 'critical' | 'moderate' | 'normal';
  priceImpactPercent: number;
  recommendedActions: string[];
  status: 'active' | 'resolved';
  issuedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SurplusAdvisoryInput = Pick<
  SurplusAdvisory,
  | 'cropName'
  | 'harvestSeason'
  | 'affectedDistricts'
  | 'surplusVolumeMt'
  | 'level'
  | 'priceImpactPercent'
  | 'recommendedActions'
>;

export type ReportedListing = {
  _id: string;
  product: {
    _id: string;
    name: string;
    category: string;
    fixedPrice?: number;
    unit: string;
    status: string;
    images: string[];
    farmer?: AdvisoryUser;
  };
  farmer: AdvisoryUser;
  reportedBy: AdvisoryUser;
  reason:
    | 'misleadingQuality'
    | 'wrongPricing'
    | 'prohibitedItem'
    | 'duplicateListing'
    | 'suspectedFraud'
    | 'other';
  description: string;
  advertisedPrice?: number;
  observedPrice?: number;
  risk: 'low' | 'medium' | 'high';
  status: 'pending' | 'inReview' | 'suspended' | 'dismissed' | 'resolved';
  reviewedBy?: AdvisoryUser;
  reviewNote?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdvisoryReportOverview = {
  metrics: {
    totalTradeValue: number;
    totalQuantity: number;
    activeFarmers: number;
    requestsResolved: number;
    activeNotices: number;
    pendingReports: number;
  };
  categoryTrade: {
    category: string;
    quantity: number;
    value: number;
    percentage: number;
  }[];
  topCrops: {
    name: string;
    district: string;
    quantity: number;
    estimatedValue: number;
  }[];
  generatedAt: string;
};
