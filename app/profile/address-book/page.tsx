"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import BackButtonHeader from "@/components/header/back-button-header";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-hot-toast";
import api from "@/lib/axios";

// Interface for address data
interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// Interface for form data
interface FormData {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const AddressBook = () => {
  const [formData, setFormData] = useState<FormData>({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    isDefault: false,
  });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isFormVisible, setIsFormVisible] = useState(false);

  // Fetch addresses from /users/profile
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await api.get("/users/profile");
        console.log("API Response:", response.data); // Debug response
        // Adjust based on actual response structure
        const addressesData = response.data.data?.addresses || response.data.addresses || [];
        setAddresses(addressesData);
      } catch (err: unknown) {
        console.error("Error fetching addresses:", err);
        toast.error("Failed to fetch addresses");
      }
    };
    fetchAddresses();
  }, []);

  // Handle input changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  // Handle select changes
  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  // Handle checkbox change
  const handleCheckboxChange = useCallback((checked: boolean) => {
    setFormData((prev) => ({ ...prev, isDefault: checked }));
  }, []);

  // Validate form data
  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.street.trim()) {
      newErrors.street = "Street is required";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = "Postal code is required";
    } else if (!/^\d{5,}$/.test(formData.postalCode)) {
      newErrors.postalCode = "Invalid postal code";
    }
    if (!formData.country) {
      newErrors.country = "Country is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

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
      const payload = {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country,
        isDefault: formData.isDefault,
      };

      // Submit address to API
      const response = await api.post("/users/addresses", payload);
      setAddresses((prev) => [...prev, response.data]);
      toast.success("Address added successfully");

      // Reset form and hide it
      setFormData({
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        isDefault: false,
      });
      setIsFormVisible(false);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to add address";
      console.error("Error adding address:", err);
      setErrors({ form: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle form visibility
  const toggleFormVisibility = () => {
    setIsFormVisible((prev) => !prev);
    setErrors({});
  };

  return (
    <div className="bg-[#F1FCEF] px-6 py-11 space-y-6 min-h-screen">
      {/* Header */}
      <BackButtonHeader text="Address Book" backHref="/profile" />

      {/* Add Address Button */}
      <div
        className="flex items-center cursor-pointer gap-2 px-2"
        onClick={toggleFormVisibility}
      >
        <Plus className="text-[#167021]" />
        <h1 className="text-[#167021] font-medium text-base leading-5">
          {isFormVisible ? "Cancel" : "Add another address"}
        </h1>
      </div>

      {/* Form */}
      {isFormVisible && (
        <form onSubmit={handleSubmit} className="space-y-6 pb-4">
          {/* Street */}
          <div className="space-y-2">
            <Input
              id="street"
              name="street"
              value={formData.street}
              onChange={handleChange}
              className={`bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border ${errors.street ? "border-red-500" : "border-none"
                } focus:ring-[#145B10]`}
              placeholder="Enter street address"
            />
            {errors.street && <p className="text-red-500 text-sm">{errors.street}</p>}
          </div>

          {/* City */}
          <div className="space-y-2">
            <Input
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className={`bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border ${errors.city ? "border-red-500" : "border-none"
                } focus:ring-[#145B10]`}
              placeholder="Enter city"
            />
            {errors.city && <p className="text-red-500 text-sm">{errors.city}</p>}
          </div>

          {/* State */}
          <div className="space-y-2">
            <Input
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className={`bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border ${errors.state ? "border-red-500" : "border-none"
                } focus:ring-[#145B10]`}
              placeholder="Enter state"
            />
            {errors.state && <p className="text-red-500 text-sm">{errors.state}</p>}
          </div>

          {/* Postal Code */}
          <div className="space-y-2">
            <Input
              id="postalCode"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              className={`bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border ${errors.postalCode ? "border-red-500" : "border-none"
                } focus:ring-[#145B10]`}
              placeholder="Enter postal code"
            />
            {errors.postalCode && <p className="text-red-500 text-sm">{errors.postalCode}</p>}
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Select
              value={formData.country}
              onValueChange={(value) => handleSelectChange("country", value)}
            >
              <SelectTrigger
                id="country"
                className={`relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border ${errors.country ? "border-red-500" : "border-none"
                  } focus:ring-[#145B10]`}
              >
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Rwanda">Rwanda</SelectItem>
                <SelectItem value="USA">USA</SelectItem>
                <SelectItem value="UK">UK</SelectItem>
                <SelectItem value="India">India</SelectItem>
              </SelectContent>
            </Select>
            {errors.country && <p className="text-red-500 text-sm">{errors.country}</p>}
          </div>

          {/* Default Address Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={handleCheckboxChange}
            />
            <label
              htmlFor="isDefault"
              className="text-sm font-semibold text-[#161616]"
            >
              Set as default address
            </label>
          </div>

          {/* Submit Button */}
          <Button
            size="lg"
            type="submit"
            className="w-full bg-[#167021] text-white rounded-full font-bold leading-6 py-[18px] px-4 h-full hover:bg-[#0F4D0C] transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Address"
            )}
          </Button>
        </form>
      )}

      <Separator />

      {/* Display Addresses */}
      <div className="space-y-6">
        {addresses.length === 0 ? (
          <p className="text-[#757575] font-medium text-sm">
            No addresses found. Add an address above.
          </p>
        ) : (
          addresses.map((address, index) => (
            <div key={address.id} className="space-y-2">
              <h1 className="text-[#161616] text-base leading-5 font-semibold">
                {address.isDefault ? "Default Address" : `Address ${index + 1}`}
              </h1>
              <p className="text-[#757575] font-medium text-sm max-w-[70%]">
                {`${address.street},  ${address.state}, ${address.postalCode}, ${address.city}, ${address.country}`}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AddressBook;