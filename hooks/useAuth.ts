"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import type { RootState, AppDispatch } from "@/store";
import {
  sendOtp,
  verifyOtp,
  logout,
  getCurrentUser,
  resetAuthState,
  setPhoneNumber,
  updateUser,
} from "@/store/slices/auth-slice";
import type { SendOtpRequest, VerifyOtpRequest } from "@/services/auth-service";
import { toast } from "react-hot-toast";

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, error, otpSent, phoneNumber } =
    useSelector((state: RootState) => state.auth);

  // Check authentication status on mount
  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, isAuthenticated, user]);

  // Send OTP function
  const handleSendOtp = async (data: SendOtpRequest) => {
    try {
      // Validate phone number before dispatching
      if (!data.phoneNumber || data.phoneNumber.length < 9) {
        toast.error("Please enter a valid phone number (at least 9 digits)");
        return false;
      }

      dispatch(setPhoneNumber(data.phoneNumber));

      // Prevent duplicate OTP requests
      if (isLoading) {
        return false;
      }

      await dispatch(sendOtp(data)).unwrap();
      return true;
    } catch (error) {
      console.error("Error sending OTP:", error);
      return false;
    }
  };

  // Verify OTP function
  const handleVerifyOtp = async (otp: string) => {
    if (!phoneNumber) {
      toast.error(
        "Phone number is missing. Please go back and enter your phone number."
      );
      return false;
    }

    try {
      if (otp.length !== 6) {
        toast.error("Please enter a valid 6-digit OTP");
        return false;
      }

      const data: VerifyOtpRequest = {
        phoneNumber,
        otp,
      };

      const result = await dispatch(verifyOtp(data)).unwrap();

      if (result.token) {
        return true;
      } else {
        toast.error("Invalid OTP please try again.");
      }
    } catch (error) {
      console.error("OTP verification failed:", error);
      return false;
    }
  };

  // Logout function
  const handleLogout = async () => {
    await dispatch(logout());
    router.push("/onboarding"); // Redirect to onboarding page after logout
  };

  // Update user profile with userType locally
  const updateUserProfile = async (data: { userType: string }) => {
    try {
      if (!data.userType) {
        toast.error("User type is required");
        return false;
      }

      // Normalize userType input (capitalize each word)
      const toTitleCase = (str: string) =>
        str
          .toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

      const normalizedUserType = toTitleCase(data.userType.trim());

      const validUserTypes = [
        "Individual",
        "Agency",
      ] as const;

      if (
        !validUserTypes.includes(
          normalizedUserType as (typeof validUserTypes)[number]
        )
      ) {
        toast.error("Invalid user type");
        return false;
      }

      if (isLoading) {
        toast.error("Please wait, another request is in progress");
        return false;
      }

      dispatch(
        updateUser({
          userType: normalizedUserType as (typeof validUserTypes)[number],
          isProfileComplete: true,
        })
      );

      // Update localStorage
      if (typeof window !== "undefined" && user) {
        const updatedUser = {
          ...user,
          userType: normalizedUserType,
          isProfileComplete: true,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } else {
        toast.error("User data not found");
        return false;
      }

      toast.success("User profile updated successfully");
      return true;
    } catch (error) {
      const err = error as Error;
      const message = err.message || "Failed to update user profile";
      console.error("Error updating user profile:", error);
      toast.error(message);
      return false;
    }
  };

  // Reset auth state (clear errors)
  const resetAuth = () => {
    dispatch(resetAuthState());
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    otpSent,
    phoneNumber,
    sendOtp: handleSendOtp,
    verifyOtp: handleVerifyOtp,
    logout: handleLogout,
    updateUserProfile,
    resetAuth,
    setPhoneNumber: (phone: string) => dispatch(setPhoneNumber(phone)),
  };
};
