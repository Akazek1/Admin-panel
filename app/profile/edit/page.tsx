"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { ChevronDown, Loader2, CalendarIcon, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BackButtonHeader from "@/components/header/back-button-header";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { updateUser } from "@/store/slices/auth-slice";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import Image from "next/image";

// Interface for form data to ensure type safety
interface FormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  country: string;
  phone: string;
  gender: string;
  languages: string[]; // Array for multi-select
  street: string;
  city: string;
  state: string;
  postalCode: string;
}

const EditProfile = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState<FormData>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split("T")[0] : "",
    email: user?.email || "",
    country: user?.country || "Rwanda",
    phone: user?.phoneNumber || "",
    gender: user?.gender || "",
    languages: user?.languages || [], // Initialize as array
    street: "",
    city: "",
    state: "",
    postalCode: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    // Initialize form data with user data if available
    const fetchUserData = async () => {
      if (user) {
        try {
          const response = await api.get(`/users/profile`);
          const userData = response.data?.data || {};
          setFormData((prev) => ({
            ...prev,
            firstName: userData.firstName || "",
            lastName: userData.lastName || "",
            dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split("T")[0] : "",
            email: userData.email || "",
            country: userData.country || "Rwanda",
            phone: userData.phoneNumber || "",
            gender: userData.gender || "",
            languages: userData.languages || [],
            street: userData.address?.street || "",
            city: userData.address?.city || "",
            state: userData.address?.state || "",
            postalCode: userData.address?.postalCode || "",
          }));
        } catch {
          toast.error("Failed to load user data");
        }
      }
    };
    fetchUserData();
  }, [user]);

  // Redirect if user is not authenticated
  React.useEffect(() => {
    if (!user) {
      toast.error("User not authenticated");
      router.push("/onboarding");
    }
  }, [user, router]);

  // Handle input changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  // Handle select changes for non-array fields
  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  // Handle language selection
  const handleLanguageChange = useCallback((language: string) => {
    setFormData((prev) => {
      const languages = prev.languages.includes(language)
        ? prev.languages.filter((lang) => lang !== language)
        : [...prev.languages, language];
      return { ...prev, languages };
    });
    setErrors((prev) => ({ ...prev, languages: "" }));
  }, []);

  // Toggle dropdown
  const toggleLanguageDropdown = useCallback(() => {
    setIsLanguageDropdownOpen((prev) => !prev);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Validate form data
  const validateForm = useCallback(() => {
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
    if (!formData.country) {
      newErrors.country = "Country is required";
    }
    if (formData.languages.length === 0) {
      newErrors.languages = "At least one language is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  if (!user) {
    return null;
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        languages: formData.languages, // Already an array
        userType: user.userType === "Agency" ? "AGENCY" : "INDIVIDUAL",
      };

      // Update profile via API
      const profileResponse = await api.post("/users/complete-profile", profilePayload);
      const userData = profileResponse?.data?.data;

      // Update Redux store with response data
      const updatedUser = {
        id: userData.id,
        phoneNumber: userData.phoneNumber,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        userType: userData.userType,
        isProfileComplete: userData.isProfileComplete ?? user.isProfileComplete,
        isMobileVerified: userData.isMobileVerified ?? user.isMobileVerified,
        isEmailVerified: userData.isEmailVerified ?? user.isEmailVerified,
        gender: userData.gender,
        dateOfBirth: userData.dateOfBirth,
        languages: userData.languages,
        country: userData.country,
      };

      dispatch(updateUser(updatedUser));

      toast.success("Profile updated successfully");
      router.push("/profile");
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update profile";
      setErrors({ form: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Available languages
  const availableLanguages = ["Kinyarwanda", "English", "French", "Swahili"];

  return (
    <div className="bg-[#F1FCEF] px-6 py-11 space-y-6 min-h-screen">
      {/* Header */}
      <BackButtonHeader text="Edit Profile" backHref="/profile" />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 pb-4">
        {/* First Name */}
        <div className="space-y-2">
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={`bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border ${errors.firstName ? "border-red-500" : "border-none"} focus:ring-[#145B10]`}
            placeholder="Enter first name"
          />
          {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
        </div>

        {/* Last Name */}
        <div className="space-y-2">
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
            placeholder="Enter last name (Optional)"
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
              className={`bg-white text-sm font-semibold rounded-lg px-5 py-[18px] pl-10 focus:outline-none border ${errors.dateOfBirth ? "border-red-500" : "border-none"} focus:ring-[#145B10]`}
            />
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
          {errors.dateOfBirth && <p className="text-red-500 text-sm">{errors.dateOfBirth}</p>}
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
              className={`bg-white text-sm font-semibold rounded-lg px-5 py-[18px] pl-10 focus:outline-none border ${errors.email ? "border-red-500" : "border-none"} focus:ring-[#145B10]`}
              placeholder="Enter email"
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
        </div>

        {/* Country */}
        <div className="space-y-2">
          <div className="space-y-2">
            <Input
              id="country"
              name="country"
              value="Rwanda"
              disabled
              className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10] text-gray-500"
            />
          </div>
          {errors.country && <p className="text-red-500 text-sm">{errors.country}</p>}
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <div className="flex items-center border border-black rounded-xl overflow-hidden w-full h-14">
            <div className="flex items-center gap-2 pl-2 pr-4 h-full border-r border-black bg-white">
              <Image
                height={16}
                width={24}
                src="https://flagcdn.com/w40/rw.png"
                alt="Rwanda Flag"
                className="w-6 h-4 object-cover rounded-sm"
              />
              <span className="text-[#212121] font-semibold text-sm">+256</span>
            </div>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              value={formData?.phone || ""}
              placeholder="Phone Number"
              onChange={handleChange}
              className="h-full w-full px-4 text-[#212121] font-semibold text-sm
                                                             placeholder:text-[#212121] placeholder:font-semibold placeholder:text-sm
                                                             border-none outline-none focus:outline-none focus:ring-0 focus:border-none
                                                             active:outline-none active:ring-0 active:border-none shadow-none"
              maxLength={10}
            />
          </div>
          {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Select
            value={formData.gender}
            onValueChange={(value) => handleSelectChange("gender", value)}
          >
            <SelectTrigger
              id="gender"
              className={`relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border ${errors.gender ? "border-red-500" : "border-none"} focus:ring-[#145B10]`}
            >
              <SelectValue placeholder="Select gender" />
              <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 focus-within:rotate-180 transition ease-in duration-200" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && <p className="text-red-500 text-sm">{errors.gender}</p>}
        </div>

        {/* Languages Spoken */}
        <div className="space-y-2 relative" ref={dropdownRef}>
          <div
            onClick={toggleLanguageDropdown}
            className={`relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border ${errors.languages ? "border-red-500" : "border-none"} focus:ring-[#145B10] cursor-pointer flex items-center justify-between`}
          >
            <span>
              {formData.languages.length > 0 ? formData.languages.join(", ") : "Select languages"}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-black fill-black transition-transform duration-200 ${isLanguageDropdownOpen ? "rotate-180" : ""}`}
            />
          </div>
          {isLanguageDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {availableLanguages.map((language) => (
                <div
                  key={language}
                  onClick={() => handleLanguageChange(language)}
                  className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100"
                >
                  <span className="flex-1">{language}</span>
                  {formData.languages.includes(language) && (
                    <span className="text-green-500 ml-2">✓</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {errors.languages && <p className="text-red-500 text-sm">{errors.languages}</p>}
        </div>

        {/* Address Fields */}
        {/* <div className="space-y-2">
          <Input
            id="street"
            name="street"
            value={formData.street}
            onChange={handleChange}
            className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
            placeholder="Enter street address"
          />
        </div> */}

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