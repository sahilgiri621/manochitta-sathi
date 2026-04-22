import type {
  Appointment,
  AIChatReply,
  AdminRevenueReport,
  AdminRevenueRow,
  AdminRevenueTherapistTotal,
  AIChatMessagePayload,
  AuthSession,
  AuthTokens,
  AvailabilitySlot,
  Conversation,
  Feedback,
  KhaltiInitiation,
  KhaltiVerificationResult,
  PackagePlan,
  PackagePlanInput,
  PackagePurchaseInitiation,
  PackageVerificationResult,
  PatientProfile,
  PatientRecord,
  LoginCredentials,
  Message,
  MoodEntry,
  Notification,
  PaginatedResponse,
  PlatformStats,
  Profile,
  RegisterData,
  Resource,
  ResourceCategory,
  SupportTicket,
  SupportTicketMessage,
  SupportIssueType,
  SupportTicketStatus,
  TherapistClinic,
  TherapistCommissionRule,
  Therapist,
  TherapistFilters,
  User,
  UserSubscription,
} from "@/lib/types";
import { getMoodMeta } from "@/lib/mood";

function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    return "/api/backend";
  }
  const serverValue =
    process.env.BACKEND_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!serverValue) {
    throw new Error(
      "BACKEND_API_URL or NEXT_PUBLIC_API_URL is not configured. Set it in the frontend environment.",
    );
  }
  return serverValue.replace(/\/$/, "");
}

function getConfiguredBackendOrigin() {
  const value = process.env.NEXT_PUBLIC_API_URL?.trim();
  return value ? value.replace(/\/$/, "") : "";
}

function buildApiUrl(endpoint: string) {
  return `${getApiBaseUrl()}${endpoint}`;
}

function getEndpointFromPaginatedUrl(value: string) {
  if (!value) return value;
  try {
    const url = new URL(value);
    const apiPrefix = "/api/v1";
    const path = url.pathname.includes(apiPrefix)
      ? url.pathname.slice(url.pathname.indexOf(apiPrefix) + apiPrefix.length)
      : url.pathname;
    return `${path}${url.search}`;
  } catch {
    const apiPrefix = "/api/v1";
    return value.startsWith(apiPrefix) ? value.slice(apiPrefix.length) : value;
  }
}

function appendPaginationParams(
  params: URLSearchParams,
  filters?: { page?: number; pageSize?: number; search?: string },
) {
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.pageSize) params.set("page_size", String(filters.pageSize));
  if (filters?.search) params.set("search", filters.search);
}

function normalizePaginatedResponse<T>(
  data: PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[],
  normalize: (item: Record<string, unknown>) => T,
): PaginatedResponse<T> {
  if (Array.isArray(data)) {
    return {
      count: data.length,
      next: null,
      previous: null,
      results: data.map((item) => normalize(item)),
    };
  }
  return {
    count: data.count,
    next: data.next,
    previous: data.previous,
    results: data.results.map((item) => normalize(item)),
  };
}

const TOKEN_STORAGE_KEY = "ms_auth_tokens";
const AUTH_ACCESS_COOKIE = "ms_auth_access";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
  retryOnAuthError?: boolean;
}

