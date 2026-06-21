import axiosInstance from "@/lib/axios-instance";

function unwrapList<T>(payload: any): T[] {
  const result = payload?.data ?? payload;
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

export interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  email: string | null;
  phoneNumber: string;
  roles: string[];
  accountType?: "INDIVIDUAL" | "STAFFING_AGENCY" | "COMPANY" | null;
  isProvider?: boolean | null;
  isAdmin?: boolean | null;
  isVerified: boolean;
  isBanned: boolean;
  banReason: string | null;
  profilePicture?: string | null;
  profileImages?: string[];
  gender?: string | null;
  dateOfBirth?: string | null;
  educationLevel?: string | null;
  trustScore?: number;
  jobsCompleted?: number;
  onTimeRate?: number;
  healthStatus?: string | null;
  preferredWorkTime?: string | null;
  topQualities?: string[];
  isMobileVerified?: boolean;
  isEmailVerified?: boolean;
  governmentIdStatus?: string | null;
  registeredById?: string | null;
  ownedOrg?: { name: string } | null;
  agency?: { name: string } | null;
  addresses?: Array<{ id: string; city: string; district?: string | null; sector?: string | null; street?: string | null; isDefault?: boolean }>;
  services?: Array<{ 
    id: string; 
    title: string; 
    description?: string;
    serviceImage?: string | null;
    serviceImages?: string[];
    priceMin?: number | null;
    priceMax?: number | null;
    priceType?: string | null;
    isActive?: boolean;
    createdAt: string;
    category?: { name: string };
    _count?: { bookings: number; reviews: number; bookmarks: number };
  }>;
  reviewsReceived?: Array<{ id: string; rating: number; comment?: string; author?: { firstName: string; lastName: string }; createdAt: string; reply?: string; repliedAt?: string }>;
  reportsReceived?: Array<{ id: string; reason: string; description?: string; status: string; createdAt: string }>;
  bookingsAsWorker?: Array<{ id: string; status: string; createdAt: string; service?: { title: string }; job?: { title: string }; employer?: { firstName: string; lastName: string } }>;
  bookingsAsEmployer?: Array<{ id: string; status: string; createdAt: string; service?: { title: string }; job?: { title: string }; worker?: { firstName: string; lastName: string } }>;
  documents?: Array<{ id: string; type: string; status: string; documentUrl: string; documentFileName: string }>;
  notifications?: Array<{ id: string; title: string; body: string; status: string; createdAt: string }>;
  auditHistory?: Array<{ id: string; action: string; actor?: { firstName: string; lastName: string }; createdAt: string; metadata?: any }>;
  verificationRequests?: Array<{ id: string; status: string; reviewNote?: string | null; reviewedAt?: string | null; createdAt: string }>;
  createdAt: string;
  updatedAt?: string | null;
  lastActiveAt?: string | null;
  _count?: { bookingsAsWorker?: number; bookingsAsEmployer?: number; reportsReceived?: number; services?: number };
}

export async function getAllUsers(): Promise<User[]> {
  const response = await axiosInstance.get("/admin/users");
  return unwrapList<User>(response.data);
}

export async function banUser(id: string, reason: string) {
  const response = await axiosInstance.post(`/admin/users/${id}/ban`, { reason });
  return response.data?.data ?? response.data;
}

export async function unbanUser(id: string) {
  const response = await axiosInstance.post(`/admin/users/${id}/unban`);
  return response.data?.data ?? response.data;
}

export async function forceLogoutUser(id: string) {
  const response = await axiosInstance.post(`/admin/users/${id}/force-logout`);
  return response.data?.data ?? response.data;
}

export async function updateUserProfile(id: string, data: any) {
  const response = await axiosInstance.patch(`/admin/users/${id}/profile`, data);
  return response.data?.data ?? response.data;
}

