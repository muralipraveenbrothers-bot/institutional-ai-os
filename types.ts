
export enum UserRole {
  RECEPTIONIST = 'Receptionist',
  DOCTOR = 'Doctor',
  PHARMACY = 'Pharmacy',
  WARD = 'Ward / Nursing',
  LAB = 'Lab Technician',
  RADIOLOGY = 'Radiology Technician',
  BILLING = 'Billing',
  ADMIN = 'Administrator',
  PATIENT_SUPPORT = 'Patient Support Hub',
  SECURITY_CONTROL = 'Institutional Security'
}

export type RegistrationStatus = 'REGISTERED' | 'PENDING_TRIAGE' | 'IN_TRIAGE' | 'WITH_DOCTOR' | 'SENT_FOR_INVESTIGATION' | 'BILLING_PENDING' | 'SEEN_BY_DOCTOR' | 'DISCHARGED';

export type SampleStage = 'COLLECTED' | 'RECEIVED' | 'PROCESSING' | 'ANALYZER' | 'VERIFIED' | 'RELEASED';

export type EncounterNode = 'WARD NODE' | 'ICU NODE' | 'DIAGNOSTIC NODE' | 'PHARMA NODE' | 'BILLING NODE' | 'ADMIN COMMAND NODE' | 'HUB STANDBY';

export type AppEvent = {
  type:
    | "REGISTERED"
    | "ADMISSION_CONFIRMED"
    | "BILL_GENERATED"
    | "PAYMENT_DONE"
    | "INVESTIGATION_ORDERED"
    | "REPORT_UPLOADED"
    | "MEDICATION_DRAFTED"
    | "DOCTOR_UPDATED_PLAN"
    | "DOCTOR_APPROVED";
  message: string;
  severity?: 'info' | 'success' | 'warning';
};

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
    __APP_EVENTS__?: AppEvent[];
    emitAppEvent?: (event: AppEvent) => void;
    __WORKFLOW__?: {
      registered: boolean;
      billGenerated: boolean;
      paymentDone: boolean;
      investigationOrdered: boolean;
      reportUploaded: boolean;
      medicationDrafted: boolean;
      doctorApproved: boolean;
    };
    __AI_STATUS__?: {
      susruta: boolean;
      mitra: boolean;
      pragnya: boolean;
    };
    __QUIET_SYNTHESIS__?: {
      enabled: boolean;
      lastOutput?: string;
    };
    __DISCUSS_MODE__?: {
      enabled: boolean;
      history: { question: string; answer: string }[];
    };
    __VOICE__?: {
      speaking: boolean;
      paused: boolean;
    };
  }
}

export type BillingModel = 'OPD' | 'PACKAGE' | 'ITEMIZED' | 'PARTIAL_SURGERY';

export interface Token {
  number: string;
  department: string;
  priority: 'Normal' | 'Emergency' | 'Senior';
  issuedAt: string;
}

export interface HealthSnapshot {
  timestamp: string;
  complaint: string;
  painScale: number;
  bp: string;
  sugar: string;
  temp: string;
  pulse: string;
  spo2: string;
  rr?: string;
  height: string;
  weight: string;
  knownConditions: string;
}

export interface TimedService {
  id: string;
  name: string;
  startTime: string;
  endTime?: string;
  ratePerHour: number;
  totalCharge?: number;
  status: 'ACTIVE' | 'COMPLETED';
}

export interface InstitutionalBill {
  id: string;
  billNumber: string;
  mrNumber: string;
  patientId: string;
  patientName: string;
  patient: string;
  visitType: 'OPD' | 'IPD' | 'EMERGENCY' | 'PHARMACY_ONLY';
  billingModel?: BillingModel;
  items: BillingItem[];
  total: number;
  advanceReceived?: number;
  balance?: number;
  status: 'Generated' | 'Paid' | 'Authorized' | 'Interim' | 'Discharged' | 'Partially Paid' | 'OVERDUE';
  createdAt: string;
  paidAt?: string;
  auditLog: { user: string; action: string; time: string }[];
  barcode?: string;
  lastReminderAt?: string;
  packageDetails?: {
    packageName: string;
    basePrice: number;
    includedDays: number;
    includesMedicines: boolean;
    includesLab: boolean;
  };
  signatures: { user: string; authority: string; time: string }[];
}

