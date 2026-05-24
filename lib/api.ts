import axiosInstance from "@/lib/axios-instance";

export interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  email: string | null;
  phoneNumber: string;
  roles: string[];
  isVerified: boolean;
  isBanned: boolean;
  banReason: string | null;
  createdAt: string;
}

export async function getAllUsers(): Promise<User[]> {
  const response = await axiosInstance.get("/admin/users");
  const result = response.data?.data ?? response.data;
  // Backend now returns { data: User[], meta: {...} } for pagination
  return Array.isArray(result) ? result : (result?.data ?? []);
}

export async function banUser(id: string, reason: string) {
  const response = await axiosInstance.post(`/admin/users/${id}/ban`, { reason });
  return response.data?.data ?? response.data;
}

export async function unbanUser(id: string) {
  const response = await axiosInstance.post(`/admin/users/${id}/unban`);
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
  reviewNote: string | null;
  createdAt: string;
}

export async function getReports(): Promise<Report[]> {
  const response = await axiosInstance.get("/admin/reports");
  return response.data?.data ?? response.data;
}

export async function resolveReport(id: string, status: string, note: string) {
  const response = await axiosInstance.post(`/admin/reports/${id}/resolve`, { status, note });
  return response.data?.data ?? response.data;
}

export interface Booking {
  id: string;
  serviceId: string | null;
  service: { title: string; serviceImage: string | null; priceMin: number | null } | null;
  employer: User;
  worker: User & { profilePicture: string | null };
  address: { city: string; district: string | null; sector: string | null } | null;
  status: "PENDING" | "ACCEPTED" | "COMPLETED" | "CANCELLED" | "EXPIRED";
  agreedPrice: number | null;
  scheduledFor: string | null;
  createdAt: string;
}

export async function getBookings(status?: string): Promise<Booking[]> {
  const response = await axiosInstance.get("/admin/bookings", { params: { status } });
  return response.data?.data ?? response.data;
}

export async function updateBookingStatus(id: string, status: string) {
  const response = await axiosInstance.patch(`/admin/bookings/${id}/status`, { status });
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
  type: "SERVICE_COMPANY" | "PLACEMENT_AGENCY";
  phone: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  verified: boolean;
  owner: User;
  createdAt: string;
}

export async function getPendingOrganizations(): Promise<Organization[]> {
  const response = await axiosInstance.get("/admin/organizations/pending");
  return response.data?.data ?? response.data;
}

export async function verifyOrganization(id: string) {
  const response = await axiosInstance.post(`/admin/organizations/${id}/verify`);
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
  priceMin: number | null;
  priceMax: number | null;
  priceType: string | null;
  provider: User;
  category: { name: string };
  isActive: boolean;
  createdAt: string;
}

export async function getAllServices(): Promise<Service[]> {
  const response = await axiosInstance.get("/admin/services");
  return response.data?.data ?? response.data;
}

export async function getReviews(): Promise<any[]> {
  const response = await axiosInstance.get("/admin/reviews");
  return response.data?.data ?? response.data;
}

export async function deleteReview(id: string): Promise<void> {
  await axiosInstance.delete(`/admin/reviews/${id}`);
}

export interface Document {
  id: string;
  documentUrl: string;
  type: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  user: User;
  document: Document;
  createdAt: string;
}

export async function getPendingVerifications(): Promise<VerificationRequest[]> {
  const response = await axiosInstance.get("/admin/verifications/pending");
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
    return res.data?.data ?? res.data;
  } catch (error) {
    console.error("Failed to fetch pending approvals:", error);
    return [];
  }
}
