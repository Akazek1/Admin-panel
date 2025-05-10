"use client";
import React, { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Mail } from "lucide-react";
import BackButtonHeader from "@/components/header/back-button-header";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { updateUser } from "@/store/slices/auth-slice";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

const EditProfile = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  console.log("user in edit profile", user);
  

  // Initialize form with user data or defaults
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : "",
    email: user?.email || "",
    country: user?.country || "",
    phone: user?.phoneNumber || "",
    gender: user?.gender || "",
    languages: user?.languages?.join(",") || "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for the field when user types
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Validate form data
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else if (isNaN(new Date(formData.dateOfBirth).getTime())) {
      newErrors.dateOfBirth = "Invalid date of birth";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("User not authenticated");
      router.push("/onboarding");
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Prepare profile update payload
      const profilePayload = {
        phoneNumber: formData.phone,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        gender: formData.gender.toUpperCase(),
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        languages: formData.languages
          .split(",")
          .map((lang) => lang.trim())
          .filter(Boolean),
        userType: user?.userType,
        profilePicture: "/images/user.png",
        // profilePicture: user.profileURL || null,
      };

      // Update profile
      const profileResponse = await api.post("/users/complete-profile", profilePayload);

      const userData = profileResponse.data.data?.user || profileResponse.data;

      // Update Redux store with response data
      const updatedUser = {
        id: userData.data.id,
        phoneNumber: userData.data.phoneNumber,
        firstName: userData.data.firstName,
        lastName: userData.data.lastName,
        email: userData.data.email,
        userType: userData.data.userType,
        isProfileComplete: userData.data.isProfileComplete ?? user.isProfileComplete,
        isMobileVerified: userData.data.isMobileVerified ?? user.isMobileVerified,
        isEmailVerified: userData.data.isEmailVerified ?? user.isEmailVerified,
        profileURL: userData.data.profilePicture ?? user.profileURL,
        gender: userData.data.gender,
        dateOfBirth: userData.data.dateOfBirth,
        languages: userData.data.languages,
      };

      dispatch(updateUser(updatedUser));

      toast.success("Profile updated successfully");
      // router.push("/profile");
    } catch (err: unknown) {
      const errorMessage = (err as unknown as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update profile";
      setErrors({ form: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#F1FCEF] px-6 py-11 space-y-6">
      {/* Header */}
      <BackButtonHeader text="Edit Profile" />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 pb-4">
        {/* First Name */}
        <div className="space-y-2">
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={`bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10] ${errors.firstName ? "border-red-500" : ""}`}
            placeholder="Enter first name"
          />
          {errors.firstName && (
            <p className="text-red-500 text-sm">{errors.firstName}</p>
          )}
        </div>

        {/* Last Name */}
        <div className="space-y-2">
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
            placeholder="Enter last name(Optional)"
          />
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <div className="relative">
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className={`bg-white text-sm font-semibold rounded-lg px-5 py-[18px] pl-10 focus:outline-none border-none focus:ring-[#145B10] ${errors.dateOfBirth ? "border-red-500" : ""}`}
            />
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
          {errors.dateOfBirth && (
            <p className="text-red-500 text-sm">{errors.dateOfBirth}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <div className="relative">
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`bg-white text-sm font-semibold rounded-lg px-5 py-[18px] pl-10 focus:outline-none border-none focus:ring-[#145B10] ${errors.email ? "border-red-500" : ""}`}
              placeholder="Enter email"
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Select
            value={formData.country}
            onValueChange={(value) => handleSelectChange("country", value)}
          >
            <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]">
              <SelectValue placeholder="Select country" />
              <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 focus-within:rotate-90 transition ease-in 2s" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Rwanda">Rwanda</SelectItem>
              <SelectItem value="USA">USA</SelectItem>
              <SelectItem value="UK">UK</SelectItem>
              <SelectItem value="India">India</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10] ${errors.phone ? "border-red-500" : ""}`}
            placeholder="Enter phone number"
          />
          {errors.phone && (
            <p className="text-red-500 text-sm">{errors.phone}</p>
          )}
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Select
            value={formData.gender}
            onValueChange={(value) => handleSelectChange("gender", value)}
          >
            <SelectTrigger className={`bg-white relative text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10] ${errors.gender ? "border-red-500" : ""}`}>
              <SelectValue placeholder="Select gender" />
              <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 focus-within:rotate-90 transition ease-in 2s" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && (
            <p className="text-red-500 text-sm">{errors.gender}</p>
          )}
        </div>

        {/* Languages Spoken */}
        <div className="space-y-2">
          <Input
            id="languages"
            name="languages"
            value={formData.languages}
            onChange={handleChange}
            className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
            placeholder="Enter languages (comma-separated)"
          />
        </div>

        {/* Address Fields */}
        <div className="space-y-2">
          <Input
            id="street"
            name="street"
            value={formData.street}
            onChange={handleChange}
            className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
            placeholder="Enter street address"
          />
        </div>

        {/* Update Button */}
        <Button
          size="lg"
          type="submit"
          className="w-full bg-[#167021] text-white rounded-full font-bold leading-6 py-[18px] px-4 h-full hover:bg-[#0F4D0C] transition-colors"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update"
          )}
        </Button>
      </form>
    </div>
  );
};

export default EditProfile;