export interface BillingItem {
  id?: string;
  name: string;
  cost: number;
  category: 
    | 'Registration' 
    | 'Consultation' 
    | 'OP' 
    | 'IP' 
    | 'Pharmacy' 
    | 'Lab' 
    | 'Radiology' 
    | 'Emergency' 
    | 'Surgery' 
    | 'Procedures' 
    | 'ICU' 
    | 'Consumables' 
    | 'Oxygen'
    | 'Ventilator'
    | 'Other'
    | 'Final';
  qty?: number;
  date?: string;
  status?: 'Pending' | 'Confirmed' | 'Paid';
  isPackageExtra?: boolean;
  taxPercent?: number;
}

export interface Diagnosis {
  id: string;
  code: string; // ICD-10 or similar
  description: string;
  type: 'PRIMARY' | 'SECONDARY' | 'DIFFERENTIAL';
  status: 'SUSPECTED' | 'CONFIRMED' | 'RULED_OUT';
  identifiedAt: string;
  identifiedBy: string;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  goals: string[];
  interventions: {
    type: 'MEDICATION' | 'SURGERY' | 'PROCEDURE' | 'THERAPY' | 'DIET';
    description: string;
    status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  }[];
  startDate: string;
  endDate?: string;
  lastUpdated: string;
}

export interface Patient {
  id: string;
  mrNumber: string;
  barcode?: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  chiefComplaint: string;
  extraSymptoms?: string;
  type: 'OP' | 'IP' | 'SELF_TEST' | 'WALK_IN_LAB';
  status: string;
  regStatus?: RegistrationStatus;
  isConsultationPaid: boolean;
  investigations: Investigation[];
  medications: any[];
  diagnoses?: Diagnosis[];
  treatmentPlans?: TreatmentPlan[];
  registeredAt: string;
  bedNumber?: string;
  timedServices?: TimedService[];
  token?: Token;
  healthSnapshot?: HealthSnapshot;
  isICU?: boolean;
  icuStatus?: any;
}

