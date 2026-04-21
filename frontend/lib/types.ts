export type UserRole = "user" | "therapist" | "admin";

export type SessionType = "chat" | "audio" | "video" | "face_to_face";
export type MoodValue =
  | "happy"
  | "calm"
  | "motivated"
  | "tired"
  | "anxious"
  | "stressed"
  | "sad"
  | "angry";

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  name: string;
  role: UserRole;
  isVerified: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlatformStats {
  sessionsCompleted: number;
  therapistsAvailable: number;
  peopleHelped: number;
  communityMembers: number;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  age?: number | null;
  gender?: string;
  wellbeingGoals?: string;
  bio?: string;
  role?: Exclude<UserRole, "admin">;
}

export interface Profile {
  id: string;
  age: number | null;
  gender: string;
  wellbeingGoals: string;
  bio: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number | null;
  gender: string;
  wellbeingGoals: string;
  bio: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  appointmentCount: number;
  lastAppointmentAt: string;
}

export interface TherapistFilters {
  search?: string;
  specialization?: string;
  language?: string;
  date?: string;
  page?: number;
  pageSize?: number;
  approvalStatus?: string;
  priceRange?: { min: number; max: number };
  sessionTypes?: SessionType[];
  experience?: string;
}

export interface Therapist {
  id: string;
  userId: string;
  user: User;
  title: string;
  age?: number | null;
  gender?: string;
  bio: string;
  specializations: string[];
  qualifications: string[];
  experience: number;
  languages: string[];
  sessionTypes: SessionType[];
  pricePerSession: number;
  completedSessions: number;
  commissionRate: number;
  commissionTier: string;
  totalEarnings: number;
  nextTierName?: string;
  nextTierMinSessions?: number | null;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  isApproved: boolean;
  isAvailable?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  licenseNumber?: string;
  avatar?: string;
  profileImage?: string;
  acceptsAdults?: boolean;
  acceptsTeens?: boolean;
  acceptsCouples?: boolean;
  availableSlots?: AvailabilitySlot[];
  clinic?: TherapistClinic | null;
}