export async function uploadUserDocument(id: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosInstance.post(`/admin/users/${id}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data?.data ?? response.data;
}

export interface Report {
  id: string;
  reporterId: string;
  reporter: User;
  targetId: string;
  target: User;
  reason: string;
  description: string | null;
  evidence: string[];
  status: "PENDING" | "REVIEWING" | "RESOLVED" | "DISMISSED";
  reviewedBy: string | null;
  reviewer: { firstName: string; lastName: string } | null;
  reviewedAt?: string | null;
  reviewNote: string | null;
  createdAt: string;
}

export async function getReports(): Promise<Report[]> {
  const response = await axiosInstance.get("/admin/reports");
  return unwrapList<Report>(response.data);
}

export async function resolveReport(id: string, status: string, note: string) {
  const response = await axiosInstance.post(`/admin/reports/${id}/resolve`, { status, note });
  return response.data?.data ?? response.data;
}

export interface Booking {
  id: string;
  serviceId: string | null;
  service: { title: string; serviceImage: string | null; priceMin: number | null } | null;
  job?: { title: string } | null;
  employer: User;
  worker: User & { profilePicture: string | null };
  address: { city: string; district: string | null; sector: string | null } | null;
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  notes?: string | null;
  agreedPrice: number | null;
  scheduledFor: string | null;
  createdAt: string;
}

export async function getBookings(status?: string): Promise<Booking[]> {
  const response = await axiosInstance.get("/admin/bookings", { params: { status } });
  return unwrapList<Booking>(response.data);
}

export async function updateBookingStatus(id: string, status: string) {
  const response = await axiosInstance.patch(`/admin/bookings/${id}/status`, { status });
  return response.data?.data ?? response.data;
}

export async function overrideBooking(id: string, data: { status: string; reason?: string; note?: string }) {
  const response = await axiosInstance.patch(`/admin/bookings/${id}/override`, data);
  return response.data?.data ?? response.data;
}

export async function unlockOtp(phoneNumber: string) {
  const response = await axiosInstance.post("/admin/otp/unlock", { phoneNumber });
  return response.data?.data ?? response.data;
}

export async function getStats() {
  const response = await axiosInstance.get("/admin/dashboard/stats");
  return response.data?.data ?? response.data;
}

// Categories
export interface Category {
  id: string;
  name: string;
  nameKn: string | null;
  nameFr: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
}

export async function createCategory(data: any): Promise<Category> {
  const response = await axiosInstance.post("/admin/categories", data);
  return response.data?.data ?? response.data;
}

export async function updateCategory(id: string, data: any): Promise<Category> {
  const response = await axiosInstance.patch(`/admin/categories/${id}`, data);
  return response.data?.data ?? response.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await axiosInstance.delete(`/admin/categories/${id}`);
}

// Organizations
export interface Organization {
  id: string;
  name: string;
  type: "SERVICE_COMPANY" | "STAFFING_AGENCY";
  phone: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  verified: boolean;
  owner: User;
  workers?: User[];
  placements?: AgencyPlacement[];
  _count?: { workers: number; placements: number };
  createdAt: string;
}

export interface AgencyPlacement {
  id: string;
  agencyId: string;
  agency: { id: string; name: string; type: string; verified: boolean };
  workerId: string;
  worker: User;
  employerId: string;
  employer: User;
  commissionPaid: boolean;
  commissionAmount: number | null;
  status: "ACTIVE" | "TERMINATED" | "OPTED_OUT";
  placedAt: string;
  endedAt: string | null;
}

export async function getOrganizations(params?: { verified?: string; type?: "SERVICE_COMPANY" | "STAFFING_AGENCY" | string }): Promise<Organization[]> {
  const response = await axiosInstance.get("/admin/organizations", { params });
  return unwrapList<Organization>(response.data);
}

export async function getPendingOrganizations(): Promise<Organization[]> {
  const response = await axiosInstance.get("/admin/organizations/pending");
  return unwrapList<Organization>(response.data);
}

export async function verifyOrganization(id: string) {
  const response = await axiosInstance.post(`/admin/organizations/${id}/verify`);
  return response.data?.data ?? response.data;
}

export async function updateOrganization(id: string, data: any) {
  const response = await axiosInstance.patch(`/admin/organizations/${id}`, data);
  return response.data?.data ?? response.data;
}

export async function getPlacements(params?: { status?: string; agencyId?: string; commissionPaid?: string }): Promise<AgencyPlacement[]> {
  const response = await axiosInstance.get("/admin/placements", { params });
  return unwrapList<AgencyPlacement>(response.data);
}

export async function updatePlacement(id: string, data: any): Promise<AgencyPlacement> {
  const response = await axiosInstance.patch(`/admin/placements/${id}`, data);
  return response.data?.data ?? response.data;
}

export async function optOutAgencyWorker(workerId: string, reason: string) {
  const response = await axiosInstance.post(`/admin/placements/workers/${workerId}/opt-out`, { reason });
  return response.data?.data ?? response.data;
}

// Audit Logs
export interface AuditLog {
  id: string;
  actorId: string;
  actor: { firstName: string; lastName: string };
  action: string;
  targetType: string;
  targetId: string;
  metadata: any;
  createdAt: string;
}

export async function getAuditLogs(page = 1, limit = 50): Promise<{ data: AuditLog[]; meta: any }> {
  const response = await axiosInstance.get("/admin/audit-logs", { params: { page, limit } });
  return response.data?.data ?? response.data;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  serviceImage?: string | null;
  priceMin: number | null;
  priceMax: number | null;
  priceType: string | null;
  serviceAreas?: string[];
  provider: User;
  category: { id?: string; name: string };
  _count?: { bookings: number; bookmarks: number; reviews: number };
  isActive: boolean;
  createdAt: string;
}

export async function getAllServices(): Promise<Service[]> {
  const response = await axiosInstance.get("/admin/services");
  return unwrapList<Service>(response.data);
}

export async function updateService(id: string, data: any): Promise<Service> {
  const response = await axiosInstance.patch(`/admin/services/${id}`, data);
  return response.data?.data ?? response.data;
}

export async function deleteService(id: string): Promise<void> {
  await axiosInstance.delete(`/admin/services/${id}`);
}

// --- Company service-card approval (Project 2 Phase E) ---
// Company-owned service cards start PENDING and stay hidden until an admin
// approves them. These power the /admin/company-services queue.
export type ServiceApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CompanyService {
  id: string;
  title: string;
  description: string | null;
  serviceImage?: string | null;
  serviceImages?: string[];
  priceMin: number | null;
  priceMax: number | null;
  priceType: string | null;
  serviceAreas?: string[];
  isActive: boolean;
  approvalStatus: ServiceApprovalStatus;
  company: {
    id: string;
    name: string;
    type?: string;
    logoUrl: string | null;
    verified: boolean;
  } | null;
  category: { id?: string; name: string };
  createdAt: string;
}

export async function getCompanyServices(
  status?: ServiceApprovalStatus,
): Promise<CompanyService[]> {
  const response = await axiosInstance.get("/admin/company-services", {
    params: status ? { status } : undefined,
  });
  return unwrapList<CompanyService>(response.data);
}

export async function approveCompanyService(id: string) {
  const response = await axiosInstance.post(`/admin/company-services/${id}/approve`);
  return response.data?.data ?? response.data;
}

export async function rejectCompanyService(id: string) {
  const response = await axiosInstance.post(`/admin/company-services/${id}/reject`);
  return response.data?.data ?? response.data;
}

export async function getReviews(): Promise<any[]> {
  const response = await axiosInstance.get("/admin/reviews");
  return unwrapList<any>(response.data);
}

export async function updateReview(id: string, data: any): Promise<any> {
  const response = await axiosInstance.patch(`/admin/reviews/${id}`, data);
  return response.data?.data ?? response.data;
}

export async function deleteReview(id: string): Promise<void> {
  await axiosInstance.delete(`/admin/reviews/${id}`);
}

export interface Document {
  id: string;
  documentUrl: string;
  type: string;
  status?: string;
  documentFileName?: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  user: User;
  document: Document;
  status?: string;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  reviewer?: { id: string; firstName: string | null; lastName: string | null; email: string | null } | null;
  createdAt: string;
}

export async function getPendingVerifications(): Promise<VerificationRequest[]> {
  const response = await axiosInstance.get("/admin/verifications/pending");
  return unwrapList<VerificationRequest>(response.data);
}

export async function getVerification(id: string): Promise<VerificationRequest> {
  const response = await axiosInstance.get(`/admin/verifications/${id}`);
  return response.data?.data ?? response.data;
}

export async function approveVerification(id: string) {
  const response = await axiosInstance.post(`/admin/verifications/${id}/approve`);
  return response.data?.data ?? response.data;
}

export async function rejectVerification(id: string, reason: string) {
  const response = await axiosInstance.post(`/admin/verifications/${id}/reject`, { reason });
  return response.data?.data ?? response.data;
}

// Deprecated or legacy
export async function getPendingApprovals(): Promise<any[]> {
  try {
    const res = await axiosInstance.get("/admin/verifications/pending");
    return unwrapList<any>(res.data);
  } catch (error) {
    console.error("Failed to fetch pending approvals:", error);
    return [];
  }
}