export interface LabResultData {
  testName: string;
  value: string;
  units: string;
  referenceRange: string;
  flag: string;
  interpretation?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface Investigation {
  id: string;
  test_id: string;
  name: string;
  type: 'LAB' | 'RADIOLOGY';
  priority: 'Routine' | 'Must' | 'Should' | 'Stat' | 'Urgent';
  price: number;
  payment_status: 'PENDING' | 'PAID' | 'APPROVED';
  result_status: 'LOCKED' | 'COMPLETED' | 'PENDING_VERIFICATION' | 'VERIFIED';
  expectedTurnaround: string;
  sampleStage?: SampleStage;
  currentResult?: string;
  labResult?: LabResultData;
  orderedBy?: string;
  collectedAt?: string;
  radiologyDetails?: any;
  isCritical?: boolean;
}

export interface Medication {
  drug_id: string;
  name: string;
  molecule: string;
  stock: number;
  sold_today: number;
  min_stock: number;
  profit_tier: 'LOW' | 'MEDIUM' | 'HIGH';
  alternative_id: string | null;
  status: string;
  cost: number;
  purchase_price: number;
  expiry: string;
  batch: string;
  gstPercent: number;
}

export interface ShiftLedger {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  openingBalance: number;
  cashCollected: number;
  upiCollected: number;
  closingBalance: number;
  variance: number;
  status: 'OPEN' | 'CLOSED' | 'VARIANCE_ALERT';
  supervisorPinUsed?: boolean;
}

export interface ConsumptionRecord {
  id: string;
  itemId: string;
  itemName: string;
  patientId: string;
  staffId: string;
  quantity: number;
  source: string;
  verifiedScan: boolean;
  cost: number;
  timestamp: string;
}

export interface AnomalyAlert {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  message: string;
  userId: string;
  timestamp: string;
  metadata?: any;
}

export interface SurgeryMedIssue {
  issueId: string;
  patientId: string;
  surgeryName: string;
  surgeon: string;
  nurseId: string;
  items: {
    itemId: string;
    name: string;
    qtyIssued: number;
    qtyUsed: number;
    qtyReturned: number;
    qtyWasted: number;
    batch: string;
  }[];
  status: 'PENDING' | 'RECONCILED' | 'MISMATCH';
}

export interface CashHandoverRecord {
  id: string;
  date: string;
  staffId: string;
  collections: {
    opCount: number;
    opRate: number;
    opTotal: number;
    ipTotal: number;
    pharmacyTotal: number;
    usgTotal: number;
    xrayTotal: number;
    ctTotal: number;
    mriTotal: number;
    labTotal: number;
    referralTotal: number;
  };
  expected: {
    opTotal: number;
    ipTotal: number;
    pharmacyTotal: number;
    usgTotal: number;
    xrayTotal: number;
    ctTotal: number;
    mriTotal: number;
    labTotal: number;
  };
  grandTotal: number;
  grandExpected: number;
  variance: number;
  status: 'PENDING' | 'COMPLETED';
  aiReport?: string;
  timestamp: string;
}

export interface RapidCardLog {
  cardId: string;
  patientId: string;
  testName: string;
  issuedAt: string;
  hasResult: boolean;
}

export interface ForensicTraceEvent {
  id: string;
  eventType: 
    | 'SURGERY_PRE' 
    | 'SURGERY_POST' 
    | 'PHARMA_NIGHT' 
    | 'CRASH_CART_AUDIT' 
    | 'DRESSING_RECON' 
    | 'PHARMA_SALE' 
    | 'SCHEDULED_PROBE'
    | 'WARD_AUDIT'
    | 'DRESSING_ROOM_AUDIT'
    | 'PROCEDURE_ROOM_AUDIT'
    | 'PHARMACY_STOCK_AUDIT'
    | 'OT_INSTRUMENT_AUDIT';
  location: string;
  staffId: string;
  timestamp: string;
  patientId?: string;
  photoBefore?: string;
  photoAfter?: string;
  itemsDetected: string[];
  varianceDetected: boolean;
  varianceDetails?: string;
  manualAuditHash: string;
}

export interface AuditProbe {
  id: string;
  type: 'CRASH_CART' | 'PHARMA_SHELF' | 'OT_TRAY' | 'DRESSING_STOCK';
  location: string;
  deadline: string;
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED';
  assignedTo: string;
  frequencyDays: 2 | 3;
}

export interface StaffRiskProfile {
  staffId: string;
  name: string;
  score: number; // 0-100
  level: 'LOW' | 'MODERATE' | 'HIGH';
  factors: string[];
  varianceTrend: 'UP' | 'DOWN' | 'STABLE';
}

export interface BehavioralAnomaly {
  id: string;
  type: 'SIPHONING' | 'COLLUSION' | 'TIME_ANOMALY' | 'VALUE_ANOMALY';
  staffIds: string[];
  severity: 'MEDIUM' | 'HIGH';
  evidence: string;
  timestamp: string;
}

export interface ForensicTimelineNode {
  time: string;
  action: string;
  staffId: string;
  location: string;
  status: 'NOMINAL' | 'ALERT';
}

export interface AccessLogEntry {
  id: string;
  staffId: string;
  area: string;
  action: string;
  time: string;
  duration?: string;
  snapshotUrl?: string;
}

export type Comorbidity = 'Diabetes' | 'CKD' | 'CLD' | 'CAD' | 'COPD' | 'Autoimmune' | 'Immunosuppression' | 'Malnutrition' | 'Obesity' | 'Malignancy' | string;

export interface VitalsRecord {
  bp: string;
  pulse: string;
  temp: string;
  spo2: string;
  rr?: string;
  timestamp: string;
}

export interface RevenueLedger {
  OPD: number;
  IPD: number;
  Pharmacy: number;
  Lab: number;
  Radiology: number;
  Surgery: number;
  Emergency: number;
  Total: number;
}

export interface DistributorProfile {
  id: string;
  name: string;
  reliability: number;
  specialty: string[];
}

export interface PmaiInsight {
  id: string;
  type: 'Distributor' | 'Margin' | 'Replacement' | 'Stock' | 'Trend' | string;
  title: string;
  description: string;
  impact: string;
  severity: 'High' | 'Medium' | 'Low';
  potentialSavings?: string;
  action: string;
}

export interface OutcomeEvent {
  date: string;
  indicator: string;
  value: number;
  note: string;
  source: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  medications: any[];
  status: 'PENDING' | 'COMPLETED';
}

export interface NursingTask {
  id: string;
  task: string;
  status: 'PENDING' | 'COMPLETED';
}

export interface LabInvestment {
  id: string;
  name: string;
  cost: number;
  roiEstimate: string;
}

export interface RadiologyImage {
  id: string;
  url: string;
  version: number;
  timestamp: string;
  operatorId: string;
  modality: string;
}

export interface RadiologyAnnotation {
  id: string;
  imageId: string;
  type: string;
  coordinates: any;
}

export interface RadiologyReport {
  id: string;
  text: string;
  status: string;
  radiologistName: string;
  critical: boolean;
  timestamp: string;
  aiSummary?: string;
}

export interface InsuranceClaim {
  id: string;
  patientId: string;
  status: string;
  amount: number;
}

export interface Report {
  id: string;
  fileName: string;
  uploadDate: string;
  status: string;
  type: string;
  extractedData?: { finding: string, value: string, isAbnormal: boolean, confidence: number }[];
}

export interface MemoryEntry {
  id: string;
  text: string;
  timestamp: string;
}

export interface StaffPreference {
  staffHash: string;
  pace: 'standard' | string;
  style: 'brief' | string;
  stressTriggerDetected: boolean;
}

export interface CultureLog {
  id: string;
  timestamp: number;
  pattern: string;
  outcome: 'Positive' | 'Negative' | 'Neutral';
  learning: string;
}

export interface SurgicalOption {
  specialty: string;
  procedure: string;
  rationale: string;
}

export interface SurgeryKitTemplate {
  id: string;
  name: string;
  items: any[];
}

export interface EvidenceBadge {
  item: string;
  level: string;
  note: string;
}

export interface FraudAlert {
  id: string;
  type: string;
  message: string;
}

export interface PathoStep {
  stepNumber: number;
  title: string;
  description: string;
}

export interface PathoSymptom {
  name: string;
  mechanism: string;
  differentials: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface PathoDeepDive {
  trigger: string;
  transmitter: string;
  organelleDysfunction: string;
  cellularResponse: string;
  tissueEffect: string;
  organInvolvement: string;
  labMarkers: string[];
  drugIntervention: string;
  thresholdNote: string;
  earlyMarkers: string[];
}

// v4.0 Expansion Types
export interface LegalVaultEntry {
  id: string;
  timestamp: string;
  patientId: string;
  staffId: string;
  entryType: 'CONSENT' | 'VIP_ACCESS' | 'EMOTIONAL_ESCALATION' | 'PHOTO_LOG' | 'COMMUNICATION';
  content: string;
  signatureHash: string;
}

export interface ProgressPhoto {
  id: string;
  timestamp: string;
  patientId: string;
  wardLabel: string;
  staffId: string;
  imageUrl: string;
  caption: string;
}

// v5.0 Expansion Types
export interface ReputationAlert {
  id: string;
  timestamp: string;
  source: 'INTERNAL' | 'ONLINE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  keywordCluster: string[];
  rawFeedback: string;
  suggestedResponse: string;
  preventiveAction: string;
}

export interface NetworkTransfer {
  id: string;
  patientId: string;
  fromBranch: string;
  toBranch: string;
  timestamp: string;
  reason: string;
  summary: string;
  status: 'PENDING' | 'COMPLETED';
}

export interface MediaStatement {
  id: string;
  caseId: string;
  timestamp: string;
  audience: 'PRESS' | 'INTERNAL' | 'SOCIAL';
  statement: string;
  status: 'DRAFT' | 'APPROVED';
}

export interface StaffSupportLog {
  id: string;
  timestamp: string;
  staffId: string;
  problem: string;
  location: string;
  intensity: string;
  scriptProvided: string;
}

export type DoctorTabExtended = 'ddx' | 'nicu' | 'sepsis' | 'renal' | 'oncology' | 'advanced_iq' | 'genomics' | 'investigations' | 'medications' | 'reports' | 'counseling' | 'surgery' | 'emergency_super_icu' | 'disaster' | 'quiet' | 'mdt' | 'twin' | 'radiology_results' | 'tobacco_cessation' | 'clinical_roadmap' | 'clinical_hub';
