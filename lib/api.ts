import axiosInstance from "@/lib/axios-instance";

export interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: "INDIVIDUAL" | "AGENCY";
  profilePicture?: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  gender?: string;
}

export async function getPendingApprovals(): Promise<Provider[]> {
  try {
    const [providersRes, agenciesRes] = await Promise.all([
      axiosInstance.get("/admin/approvals/providers"),
      axiosInstance.get("/admin/approvals/agencies"),
    ]);
    const providers = providersRes.data.data as Provider[];
    const agencies = agenciesRes.data.data as Provider[];
    return [...providers, ...agencies];
  } catch (error) {
    console.error("Failed to fetch pending approvals:", error);
    return [];
  }
}