type UnauthorizedListener = () => void;

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function buildNetworkErrorMessage(apiUrl: string) {
  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    getConfiguredBackendOrigin().startsWith("http://")
  ) {
    return "The app is loaded over HTTPS but the API is configured over HTTP. Update the backend URL to HTTPS or use the frontend proxy from the same origin.";
  }
  return `Unable to reach the API at ${apiUrl}. Check that the backend server is running and the frontend API configuration points to it.`;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function writeBrowserCookie(name: string, value: string | null) {
  if (!isBrowser()) return;
  if (value) {
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax`;
    return;
  }
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function toArray(value: string | null | undefined) {
  return value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function toTitleCaseSession(type: string): string {
  if (type === "face_to_face") return "Face to Face";
  return type;
}

function getErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;
  const record = data as Record<string, unknown>;
  if (typeof record.message === "string" && record.message)
    return record.message;
  if (record.errors && typeof record.errors === "object") {
    const errors = record.errors as Record<string, unknown>;
    const firstEntry = Object.entries(errors)[0];
    if (firstEntry) {
      const [field, value] = firstEntry;
      if (Array.isArray(value) && value.length > 0) {
        return `${field}: ${String(value[0])}`;
      }
      if (typeof value === "string") {
        return `${field}: ${value}`;
      }
    }
  }
  const fieldMessage = Object.values(record).find((value) =>
    Array.isArray(value)
      ? typeof value[0] === "string"
      : typeof value === "string",
  );
  if (Array.isArray(fieldMessage)) return String(fieldMessage[0] || fallback);
  if (typeof fieldMessage === "string") return fieldMessage;
  return fallback;
}

function normalizeUser(payload: Record<string, unknown>): User {
  const firstName = String(payload.first_name || "");
  const lastName = String(payload.last_name || "");
  return {
    id: String(payload.id),
    email: String(payload.email || ""),
    phone: String(payload.phone || ""),
    firstName,
    lastName,
    name:
      [firstName, lastName].filter(Boolean).join(" ").trim() ||
      String(payload.email || ""),
    role: String(payload.role || "user") as User["role"],
    isVerified: Boolean(payload.is_email_verified),
    isActive:
      payload.is_active === undefined ? undefined : Boolean(payload.is_active),
    createdAt: String(payload.created_at || ""),
    updatedAt: String(payload.updated_at || ""),
  };
}

function normalizePlatformStats(
  payload: Record<string, unknown>,
): PlatformStats {
  return {
    sessionsCompleted: Number(payload.sessions_completed || 0),
    therapistsAvailable: Number(payload.therapists_available || 0),
    peopleHelped: Number(payload.people_helped || 0),
    communityMembers: Number(payload.community_members || 0),
  };
}

function normalizeTherapist(payload: Record<string, unknown>): Therapist {
  const specialization = String(payload.specialization || "");
  const qualifications = toArray(
    typeof payload.qualifications === "string" ? payload.qualifications : "",
  );
  const languages = toArray(
    typeof payload.languages === "string" ? payload.languages : "",
  );
  const profileImage = String(payload.profile_image_url || "");

  return {
    id: String(payload.id),
    userId: String((payload.user as Record<string, unknown>)?.id || ""),
    user: normalizeUser((payload.user as Record<string, unknown>) || {}),
    title: specialization || "Therapist",
    age:
      payload.age === null || payload.age === undefined
        ? null
        : Number(payload.age),
    gender: String(payload.gender || ""),
    bio: String(payload.bio || ""),
    specializations: specialization ? [specialization] : [],
    qualifications,
    experience: Number(payload.experience_years || 0),
    languages,
    sessionTypes: ["video", "audio", "chat"],
    pricePerSession: Number(payload.consultation_fee || 0),
    completedSessions: Number(payload.completed_sessions || 0),
    commissionRate: Number(payload.commission_rate || 0),
    commissionTier: String(payload.commission_tier || ""),
    totalEarnings: Number(payload.total_earnings || 0),
    nextTierName: String(payload.next_tier_name || "") || undefined,
    nextTierMinSessions:
      payload.next_tier_min_sessions === null ||
      payload.next_tier_min_sessions === undefined
        ? null
        : Number(payload.next_tier_min_sessions),
    rating: Number(payload.rating || 0),
    reviewCount: Number(payload.review_count || 0),
    isApproved: String(payload.approval_status) === "approved",
    approvalStatus: String(
      payload.approval_status || "pending",
    ) as Therapist["approvalStatus"],
    licenseNumber: String(payload.license_number || ""),
    avatar: profileImage || undefined,
    profileImage: profileImage || undefined,
    clinic: payload.clinic
      ? normalizeTherapistClinic(payload.clinic as Record<string, unknown>)
      : null,
  };
}

function normalizeTherapistCommissionRule(
  payload: Record<string, unknown>,
): TherapistCommissionRule {
  return {
    id: String(payload.id || ""),
    tierName: String(payload.tier_name || ""),
    minSessions: Number(payload.min_sessions || 0),
    maxSessions:
      payload.max_sessions === null || payload.max_sessions === undefined
        ? null
        : Number(payload.max_sessions),
    commissionRate: Number(payload.commission_rate || 0),
    isActive: Boolean(payload.is_active),
    createdAt: String(payload.created_at || ""),
    updatedAt: String(payload.updated_at || ""),
  };
}

function normalizeTherapistClinic(
  payload: Record<string, unknown>,
): TherapistClinic {
  return {
    id: String(payload.id || ""),
    clinicName: String(payload.clinic_name || ""),
    clinicAddress: String(payload.clinic_address || ""),
    latitude: Number(payload.latitude || 0),
    longitude: Number(payload.longitude || 0),
    phone: String(payload.phone || ""),
    openingHours: String(payload.opening_hours || ""),
    notes: String(payload.notes || ""),
    createdAt: String(payload.created_at || ""),
    updatedAt: String(payload.updated_at || ""),
  };
}

function buildTherapistProfilePayload(
  payload: Partial<Therapist> & { profileImageFile?: File | null },
) {
  const specialization = payload.specializations?.[0] || payload.title || "";
  const qualifications = payload.qualifications?.join(", ") || "";
  const languages = payload.languages?.join(", ") || "";

  if (payload.profileImageFile) {
    const formData = new FormData();
    formData.append(
      "age",
      payload.age === null || payload.age === undefined
        ? ""
        : String(payload.age),
    );
    formData.append("gender", payload.gender || "");
    formData.append("specialization", specialization);
    formData.append("bio", payload.bio || "");
    formData.append("qualifications", qualifications);
    formData.append("experience_years", String(payload.experience || 0));
    formData.append("license_number", payload.licenseNumber || "");
    formData.append("consultation_fee", String(payload.pricePerSession || 0));
    formData.append("languages", languages);
    formData.append("profile_image", payload.profileImageFile);
    return formData;
  }

  return JSON.stringify({
    age: payload.age ?? null,
    gender: payload.gender || "",
    specialization,
    bio: payload.bio || "",
    qualifications,
    experience_years: payload.experience,
    license_number: payload.licenseNumber,
    consultation_fee: payload.pricePerSession,
    languages,
  });
}

function normalizeProfile(payload: Record<string, unknown>): Profile {
  return {
    id: String(payload.id),
    age:
      payload.age === null || payload.age === undefined
        ? null
        : Number(payload.age),
    gender: String(payload.gender || ""),
    wellbeingGoals: String(payload.wellbeing_goals || ""),
    bio: String(payload.bio || ""),
    address: String(payload.address || ""),
    emergencyContactName: String(payload.emergency_contact_name || ""),
    emergencyContactPhone: String(payload.emergency_contact_phone || ""),
    createdAt: String(payload.created_at || ""),
    updatedAt: String(payload.updated_at || ""),
  };
}

function normalizeAvailability(
  payload: Record<string, unknown>,
  therapistId = "",
): AvailabilitySlot {
  return {
    id: String(payload.id),
    therapistId,
    startTime: String(payload.start_time || ""),
    endTime: String(payload.end_time || ""),
    isAvailable: Boolean(payload.is_available),
  };
}

function normalizePackagePlan(payload: Record<string, unknown>): PackagePlan {
  return {
    id: String(payload.id || ""),
    name: String(payload.name || ""),
    slug: String(payload.slug || ""),
    description: String(payload.description || ""),
    sessionCredits: Number(payload.session_credits || 0),
    durationDays: Number(payload.duration_days || 0),
    priceAmount: Number(payload.price_amount || 0),
    isActive: Boolean(payload.is_active),
    createdAt: String(payload.created_at || ""),
    updatedAt: String(payload.updated_at || ""),
  };
}

function normalizeSubscription(
  payload: Record<string, unknown>,
): UserSubscription {
  return {
    id: String(payload.id || ""),
    plan: normalizePackagePlan((payload.plan as Record<string, unknown>) || {}),
    status: String(
      payload.status || "pending_payment",
    ) as UserSubscription["status"],
    totalCredits: Number(payload.total_credits || 0),
    remainingCredits: Number(payload.remaining_credits || 0),
    startsAt: String(payload.starts_at || ""),
    expiresAt: String(payload.expires_at || ""),
    activatedAt: String(payload.activated_at || ""),
    cancelledAt: String(payload.cancelled_at || ""),
    paymentStatus: String(
      payload.payment_status || "unpaid",
    ) as UserSubscription["paymentStatus"],
    paymentProvider: String(payload.payment_provider || ""),
    paidAmount: Number(payload.paid_amount || 0),
    khaltiPidx: String(payload.khalti_pidx || ""),
    paymentTransactionId: String(payload.payment_transaction_id || ""),
    paymentInitiatedAt: String(payload.payment_initiated_at || ""),
    paymentVerifiedAt: String(payload.payment_verified_at || ""),
    createdAt: String(payload.created_at || ""),
    updatedAt: String(payload.updated_at || ""),
  };
}

function normalizeAppointment(payload: Record<string, unknown>): Appointment {
  return {
    id: String(payload.id),
    userId: String(payload.user || ""),
    userName: String(payload.user_name || ""),
    therapistId: String(payload.therapist || ""),
    therapistName: String(payload.therapist_name || ""),
    availabilitySlotId: payload.availability_slot
      ? String(payload.availability_slot)
      : null,
    sessionType: String(
      payload.session_type || "video",
    ) as Appointment["sessionType"],
    scheduledStart: String(payload.scheduled_start || ""),
    scheduledEnd: String(payload.scheduled_end || ""),
    status: String(payload.status || "pending") as Appointment["status"],
    paymentStatus: String(
      payload.payment_status || "unpaid",
    ) as Appointment["paymentStatus"],
    bookingPaymentType: String(
      payload.booking_payment_type || "single",
    ) as Appointment["bookingPaymentType"],
    subscriptionId: payload.subscription ? String(payload.subscription) : null,
    paymentProvider: String(payload.payment_provider || ""),
    paidAmount: Number(payload.paid_amount || 0),
    subscriptionCreditConsumedAt: String(
      payload.subscription_credit_consumed_at || "",
    ),
    subscriptionCreditRestoredAt: String(
      payload.subscription_credit_restored_at || "",
    ),
    khaltiPidx: String(payload.khalti_pidx || ""),
    paymentTransactionId: String(payload.payment_transaction_id || ""),
    paymentInitiatedAt: String(payload.payment_initiated_at || ""),
    paymentVerifiedAt: String(payload.payment_verified_at || ""),
    meetingProvider: String(payload.meeting_provider || ""),
    meetingLink: String(payload.meeting_link || ""),
    externalCalendarEventId: String(payload.external_calendar_event_id || ""),
    meetingStatus: String(payload.meeting_status || ""),
    meetingCreatedAt: String(payload.meeting_created_at || ""),
    sessionPrice:
      payload.session_price === null || payload.session_price === undefined
        ? null
        : Number(payload.session_price),
    commissionRateUsed:
      payload.commission_rate_used === null ||
      payload.commission_rate_used === undefined
        ? null
        : Number(payload.commission_rate_used),
    platformCommission:
      payload.platform_commission === null ||
      payload.platform_commission === undefined
        ? null
        : Number(payload.platform_commission),
    therapistEarning:
      payload.therapist_earning === null ||
      payload.therapist_earning === undefined
        ? null
        : Number(payload.therapist_earning),
    tierUsed: payload.tier_used ? String(payload.tier_used) : null,
    notes: String(payload.notes || ""),
    cancellationReason: String(payload.cancellation_reason || ""),
    therapistResponseNote: String(payload.therapist_response_note || ""),
    rescheduledFrom: payload.rescheduled_from
      ? String(payload.rescheduled_from)
      : null,
    hasFeedback: Boolean(payload.has_feedback),
    requiresAttendanceConfirmation: Boolean(
      payload.requires_attendance_confirmation,
    ),
    events: Array.isArray(payload.events)
      ? payload.events.map((event) => {
          const item = event as Record<string, unknown>;
          return {
            id: String(item.id),
            status: String(item.status || "pending") as Appointment["status"],
            note: String(item.note || ""),
            actor: item.actor ? String(item.actor) : null,
            actorName: String(item.actor_name || ""),
            createdAt: String(item.created_at || ""),
          };
        })
      : [],
    createdAt: String(payload.created_at || ""),
    updatedAt: String(payload.updated_at || ""),
  };
}

function normalizeMoodEntry(payload: Record<string, unknown>): MoodEntry {
  const mood = String(payload.mood || "");
  const moodMeta = getMoodMeta(mood);
  return {
    id: String(payload.id),
    entryDate: String(payload.entry_date || ""),
    mood: mood as MoodEntry["mood"],
    moodLabel: String(payload.mood_label || moodMeta?.label || mood),
    moodScore: Number(payload.mood_score || moodMeta?.score || 0),
    stressLevel: Number(payload.stress_level || 0),
    energyLevel: Number(payload.energy_level || 0),
    notes: String(payload.notes || ""),
    createdAt: String(payload.created_at || ""),
    updatedAt: String(payload.updated_at || ""),
  };
}

function normalizeCategory(payload: Record<string, unknown>): ResourceCategory {
  return {
    id: String(payload.id),
    name: String(payload.name || ""),
    slug: String(payload.slug || ""),
    description: String(payload.description || ""),
  };
}

function normalizeResource(payload: Record<string, unknown>): Resource {
  const content = String(payload.content || "");
  return {
    id: String(payload.id),
    title: String(payload.title || ""),
    slug: String(payload.slug || ""),
    categoryId: String(payload.category || ""),
    category: String(payload.category_name || ""),
    createdBy: payload.created_by ? String(payload.created_by) : "",
    createdByName: String(payload.created_by_name || ""),
    createdByEmail: String(payload.created_by_email || ""),
    summary: String(payload.summary || ""),
    content,
    format: String(payload.format || "article"),
    published: Boolean(payload.published),
    readTime: Math.max(
      1,
      Math.ceil(content.split(/\s+/).filter(Boolean).length / 200),
    ),
    createdAt: String(payload.created_at || ""),
    updatedAt: String(payload.updated_at || ""),
  };
}

function normalizeNotification(payload: Record<string, unknown>): Notification {
  return {
    id: String(payload.id),
    title: String(payload.title || ""),
    message: String(payload.message || ""),
    type: String(payload.notification_type || "system"),
    isRead: Boolean(payload.is_read),
    metadata: (payload.metadata as Record<string, unknown>) || {},
    createdAt: String(payload.created_at || ""),
  };
}

function normalizeSupportMessage(
  payload: Record<string, unknown>,
): SupportTicketMessage {
  return {
    id: String(payload.id || ""),
    ticket: String(payload.ticket || ""),
    sender: String(payload.sender || ""),
    senderName: String(payload.sender_name || ""),
    message: String(payload.message || ""),
    isAdmin: Boolean(payload.is_admin),
    createdAt: String(payload.created_at || ""),
  };
}

function normalizeSupportTicket(
  payload: Record<string, unknown>,
): SupportTicket {
  return {
    id: String(payload.id || ""),
    user: String(payload.user || ""),
    userName: String(payload.user_name || ""),
    appointment: payload.appointment ? String(payload.appointment) : null,
    subject: String(payload.subject || ""),
    issueType: String(payload.issue_type || "technical") as SupportIssueType,
    description: String(payload.description || ""),
    paymentReference: String(payload.payment_reference || ""),
    status: String(payload.status || "open") as SupportTicketStatus,
    latestMessage: String(payload.latest_message || ""),
    latestMessageAt: String(payload.latest_message_at || ""),
    messages: Array.isArray(payload.messages)
      ? payload.messages.map((item) =>
          normalizeSupportMessage((item as Record<string, unknown>) || {}),
        )
      : [],
    createdAt: String(payload.created_at || ""),
    updatedAt: String(payload.updated_at || ""),
  };
}

function normalizeFeedback(payload: Record<string, unknown>): Feedback {
  return {
    id: String(payload.id),
    appointment: String(payload.appointment || ""),
    appointmentScheduledStart: String(
      payload.appointment_scheduled_start || "",
    ),
    user: String(payload.user || ""),
    userName: String(payload.user_name || ""),
    therapist: String(payload.therapist || ""),
    therapistName: String(payload.therapist_name || ""),
    rating: Number(payload.rating || 0),
    serviceRating:
      payload.service_rating === null || payload.service_rating === undefined
        ? null
        : Number(payload.service_rating),
    comment: String(payload.comment || ""),
    createdAt: String(payload.created_at || ""),
  };
}

function normalizeAdminRevenueRow(payload: Record<string, unknown>): AdminRevenueRow {
  return {
    id: String(payload.id || ""),
    therapistId: String(payload.therapist_id || ""),
    therapistName: String(payload.therapist_name || ""),
    therapistEmail: String(payload.therapist_email || ""),
    userName: String(payload.user_name || ""),
    sessionType: String(payload.session_type || "video") as AdminRevenueRow["sessionType"],
    scheduledStart: String(payload.scheduled_start || ""),
    paymentVerifiedAt: String(payload.payment_verified_at || ""),
    sessionPrice: Number(payload.session_price || 0),
    platformCommission: Number(payload.platform_commission || 0),
    therapistEarning: Number(payload.therapist_earning || 0),
    commissionRateUsed:
      payload.commission_rate_used === null || payload.commission_rate_used === undefined
        ? null
        : Number(payload.commission_rate_used),
    tierUsed: String(payload.tier_used || ""),
    paymentProvider: String(payload.payment_provider || ""),
    paymentTransactionId: String(payload.payment_transaction_id || ""),
  };
}

function normalizeAdminRevenueTherapistTotal(
  payload: Record<string, unknown>,
): AdminRevenueTherapistTotal {
  return {
    therapistId: String(payload.therapist_id || ""),
    therapistName: String(payload.therapist_name || ""),
    therapistEmail: String(payload.therapist_email || ""),
    completedSessions: Number(payload.completed_sessions || 0),
    grossRevenue: Number(payload.gross_revenue || 0),
    therapistRevenue: Number(payload.therapist_revenue || 0),
    platformRevenue: Number(payload.platform_revenue || 0),
  };
}

function normalizePatientRecord(
  payload: Record<string, unknown>,
): PatientRecord {
  return {
    id: String(payload.id),
    patient: String(payload.patient || ""),
    patientName: String(payload.patient_name || ""),
    therapist: String(payload.therapist || ""),
    therapistName: String(payload.therapist_name || ""),
    appointment: payload.appointment ? String(payload.appointment) : null,
    appointmentScheduledStart: String(
      payload.appointment_scheduled_start || "",
    ),
    notes: String(payload.notes || ""),
    diagnosisNotes: String(payload.diagnosis_notes || ""),
    recommendations: String(payload.recommendations || ""),
    sessionSummary: String(payload.session_summary || ""),
    patientProgress: String(payload.patient_progress || ""),
    nextSteps: String(payload.next_steps || ""),
    riskFlag: String(payload.risk_flag || ""),
    completedAt: String(payload.completed_at || ""),
    createdAt: String(payload.created_at || ""),
    updatedAt: String(payload.updated_at || ""),
  };
}

function normalizePatientProfile(payload: Record<string, unknown>): PatientProfile {
  return {
    id: String(payload.id || ""),
    name: String(payload.name || ""),
    email: String(payload.email || ""),
    phone: String(payload.phone || ""),
    age:
      payload.age === null || payload.age === undefined
        ? null
        : Number(payload.age),
    gender: String(payload.gender || ""),
    wellbeingGoals: String(payload.wellbeing_goals || ""),
    bio: String(payload.bio || ""),
    address: String(payload.address || ""),
    emergencyContactName: String(payload.emergency_contact_name || ""),
    emergencyContactPhone: String(payload.emergency_contact_phone || ""),
    appointmentCount: Number(payload.appointment_count || 0),
    lastAppointmentAt: String(payload.last_appointment_at || ""),
  };
}

function normalizeMessage(payload: Record<string, unknown>): Message {
  return {
    id: String(payload.id),
    conversation: String(payload.conversation || ""),
    sender: String(payload.sender || ""),
    senderName: String(payload.sender_name || ""),
    content: String(payload.content || ""),
    isRead: Boolean(payload.is_read),
    createdAt: String(payload.created_at || ""),
  };
}

function normalizeConversation(payload: Record<string, unknown>): Conversation {
  return {
    id: String(payload.id),
    appointment: payload.appointment ? String(payload.appointment) : null,
    user: String(payload.user || ""),
    userName: String(payload.user_name || ""),
    therapist: String(payload.therapist || ""),
    therapistName: String(payload.therapist_name || ""),
    isActive: Boolean(payload.is_active),
    messages: Array.isArray(payload.messages)
      ? payload.messages.map((message) =>
          normalizeMessage(message as Record<string, unknown>),
        )
      : [],
    createdAt: String(payload.created_at || ""),
  };
}

class ApiService {
  private tokens: AuthTokens | null = null;
  private refreshPromise: Promise<AuthTokens | null> | null = null;
  private unauthorizedListeners = new Set<UnauthorizedListener>();

  constructor() {
    if (isBrowser()) {
      this.tokens = this.readTokens();
    }
  }

  getBaseUrl() {
    return getApiBaseUrl();
  }

  async getPlatformStats(): Promise<PlatformStats> {
    const data = await this.request<Record<string, unknown>>("/public/stats/", {
      auth: false,
    });
    return normalizePlatformStats(data);
  }

  getTokens() {
    if (this.tokens) return this.tokens;
    this.tokens = this.readTokens();
    return this.tokens;
  }

  setTokens(tokens: AuthTokens | null) {
    this.tokens = tokens;
    if (!isBrowser()) return;
    if (tokens) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
      writeBrowserCookie(AUTH_ACCESS_COOKIE, tokens.access);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      writeBrowserCookie(AUTH_ACCESS_COOKIE, null);
    }
  }

  onUnauthorized(listener: UnauthorizedListener) {
    this.unauthorizedListeners.add(listener);
    return () => {
      this.unauthorizedListeners.delete(listener);
    };
  }

  private notifyUnauthorized() {
    this.setTokens(null);
    this.unauthorizedListeners.forEach((listener) => listener());
  }

  private readTokens(): AuthTokens | null {
    if (!isBrowser()) return null;
    const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthTokens;
    } catch {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const headers = new Headers(options.headers);
    if (
      !headers.has("Content-Type") &&
      options.body &&
      !(options.body instanceof FormData)
    ) {
      headers.set("Content-Type", "application/json");
    }

    if (options.auth !== false) {
      const access = this.getTokens()?.access;
      if (access) headers.set("Authorization", `Bearer ${access}`);
    }

    const apiUrl = buildApiUrl(endpoint);
    let response: Response;

    try {
      response = await fetch(apiUrl, {
        ...options,
        headers,
      });
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("API request failed before receiving a response.", {
          apiUrl,
          error,
        });
      }
      throw new ApiError(buildNetworkErrorMessage(apiUrl), 0, error);
    }

    const payload = await response
      .json()
      .catch(() => ({ message: response.statusText || "Request failed" }));

    if (
      response.status === 401 &&
      options.auth !== false &&
      options.retryOnAuthError !== false
    ) {
      const refreshed = await this.refreshTokens();
      if (refreshed?.access) {
        return this.request<T>(endpoint, {
          ...options,
          retryOnAuthError: false,
        });
      }
    }

    if (!response.ok) {
      if (response.status === 401 && options.auth !== false) {
        this.notifyUnauthorized();
      }
      throw new ApiError(
        getErrorMessage(payload, "Request failed"),
        response.status,
        payload,
      );
    }

    if (payload && typeof payload === "object" && "data" in payload) {
      return (payload as ApiEnvelope<T>).data;
    }

    return payload as T;
  }

  async refreshTokens(): Promise<AuthTokens | null> {
    const refresh = this.getTokens()?.refresh;
    if (!refresh) {
      this.notifyUnauthorized();
      return null;
    }
    if (!this.refreshPromise) {
      const apiUrl = buildApiUrl("/auth/login/refresh/");
      this.refreshPromise = fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      })
        .then(async (response) => {
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) {
            this.notifyUnauthorized();
            return null;
          }
          const nextTokens: AuthTokens = {
            access: String(payload.access || ""),
            refresh: String(payload.refresh || refresh),
          };
          this.setTokens(nextTokens);
          return nextTokens;
        })
        .catch((error) => {
          if (process.env.NODE_ENV !== "production") {
            console.error(
              "Token refresh request failed before receiving a response.",
              { apiUrl, error },
            );
          }
          this.notifyUnauthorized();
          return null;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }
    return this.refreshPromise;
  }

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const data = await this.request<Record<string, unknown>>("/auth/login/", {
      method: "POST",
      body: JSON.stringify(credentials),
      auth: false,
    });
    const session = {
      user: normalizeUser((data.user as Record<string, unknown>) || {}),
      tokens: {
        access: String(data.access || ""),
        refresh: String(data.refresh || ""),
      },
    };
    this.setTokens(session.tokens);
    return session;
  }

  async loginWithGoogle(credential: string): Promise<AuthSession> {
    const data = await this.request<Record<string, unknown>>("/auth/google/", {
      method: "POST",
      body: JSON.stringify({ credential }),
      auth: false,
    });
    const session = {
      user: normalizeUser((data.user as Record<string, unknown>) || {}),
      tokens: {
        access: String(data.access || ""),
        refresh: String(data.refresh || ""),
      },
    };
    this.setTokens(session.tokens);
    return session;
  }

  async register(payload: RegisterData): Promise<User> {
    const data = await this.request<Record<string, unknown>>(
      "/auth/register/",
      {
        method: "POST",
        body: JSON.stringify({
          email: payload.email,
          phone: payload.phone?.trim() ? payload.phone.trim() : null,
          first_name: payload.firstName,
          last_name: payload.lastName,
          password: payload.password,
          role: payload.role || "user",
          age: payload.age ?? null,
          gender: payload.gender || "",
          wellbeing_goals: payload.wellbeingGoals || "",
          bio: payload.bio || "",
        }),
        auth: false,
      },
    );
    return normalizeUser(data);
  }

  async applyAsTherapist(payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    age: number;
    gender: string;
    specialization: string;
    qualifications?: string;
    experienceYears?: number;
    licenseNumber: string;
    consultationFee?: number;
    languages?: string;
    bio?: string;
    profileImageFile?: File | null;
  }): Promise<Therapist> {
    const body = new FormData();
    body.append("first_name", payload.firstName);
    body.append("last_name", payload.lastName);
    body.append("email", payload.email);
    body.append("phone", payload.phone?.trim() || "");
    body.append("password", payload.password);
    body.append("age", String(payload.age));
    body.append("gender", payload.gender);
    body.append("specialization", payload.specialization);
    body.append("qualifications", payload.qualifications || "");
    body.append("experience_years", String(payload.experienceYears || 0));
    body.append("license_number", payload.licenseNumber);
    body.append("consultation_fee", String(payload.consultationFee || 0));
    body.append("languages", payload.languages || "");
    body.append("bio", payload.bio || "");
    if (payload.profileImageFile) {
      body.append("profile_image", payload.profileImageFile);
    }
    const data = await this.request<Record<string, unknown>>(
      "/therapists/apply/",
      {
        method: "POST",
        body,
        auth: false,
      },
    );
    return normalizeTherapist(data);
  }

  async logout(): Promise<void> {
    const refresh = this.getTokens()?.refresh;
    try {
      if (refresh) {
        await this.request("/auth/logout/", {
          method: "POST",
          body: JSON.stringify({ refresh }),
        });
      }
    } finally {
      this.setTokens(null);
    }
  }

  async getCurrentUser(): Promise<User> {
    const data = await this.request<Record<string, unknown>>("/auth/me/");
    return normalizeUser(data);
  }

  async forgotPassword(email: string): Promise<void> {
    await this.request("/auth/forgot-password/", {
      method: "POST",
      body: JSON.stringify({ email }),
      auth: false,
    });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await this.request("/auth/reset-password/", {
      method: "POST",
      body: JSON.stringify({ token, new_password: password }),
      auth: false,
    });
  }

  async verifyEmail(token: string): Promise<User> {
    const data = await this.request<Record<string, unknown>>(
      "/auth/verify-email/",
      {
        method: "POST",
        body: JSON.stringify({ token }),
        auth: false,
      },
    );
    return normalizeUser(data);
  }

  async resendVerification(email: string): Promise<void> {
    await this.request("/auth/resend-verification/", {
      method: "POST",
      body: JSON.stringify({ email }),
      auth: false,
    });
  }

  async getProfile(): Promise<Profile> {
    const data = await this.request<Record<string, unknown>>("/profiles/me/");
    return normalizeProfile(data);
  }

  async updateProfile(payload: Partial<Profile>): Promise<Profile> {
    const data = await this.request<Record<string, unknown>>("/profiles/me/", {
      method: "PATCH",
      body: JSON.stringify({
        age: payload.age,
        gender: payload.gender,
        wellbeing_goals: payload.wellbeingGoals,
        bio: payload.bio,
        address: payload.address,
        emergency_contact_name: payload.emergencyContactName,
        emergency_contact_phone: payload.emergencyContactPhone,
      }),
    });
    return normalizeProfile(data);
  }

  async getAssignedPatientProfiles(): Promise<PatientProfile[]> {
    const data = await this.request<Record<string, unknown>[]>(
      "/profiles/patients/",
    );
    return data.map((item) => normalizePatientProfile(item));
  }

  async getTherapists(filters: TherapistFilters = {}): Promise<Therapist[]> {
    return this.listTherapists(filters, { auth: false });
  }

  async listTherapists(
    filters: TherapistFilters = {},
    options: { auth?: boolean } = {},
  ): Promise<Therapist[]> {
    const data = await this.listTherapistsPage(filters, options);
    return data.results;
  }

  async listTherapistsPage(
    filters: TherapistFilters = {},
    options: { auth?: boolean } = {},
  ): Promise<PaginatedResponse<Therapist>> {
    const params = new URLSearchParams();
    appendPaginationParams(params, filters);
    if (filters.search) params.set("search", filters.search);
    if (filters.specialization)
      params.set("specialization", filters.specialization);
    if (filters.language) params.set("language", filters.language);
    if (filters.date) params.set("date", filters.date);
    if (filters.approvalStatus)
      params.set("approval_status", filters.approvalStatus);
    if (!filters.pageSize) params.set("page_size", "100");
    const data = await this.request<
      PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[]
    >(
      `/therapists/profiles/${params.toString() ? `?${params.toString()}` : ""}`,
      { auth: options.auth },
    );
    return normalizePaginatedResponse(data, normalizeTherapist);
  }

  async getTherapist(
    id: string,
    options: { auth?: boolean } = {},
  ): Promise<Therapist> {
    const data = await this.request<Record<string, unknown>>(
      `/therapists/profiles/${id}/`,
      {
        auth: options.auth,
      },
    );
    return normalizeTherapist(data);
  }

  async getMyTherapistProfile(): Promise<Therapist> {
    const data = await this.request<Record<string, unknown>>(
      "/therapists/profiles/me/",
    );
    return normalizeTherapist(data);
  }

  async updateMyTherapistProfile(
    payload: Partial<Therapist> & { profileImageFile?: File | null },
  ): Promise<Therapist> {
    const data = await this.request<Record<string, unknown>>(
      "/therapists/profiles/me/",
      {
        method: "PATCH",
        body: buildTherapistProfilePayload(payload),
      },
    );
    return normalizeTherapist(data);
  }

  async getMyTherapistClinic(): Promise<TherapistClinic | null> {
    const data = await this.request<Record<string, unknown> | null>(
      "/therapists/profiles/me/clinic/",
    );
    return data ? normalizeTherapistClinic(data) : null;
  }

  async saveMyTherapistClinic(payload: {
    clinicName: string;
    clinicAddress: string;
    latitude: number;
    longitude: number;
    phone?: string;
    openingHours?: string;
    notes?: string;
  }): Promise<TherapistClinic> {
    const data = await this.request<Record<string, unknown>>(
      "/therapists/profiles/me/clinic/",
      {
        method: "PUT",
        body: JSON.stringify({
          clinic_name: payload.clinicName,
          clinic_address: payload.clinicAddress,
          latitude: payload.latitude,
          longitude: payload.longitude,
          phone: payload.phone || "",
          opening_hours: payload.openingHours || "",
          notes: payload.notes || "",
        }),
      },
    );
    return normalizeTherapistClinic(data);
  }

  async approveTherapist(
    id: string,
    approvalStatus: "approved" | "rejected",
  ): Promise<Therapist> {
    const data = await this.request<Record<string, unknown>>(
      `/therapists/profiles/${id}/approve/`,
      {
        method: "POST",
        body: JSON.stringify({ approval_status: approvalStatus }),
      },
    );
    return normalizeTherapist(data);
  }

  async getTherapistCommissionRules(): Promise<TherapistCommissionRule[]> {
    const data = await this.request<
      PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[]
    >("/therapists/commission-rules/");
    const results = Array.isArray(data) ? data : data.results;
    return results.map((item) => normalizeTherapistCommissionRule(item));
  }

  async createTherapistCommissionRule(payload: {
    tierName: string;
    minSessions: number;
    maxSessions?: number | null;
    commissionRate: number;
    isActive: boolean;
  }): Promise<TherapistCommissionRule> {
    const data = await this.request<Record<string, unknown>>(
      "/therapists/commission-rules/",
      {
        method: "POST",
        body: JSON.stringify({
          tier_name: payload.tierName,
          min_sessions: payload.minSessions,
          max_sessions: payload.maxSessions ?? null,
          commission_rate: payload.commissionRate,
          is_active: payload.isActive,
        }),
      },
    );
    return normalizeTherapistCommissionRule(data);
  }

  async updateTherapistCommissionRule(
    id: string,
    payload: Partial<{
      tierName: string;
      minSessions: number;
      maxSessions: number | null;
      commissionRate: number;
      isActive: boolean;
    }>,
  ): Promise<TherapistCommissionRule> {
    const data = await this.request<Record<string, unknown>>(
      `/therapists/commission-rules/${id}/`,
      {
        method: "PATCH",
        body: JSON.stringify({
          tier_name: payload.tierName,
          min_sessions: payload.minSessions,
          max_sessions: payload.maxSessions,
          commission_rate: payload.commissionRate,
          is_active: payload.isActive,
        }),
      },
    );
    return normalizeTherapistCommissionRule(data);
  }

  async getAvailability(therapistId?: string): Promise<AvailabilitySlot[]> {
    const query = therapistId ? `?therapist=${therapistId}` : "";
    const data = await this.request<
      PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[]
    >(`/therapists/availability/${query}`);
    const results = Array.isArray(data) ? data : data.results;
    return results.map((item) =>
      normalizeAvailability(item, therapistId || ""),
    );
  }

  async createAvailability(
    startTime: string,
    endTime: string,
  ): Promise<AvailabilitySlot> {
    const data = await this.request<Record<string, unknown>>(
      "/therapists/availability/",
      {
        method: "POST",
        body: JSON.stringify({ start_time: startTime, end_time: endTime }),
      },
    );
    return normalizeAvailability(data);
  }

  async updateAvailability(
    id: string,
    startTime: string,
    endTime: string,
  ): Promise<AvailabilitySlot> {
    const data = await this.request<Record<string, unknown>>(
      `/therapists/availability/${id}/`,
      {
        method: "PATCH",
        body: JSON.stringify({ start_time: startTime, end_time: endTime }),
      },
    );
    return normalizeAvailability(data);
  }

  async deleteAvailability(id: string): Promise<void> {
    await this.request(`/therapists/availability/${id}/`, {
      method: "DELETE",
    });
  }

  async getAppointments(filters?: {
    date?: string;
    status?: string;
    page?: number;
    pageSize?: number;
    search?: string;
    allPages?: boolean;
  }): Promise<Appointment[]> {
    const data = await this.getAppointmentsPage(filters);
    return data.results;
  }

  async getAppointmentsPage(filters?: {
    date?: string;
    status?: string;
    page?: number;
    pageSize?: number;
    search?: string;
    allPages?: boolean;
  }): Promise<PaginatedResponse<Appointment>> {
    const params = new URLSearchParams();
    appendPaginationParams(params, filters);
    if (filters?.date) params.set("date", filters.date);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.allPages && !filters.pageSize) params.set("page_size", "100");
    const data = await this.request<
      PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[]
    >(`/appointments/${params.toString() ? `?${params.toString()}` : ""}`);
    if (Array.isArray(data)) {
      return normalizePaginatedResponse(data, normalizeAppointment);
    }

    const results = [...data.results];
    let nextUrl = filters?.allPages ? data.next : null;
    while (nextUrl) {
      const nextData = await this.request<PaginatedResponse<Record<string, unknown>>>(
        getEndpointFromPaginatedUrl(nextUrl),
      );
      results.push(...nextData.results);
      nextUrl = nextData.next;
    }
    return {
      count: data.count,
      next: filters?.allPages ? null : data.next,
      previous: data.previous,
      results: results.map((item) => normalizeAppointment(item)),
    };
  }

  async getAppointment(id: string): Promise<Appointment> {
    const data = await this.request<Record<string, unknown>>(
      `/appointments/${id}/`,
    );
    return normalizeAppointment(data);
  }

  async createAppointment(payload: {
    therapistId: string;
    availabilitySlotId: string;
    sessionType: string;
    notes?: string;
    bookingPaymentType?: "single" | "package";
    subscriptionId?: string;
  }): Promise<Appointment> {
    const data = await this.request<Record<string, unknown>>("/appointments/", {
      method: "POST",
      body: JSON.stringify({
        therapist: payload.therapistId,
        availability_slot: payload.availabilitySlotId,
        session_type: payload.sessionType,
        notes: payload.notes || "",
        booking_payment_type: payload.bookingPaymentType || "single",
        subscription: payload.subscriptionId || null,
      }),
    });
    return normalizeAppointment(data);
  }

  async initiateKhaltiPayment(
    appointmentId: string,
  ): Promise<KhaltiInitiation> {
    const frontendOrigin =
      typeof window !== "undefined" ? window.location.origin : undefined;
    const data = await this.request<Record<string, unknown>>(
      "/payments/khalti/initiate/",
      {
        method: "POST",
        body: JSON.stringify({
          appointment: appointmentId,
          frontend_origin: frontendOrigin,
        }),
      },
    );
    return {
      appointment: String(data.appointment || ""),
      pidx: String(data.pidx || ""),
      paymentUrl: String(data.payment_url || ""),
      amount: Number(data.amount || 0),
    };
  }

  async verifyKhaltiPayment(
    payload: { appointment?: string; pidx?: string },
    options: { auth?: boolean } = {},
  ): Promise<KhaltiVerificationResult> {
    const data = await this.request<Record<string, unknown>>(
      "/payments/khalti/verify/",
      {
        method: "POST",
        body: JSON.stringify({
          appointment: payload.appointment || undefined,
          pidx: payload.pidx || undefined,
        }),
        auth: options.auth,
      },
    );
    return {
      appointment: data.appointment
        ? normalizeAppointment(
            (data.appointment as Record<string, unknown>) || {},
          )
        : null,
      appointmentId: String(data.appointment_id || payload.appointment || ""),
      paymentStatus: String(
        data.payment_status || "unpaid",
      ) as KhaltiVerificationResult["paymentStatus"],
      bookingStatus: String(
        data.booking_status || "pending_payment",
      ) as KhaltiVerificationResult["bookingStatus"],
      lookup: (data.lookup as Record<string, unknown>) || {},
    };
  }

  async cancelAppointment(id: string, reason = ""): Promise<Appointment> {
    const data = await this.request<Record<string, unknown>>(
      `/appointments/${id}/cancel/`,
      {
        method: "POST",
        body: JSON.stringify({ reason }),
      },
    );
    return normalizeAppointment(data);
  }

  async acceptAppointment(id: string, note = ""): Promise<Appointment> {
    const data = await this.request<Record<string, unknown>>(
      `/appointments/${id}/accept/`,
      {
        method: "POST",
        body: JSON.stringify({ note }),
      },
    );
    return normalizeAppointment(data);
  }

  async rejectAppointment(id: string, note = ""): Promise<Appointment> {
    const data = await this.request<Record<string, unknown>>(
      `/appointments/${id}/reject/`,
      {
        method: "POST",
        body: JSON.stringify({ note }),
      },
    );
    return normalizeAppointment(data);
  }

  async completeAppointment(
    id: string,
    payload: {
      notes: string;
      sessionSummary: string;
      patientProgress: string;
      recommendations: string;
      nextSteps: string;
      riskFlag?: string;
      diagnosisNotes?: string;
    },
  ): Promise<Appointment> {
    const data = await this.request<Record<string, unknown>>(
      `/appointments/${id}/complete/`,
      {
        method: "POST",
        body: JSON.stringify({
          notes: payload.notes,
          session_summary: payload.sessionSummary,
          patient_progress: payload.patientProgress,
          recommendations: payload.recommendations,
          next_steps: payload.nextSteps,
          risk_flag: payload.riskFlag || "",
          diagnosis_notes: payload.diagnosisNotes || "",
        }),
      },
    );
    return normalizeAppointment(data);
  }

  async confirmAppointmentAttendance(
    id: string,
    attended: boolean,
    note?: string,
  ): Promise<Appointment> {
    const data = await this.request<Record<string, unknown>>(
      `/appointments/${id}/attendance/`,
      {
        method: "POST",
        body: JSON.stringify({ attended, note }),
      },
    );
    return normalizeAppointment(data);
  }

  async getPackagePlans(
    options: { auth?: boolean; page?: number; pageSize?: number; search?: string } = { auth: false },
  ): Promise<PackagePlan[]> {
    const data = await this.getPackagePlansPage(
      { ...options, pageSize: options.pageSize || 100 },
      options,
    );
    return data.results;
  }

  async getPackagePlansPage(
    filters?: { page?: number; pageSize?: number; search?: string },
    options: { auth?: boolean } = { auth: false },
  ): Promise<PaginatedResponse<PackagePlan>> {
    const params = new URLSearchParams();
    appendPaginationParams(params, filters);
    const data = await this.request<
      PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[]
    >(`/packages/plans/${params.toString() ? `?${params.toString()}` : ""}`, {
      auth: options.auth,
    });
    return normalizePaginatedResponse(data, normalizePackagePlan);
  }

  async createPackagePlan(payload: PackagePlanInput): Promise<PackagePlan> {
    const data = await this.request<Record<string, unknown>>(
      "/packages/plans/",
      {
        method: "POST",
        body: JSON.stringify({
          name: payload.name,
          slug: payload.slug,
          description: payload.description,
          session_credits: payload.sessionCredits,
          duration_days: payload.durationDays,
          price_amount: payload.priceAmount,
          is_active: payload.isActive,
        }),
      },
    );
    return normalizePackagePlan(data);
  }

  async updatePackagePlan(
    id: string,
    payload: Partial<PackagePlanInput>,
  ): Promise<PackagePlan> {
    const body: Record<string, unknown> = {};
    if (payload.name !== undefined) body.name = payload.name;
    if (payload.slug !== undefined) body.slug = payload.slug;
    if (payload.description !== undefined)
      body.description = payload.description;
    if (payload.sessionCredits !== undefined)
      body.session_credits = payload.sessionCredits;
    if (payload.durationDays !== undefined)
      body.duration_days = payload.durationDays;
    if (payload.priceAmount !== undefined)
      body.price_amount = payload.priceAmount;
    if (payload.isActive !== undefined) body.is_active = payload.isActive;

    const data = await this.request<Record<string, unknown>>(
      `/packages/plans/${id}/`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    );
    return normalizePackagePlan(data);
  }

  async deletePackagePlan(id: string): Promise<void> {
    await this.request(`/packages/plans/${id}/`, {
      method: "DELETE",
    });
  }

  async getMySubscriptions(): Promise<UserSubscription[]> {
    const data = await this.request<
      Record<string, unknown>[] | PaginatedResponse<Record<string, unknown>>
    >("/packages/subscriptions/me/");
    const results = Array.isArray(data) ? data : data.results;
    return results.map((item) => normalizeSubscription(item));
  }

  async purchasePackagePlan(
    planId: string,
  ): Promise<PackagePurchaseInitiation> {
    const frontendOrigin =
      typeof window !== "undefined" ? window.location.origin : undefined;
    const data = await this.request<Record<string, unknown>>(
      `/packages/plans/${planId}/purchase/`,
      {
        method: "POST",
        body: JSON.stringify({ frontend_origin: frontendOrigin }),
      },
    );
    return {
      subscription: String(data.subscription || ""),
      pidx: String(data.pidx || ""),
      paymentUrl: String(data.payment_url || ""),
      amount: Number(data.amount || 0),
    };
  }

  async verifyPackagePayment(
    payload: { subscription?: string; pidx?: string },
    options: { auth?: boolean } = {},
  ): Promise<PackageVerificationResult> {
    const data = await this.request<Record<string, unknown>>(
      "/packages/subscriptions/verify/",
      {
        method: "POST",
        body: JSON.stringify({
          subscription: payload.subscription || undefined,
          pidx: payload.pidx || undefined,
        }),
        auth: options.auth,
      },
    );
    return {
      subscription: data.subscription
        ? normalizeSubscription(
            (data.subscription as Record<string, unknown>) || {},
          )
        : null,
      subscriptionId: String(
        data.subscription_id || payload.subscription || "",
      ),
      paymentStatus: String(
        data.payment_status || "unpaid",
      ) as PackageVerificationResult["paymentStatus"],
      subscriptionStatus: String(
        data.subscription_status || "pending_payment",
      ) as PackageVerificationResult["subscriptionStatus"],
      lookup: (data.lookup as Record<string, unknown>) || {},
    };
  }

  async getMoodEntries(filters?: { date?: string }): Promise<MoodEntry[]> {
    const params = new URLSearchParams();
    if (filters?.date) params.set("date", filters.date);
    const data = await this.request<
      PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[]
    >(`/mood/${params.toString() ? `?${params.toString()}` : ""}`);
    const results = Array.isArray(data) ? data : data.results;
    return results.map((item) => normalizeMoodEntry(item));
  }

  async createMoodEntry(payload: {
    entryDate: string;
    mood: MoodEntry["mood"];
    stressLevel: number;
    energyLevel: number;
    notes?: string;
  }): Promise<MoodEntry> {
    const data = await this.request<Record<string, unknown>>("/mood/", {
      method: "POST",
      body: JSON.stringify({
        entry_date: payload.entryDate,
        mood: payload.mood,
        stress_level: payload.stressLevel,
        energy_level: payload.energyLevel,
        notes: payload.notes || "",
      }),
    });
    return normalizeMoodEntry(data);
  }

  async getCategories(): Promise<ResourceCategory[]> {
    const data = await this.getCategoriesPage({ pageSize: 100 });
    return data.results;
  }

  async getCategoriesPage(filters?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<PaginatedResponse<ResourceCategory>> {
    const params = new URLSearchParams();
    appendPaginationParams(params, filters);
    const data = await this.request<
      PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[]
    >(`/resources/categories/${params.toString() ? `?${params.toString()}` : ""}`, {
      auth: false,
    });
    return normalizePaginatedResponse(data, normalizeCategory);
  }

  async getResources(params?: {
    category?: string;
    search?: string;
  }): Promise<Resource[]> {
    return this.listResources(params, { auth: false });
  }

  async listResources(
    params?: { category?: string; search?: string },
    options: { auth?: boolean } = {},
  ): Promise<Resource[]> {
    const data = await this.listResourcesPage(params, options);
    return data.results;
  }

  async listResourcesPage(
    params?: { category?: string; search?: string; page?: number; pageSize?: number },
    options: { auth?: boolean } = {},
  ): Promise<PaginatedResponse<Resource>> {
    const search = new URLSearchParams();
    appendPaginationParams(search, params);
    if (params?.category && params.category !== "all")
      search.set("category", params.category);
    const data = await this.request<
      PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[]
    >(`/resources/${search.toString() ? `?${search.toString()}` : ""}`, {
      auth: options.auth,
    });
    return normalizePaginatedResponse(data, normalizeResource);
  }

  async getResource(
    id: string,
    options: { auth?: boolean } = {},
  ): Promise<Resource> {
    const data = await this.request<Record<string, unknown>>(
      `/resources/${id}/`,
      { auth: options.auth },
    );
    return normalizeResource(data);
  }

  async createCategory(payload: {
    name: string;
    description?: string;
  }): Promise<ResourceCategory> {
    const data = await this.request<Record<string, unknown>>(
      "/resources/categories/",
      {
        method: "POST",
        body: JSON.stringify({
          name: payload.name,
          description: payload.description || "",
        }),
      },
    );
    return normalizeCategory(data);
  }

  async updateCategory(
    id: string,
    payload: { name: string; description?: string },
  ): Promise<ResourceCategory> {
    const data = await this.request<Record<string, unknown>>(
      `/resources/categories/${id}/`,
      {
        method: "PATCH",
        body: JSON.stringify({
          name: payload.name,
          description: payload.description || "",
        }),
      },
    );
    return normalizeCategory(data);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.request(`/resources/categories/${id}/`, {
      method: "DELETE",
    });
  }

  async createResource(payload: {
    title: string;
    category: string;
    summary?: string;
    content: string;
    format: string;
    published: boolean;
  }): Promise<Resource> {
    const data = await this.request<Record<string, unknown>>("/resources/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return normalizeResource(data);
  }

  async updateResource(
    id: string,
    payload: {
      title: string;
      category: string;
      summary?: string;
      content: string;
      format: string;
      published: boolean;
    },
  ): Promise<Resource> {
    const data = await this.request<Record<string, unknown>>(
      `/resources/${id}/`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );
    return normalizeResource(data);
  }

  async deleteResource(id: string): Promise<void> {
    await this.request(`/resources/${id}/`, {
      method: "DELETE",
    });
  }

  async getNotifications(filters?: {
    date?: string;
    isRead?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<Notification[]> {
    const data = await this.getNotificationsPage(filters);
    return data.results;
  }

  async getNotificationsPage(filters?: {
    date?: string;
    isRead?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<Notification>> {
    const params = new URLSearchParams();
    appendPaginationParams(params, filters);
    if (filters?.date) params.set("date", filters.date);
    if (filters?.isRead !== undefined)
      params.set("is_read", String(filters.isRead));
    const data = await this.request<
      PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[]
    >(`/notifications/${params.toString() ? `?${params.toString()}` : ""}`);
    return normalizePaginatedResponse(data, normalizeNotification);
  }

  async markNotificationRead(id: string): Promise<Notification> {
    const data = await this.request<Record<string, unknown>>(
      `/notifications/${id}/mark_read/`,
      {
        method: "POST",
      },
    );
    return normalizeNotification(data);
  }

  async getSupportTickets(filters?: {
    status?: string;
    issueType?: string;
  }): Promise<SupportTicket[]> {
    const data = await this.getSupportTicketsPage(filters);
    return data.results;
  }

  async getSupportTicketsPage(filters?: {
    status?: string;
    issueType?: string;
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<PaginatedResponse<SupportTicket>> {
    const params = new URLSearchParams();
    appendPaginationParams(params, filters);
    if (filters?.status) params.set("status", filters.status);
    if (filters?.issueType) params.set("issue_type", filters.issueType);
    const data = await this.request<
      PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[]
    >(`/support/tickets/${params.toString() ? `?${params.toString()}` : ""}`);
    return normalizePaginatedResponse(data, normalizeSupportTicket);
  }

  async getSupportTicket(id: string): Promise<SupportTicket> {
    const data = await this.request<Record<string, unknown>>(
      `/support/tickets/${id}/`,
    );
    return normalizeSupportTicket(data);
  }

  async createSupportTicket(payload: {
    subject: string;
    issueType: SupportIssueType;
    description: string;
    appointment?: string;
    paymentReference?: string;
  }): Promise<SupportTicket> {
    const data = await this.request<Record<string, unknown>>(
      "/support/tickets/",
      {
        method: "POST",
        body: JSON.stringify({
          subject: payload.subject,
          issue_type: payload.issueType,
          description: payload.description,
          appointment: payload.appointment || null,
          payment_reference: payload.paymentReference || "",
        }),
      },
    );
    return normalizeSupportTicket(data);
  }

  async updateSupportTicketStatus(
    id: string,
    statusValue: SupportTicketStatus,
  ): Promise<SupportTicket> {
    const data = await this.request<Record<string, unknown>>(
      `/support/tickets/${id}/`,
      {
        method: "PATCH",
        body: JSON.stringify({ status: statusValue }),
      },
    );
    return normalizeSupportTicket(data);
  }

  async getSupportMessages(ticketId: string): Promise<SupportTicketMessage[]> {
    const data = await this.request<
      PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[]
    >(`/support/tickets/${ticketId}/messages/`);
    const results = Array.isArray(data) ? data : data.results;
    return results.map((item) => normalizeSupportMessage(item));
  }

  async sendSupportMessage(
    ticketId: string,
    message: string,
  ): Promise<SupportTicketMessage> {
    const data = await this.request<Record<string, unknown>>(
      `/support/tickets/${ticketId}/messages/`,
      {
        method: "POST",
        body: JSON.stringify({ message }),
      },
    );
    return normalizeSupportMessage(data);
  }

  async submitFeedback(
    appointment: string,
    rating: number,
    comment: string,
    serviceRating?: number | null,
  ): Promise<Feedback> {
    const data = await this.request<Record<string, unknown>>("/feedback/", {
      method: "POST",
      body: JSON.stringify({ appointment, rating, comment, service_rating: serviceRating ?? null }),
    });
    return normalizeFeedback(data);
  }

  async getFeedback(
    filters?: { date?: string; therapistId?: string },
    options: { auth?: boolean } = {},
  ): Promise<Feedback[]> {
    const data = await this.getFeedbackPage(filters, options);
    return data.results;
  }

  async getFeedbackPage(
    filters?: {
      date?: string;
      therapistId?: string;
      page?: number;
      pageSize?: number;
      search?: string;
    },
    options: { auth?: boolean } = {},
  ): Promise<PaginatedResponse<Feedback>> {
    const params = new URLSearchParams();
    appendPaginationParams(params, filters);
    if (filters?.date) params.set("date", filters.date);
    if (filters?.therapistId) params.set("therapist_id", filters.therapistId);
    const data = await this.request<
      PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[]
    >(`/feedback/${params.toString() ? `?${params.toString()}` : ""}`, {
      auth: options.auth,
    });
    return normalizePaginatedResponse(data, normalizeFeedback);
  }

  async getPatientRecords(filters?: {
    patientId?: string;
  }): Promise<PatientRecord[]> {
    const params = new URLSearchParams();
    if (filters?.patientId) params.set("patient_id", filters.patientId);
    const data = await this.request<
      PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[]
    >(`/patient-records/${params.toString() ? `?${params.toString()}` : ""}`);
    const results = Array.isArray(data) ? data : data.results;
    return results.map((item) => normalizePatientRecord(item));
  }

  async createPatientRecord(payload: {
    patient: string;
    appointment?: string;
    notes: string;
    diagnosisNotes?: string;
    recommendations?: string;
    sessionSummary?: string;
    patientProgress?: string;
    nextSteps?: string;
    riskFlag?: string;
  }): Promise<PatientRecord> {
    const data = await this.request<Record<string, unknown>>(
      "/patient-records/",
      {
        method: "POST",
        body: JSON.stringify({
          patient: payload.patient,
          appointment: payload.appointment || null,
          notes: payload.notes,
          diagnosis_notes: payload.diagnosisNotes || "",
          recommendations: payload.recommendations || "",
          session_summary: payload.sessionSummary || "",
          patient_progress: payload.patientProgress || "",
          next_steps: payload.nextSteps || "",
          risk_flag: payload.riskFlag || "",
        }),
      },
    );
    return normalizePatientRecord(data);
  }

  async updatePatientRecord(
    id: string,
    payload: {
      patient?: string;
      appointment?: string;
      notes?: string;
      diagnosisNotes?: string;
      recommendations?: string;
      sessionSummary?: string;
      patientProgress?: string;
      nextSteps?: string;
      riskFlag?: string;
    },
  ): Promise<PatientRecord> {
    const data = await this.request<Record<string, unknown>>(
      `/patient-records/${id}/`,
      {
        method: "PATCH",
        body: JSON.stringify({
          patient: payload.patient,
          appointment: payload.appointment || null,
          notes: payload.notes,
          diagnosis_notes: payload.diagnosisNotes,
          recommendations: payload.recommendations,
          session_summary: payload.sessionSummary,
          patient_progress: payload.patientProgress,
          next_steps: payload.nextSteps,
          risk_flag: payload.riskFlag,
        }),
      },
    );
    return normalizePatientRecord(data);
  }

  async getAdminUsers(filters?: {
    role?: string;
    isActive?: boolean;
    date?: string;
  }): Promise<User[]> {
    const data = await this.getAdminUsersPage(filters);
    return data.results;
  }

  async getAdminUsersPage(filters?: {
    role?: string;
    isActive?: boolean;
    date?: string;
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();
    appendPaginationParams(params, filters);
    if (filters?.role) params.set("role", filters.role);
    if (filters?.isActive !== undefined)
      params.set("is_active", String(filters.isActive));
    if (filters?.date) params.set("date", filters.date);
    const data = await this.request<
      PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[]
    >(`/auth/admin/users/${params.toString() ? `?${params.toString()}` : ""}`);
    return normalizePaginatedResponse(data, normalizeUser);
  }

  async getAdminUser(id: string): Promise<User> {
    const data = await this.request<Record<string, unknown>>(
      `/auth/admin/users/${id}/`,
    );
    return normalizeUser(data);
  }

  async updateAdminUser(
    id: string,
    payload: Partial<User> & { isActive?: boolean },
  ): Promise<User> {
    const data = await this.request<Record<string, unknown>>(
      `/auth/admin/users/${id}/`,
      {
        method: "PATCH",
        body: JSON.stringify({
          first_name: payload.firstName,
          last_name: payload.lastName,
          phone: payload.phone,
          role: payload.role,
          is_active: payload.isActive,
        }),
      },
    );
    return normalizeUser(data);
  }

  async activateAdminUser(id: string): Promise<User> {
    const data = await this.request<Record<string, unknown>>(
      `/auth/admin/users/${id}/activate/`,
      {
        method: "POST",
      },
    );
    return normalizeUser(data);
  }

  async deactivateAdminUser(id: string): Promise<User> {
    const data = await this.request<Record<string, unknown>>(
      `/auth/admin/users/${id}/deactivate/`,
      {
        method: "POST",
      },
    );
    return normalizeUser(data);
  }

  async getAdminRevenueReport(filters?: {
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
  }): Promise<AdminRevenueReport> {
    const params = new URLSearchParams();
    appendPaginationParams(params, {
      page: filters?.page,
      pageSize: filters?.pageSize,
      search: filters?.search,
    });
    if (filters?.dateFrom) params.set("date_from", filters.dateFrom);
    if (filters?.dateTo) params.set("date_to", filters.dateTo);

    const data = await this.request<Record<string, unknown>>(
      `/appointments/revenue-report/${params.toString() ? `?${params.toString()}` : ""}`,
    );

    const results = Array.isArray(data.results)
      ? data.results.map((item) =>
          normalizeAdminRevenueRow((item as Record<string, unknown>) || {}),
        )
      : [];
    const summary = (data.summary as Record<string, unknown>) || {};
    const therapistTotals = Array.isArray(data.therapist_totals)
      ? data.therapist_totals.map((item) =>
          normalizeAdminRevenueTherapistTotal((item as Record<string, unknown>) || {}),
        )
      : [];

    return {
      count: Number(data.count || 0),
      next: data.next ? String(data.next) : null,
      previous: data.previous ? String(data.previous) : null,
      results,
      summary: {
        completedSessions: Number(summary.completed_sessions || 0),
        grossRevenue: Number(summary.gross_revenue || 0),
        therapistRevenue: Number(summary.therapist_revenue || 0),
        platformRevenue: Number(summary.platform_revenue || 0),
      },
      therapistTotals,
    };
  }

  async getConversations(): Promise<Conversation[]> {
    const data = await this.request<
      PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[]
    >("/communications/conversations/");
    const results = Array.isArray(data) ? data : data.results;
    return results.map((item) => normalizeConversation(item));
  }

  async getMessages(conversationId?: string): Promise<Message[]> {
    const query = conversationId ? `?conversation=${conversationId}` : "";
    const data = await this.request<
      PaginatedResponse<Record<string, unknown>> | Record<string, unknown>[]
    >(`/communications/messages/${query}`);
    const results = Array.isArray(data) ? data : data.results;
    return results.map((item) => normalizeMessage(item));
  }

  async sendMessage(conversation: string, content: string): Promise<Message> {
    const data = await this.request<Record<string, unknown>>(
      "/communications/messages/",
      {
        method: "POST",
        body: JSON.stringify({ conversation, content }),
      },
    );
    return normalizeMessage(data);
  }

  async chatWithAI(message: string): Promise<AIChatReply> {
    const data = await this.request<Record<string, unknown>>("/ai/chat/", {
      method: "POST",
      body: JSON.stringify({ message }),
      auth: false,
    });
    return {
      reply: String(data.reply || ""),
    };
  }

  async chatWithRecommendations(
    message: string,
    options?: {
      conversationContext?: AIChatMessagePayload[];
      userContext?: Record<string, unknown>;
    },
  ): Promise<AIChatReply> {
    const data = await this.request<Record<string, unknown>>("/ai/chat/", {
      method: "POST",
      body: JSON.stringify({
        message,
        conversation_context: options?.conversationContext || [],
        user_context: options?.userContext || {},
      }),
      auth: false,
    });
    return {
      reply: String(data.reply || ""),
      recommendedTherapists: Array.isArray(data.recommended_therapists)
        ? data.recommended_therapists.map((item) => {
            const value = item as Record<string, unknown>;
            return {
              id: String(value.id || ""),
              name: String(value.name || ""),
              specialization: String(value.specialization || ""),
              experienceYears: Number(value.experience_years || 0),
              profileImage: String(value.profile_image || "") || undefined,
              reason: String(value.reason || ""),
              profileUrl: String(value.profile_url || ""),
            };
          })
        : [],
      recommendedResources: Array.isArray(data.recommended_resources)
        ? data.recommended_resources.map((item) => {
            const value = item as Record<string, unknown>;
            return {
              id: String(value.id || ""),
              title: String(value.title || ""),
              summary: String(value.summary || ""),
              category: String(value.category || ""),
              reason: String(value.reason || ""),
              url: String(value.url || ""),
            };
          })
        : [],
    };
  }
}

export const api = new ApiService();
export { toTitleCaseSession };