export interface TherapistCommissionRule {
  id: string;
  tierName: string;
  minSessions: number;
  maxSessions: number | null;
  commissionRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TherapistClinic {
  id: string;
  clinicName: string;
  clinicAddress: string;
  latitude: number;
  longitude: number;
  phone: string;
  openingHours: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySlot {
  id: string;
  therapistId: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface PackagePlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  sessionCredits: number;
  durationDays: number;
  priceAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PackagePlanInput {
  name: string;
  slug: string;
  description: string;
  sessionCredits: number;
  durationDays: number;
  priceAmount: number;
  isActive: boolean;
}

export interface UserSubscription {
  id: string;
  plan: PackagePlan;
  status: "pending_payment" | "active" | "expired" | "cancelled";
  totalCredits: number;
  remainingCredits: number;
  startsAt: string;
  expiresAt: string;
  activatedAt: string;
  cancelledAt: string;
  paymentStatus: PaymentStatus;
  paymentProvider: string;
  paidAmount: number;
  khaltiPidx: string;
  paymentTransactionId: string;
  paymentInitiatedAt: string;
  paymentVerifiedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus =
  | "pending_payment"
  | "pending"
  | "confirmed"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "completed"
  | "missed"
  | "rescheduled";

export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "expired"
  | "refunded";

export interface AppointmentEvent {
  id: string;
  status: AppointmentStatus;
  note: string;
  actor: string | null;
  actorName: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  userId: string;
  userName: string;
  therapistId: string;
  therapistName: string;
  therapist?: Therapist;
  availabilitySlotId: string | null;
  sessionType: SessionType;
  scheduledStart: string;
  scheduledEnd: string;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  bookingPaymentType: "single" | "package";
  subscriptionId: string | null;
  paymentProvider: string;
  paidAmount: number;
  subscriptionCreditConsumedAt: string;
  subscriptionCreditRestoredAt: string;
  khaltiPidx: string;
  paymentTransactionId: string;
  paymentInitiatedAt: string;
  paymentVerifiedAt: string;
  meetingProvider: string;
  meetingLink: string;
  externalCalendarEventId: string;
  meetingStatus: string;
  meetingCreatedAt: string;
  sessionPrice?: number | null;
  commissionRateUsed?: number | null;
  platformCommission?: number | null;
  therapistEarning?: number | null;
  tierUsed?: string | null;
  notes: string;
  cancellationReason: string;
  therapistResponseNote: string;
  rescheduledFrom: string | null;
  hasFeedback?: boolean;
  requiresAttendanceConfirmation?: boolean;
  events: AppointmentEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminRevenueRow {
  id: string;
  therapistId: string;
  therapistName: string;
  therapistEmail: string;
  userName: string;
  sessionType: SessionType;
  scheduledStart: string;
  paymentVerifiedAt: string;
  sessionPrice: number;
  platformCommission: number;
  therapistEarning: number;
  commissionRateUsed: number | null;
  tierUsed: string;
  paymentProvider: string;
  paymentTransactionId: string;
}

export interface AdminRevenueTherapistTotal {
  therapistId: string;
  therapistName: string;
  therapistEmail: string;
  completedSessions: number;
  grossRevenue: number;
  therapistRevenue: number;
  platformRevenue: number;
}

export interface AdminRevenueSummary {
  completedSessions: number;
  grossRevenue: number;
  therapistRevenue: number;
  platformRevenue: number;
}

export interface AdminRevenueReport {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminRevenueRow[];
  summary: AdminRevenueSummary;
  therapistTotals: AdminRevenueTherapistTotal[];
}

export interface KhaltiInitiation {
  appointment: string;
  pidx: string;
  paymentUrl: string;
  amount: number;
}

export interface KhaltiVerificationResult {
  appointment?: Appointment | null;
  appointmentId: string;
  paymentStatus: PaymentStatus;
  bookingStatus: AppointmentStatus;
  lookup: Record<string, unknown>;
}

export interface PackagePurchaseInitiation {
  subscription: string;
  pidx: string;
  paymentUrl: string;
  amount: number;
}

export interface PackageVerificationResult {
  subscription?: UserSubscription | null;
  subscriptionId: string;
  paymentStatus: PaymentStatus;
  subscriptionStatus: UserSubscription["status"];
  lookup: Record<string, unknown>;
}

export interface MoodEntry {
  id: string;
  entryDate: string;
  mood: MoodValue;
  moodLabel: string;
  moodScore: number;
  stressLevel: number;
  energyLevel: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export interface Resource {
  id: string;
  title: string;
  slug?: string;
  categoryId?: string;
  category: string;
  createdBy?: string;
  createdByName?: string;
  createdByEmail?: string;
  summary?: string;
  description?: string;
  imageUrl?: string;
  content: string;
  format?: string;
  published?: boolean;
  readTime: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: "full-time" | "part-time" | "contract";
  experience: string;
  salaryRange: string;
  salary?: string;
  description: string;
  requirements: string[];
  isFeatured: boolean;
  featured?: boolean;
  createdAt: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  order: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export type SupportIssueType =
  | "payment"
  | "refund"
  | "appointment"
  | "technical";
export type SupportTicketStatus = "open" | "in_progress" | "resolved";

export interface SupportTicketMessage {
  id: string;
  ticket: string;
  sender: string;
  senderName: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  user: string;
  userName: string;
  appointment: string | null;
  subject: string;
  issueType: SupportIssueType;
  description: string;
  paymentReference: string;
  status: SupportTicketStatus;
  latestMessage: string;
  latestMessageAt: string;
  messages: SupportTicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  id: string;
  appointment: string;
  appointmentScheduledStart?: string;
  user: string;
  userName?: string;
  therapist: string;
  therapistName?: string;
  rating: number;
  serviceRating?: number | null;
  comment: string;
  createdAt: string;
}

export interface PatientRecord {
  id: string;
  patient: string;
  patientName: string;
  therapist: string;
  therapistName: string;
  appointment: string | null;
  appointmentScheduledStart: string;
  notes: string;
  diagnosisNotes: string;
  recommendations: string;
  sessionSummary: string;
  patientProgress: string;
  nextSteps: string;
  riskFlag: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  appointment: string | null;
  user: string;
  userName?: string;
  therapist: string;
  therapistName: string;
  isActive: boolean;
  messages: Message[];
  createdAt: string;
}

export interface Message {
  id: string;
  conversation: string;
  sender: string;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type PaginationFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export interface AIChatReply {
  reply: string;
  recommendedTherapists?: AIRecommendedTherapist[];
  recommendedResources?: AIRecommendedResource[];
}

export interface AIChatMessagePayload {
  role: "user" | "assistant";
  content: string;
}

export interface AIRecommendedTherapist {
  id: string;
  name: string;
  specialization: string;
  experienceYears: number;
  profileImage?: string;
  reason: string;
  profileUrl: string;
}

export interface AIRecommendedResource {
  id: string;
  title: string;
  summary: string;
  category: string;
  reason: string;
  url: string;
}
