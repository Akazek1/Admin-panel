"use client";
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input"; // shadcn/ui Input
import { Button } from "@/components/ui/button"; // shadcn/ui Button
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // shadcn/ui Select
import { CalendarIcon, Mail } from "lucide-react"; // Lucide icons for date and email
import BackButtonHeader from "@/components/header/back-button-header";

const EditProfile = () => {
  // Sample initial user data (you can fetch this from an API or context)
  const [formData, setFormData] = useState({
    firstName: "Gatete",
    lastName: "",
    dateOfBirth: "12/27/1995",
    email: "gatete@yourdomain.com",
    country: "Rwanda",
    phone: "+1 111 467 378 399",
    gender: "Male",
    languages: "",
    address: "12345, Old Year, Rwanda",
  });

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Profile updated:", formData);
    // Add your API call or logic here to update the profile
  };

  return (
    <div className="bg-[#F1FCEF] px-6 py-11 space-y-6">
      {/* Header */}
      <BackButtonHeader text="Edit Profile" />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* First Name */}
        <div className="space-y-2">
          <Input
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none  border-none focus:ring-[#145B10] "
            placeholder="Enter first name"
          />
        </div>

        {/* Last Name (Optional) */}
        <div className="space-y-2">
          <Input
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none  border-none focus:ring-[#145B10] "
            placeholder="Enter last name"
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
              className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] pl-10 focus:outline-none  border-none focus:ring-[#145B10] "
            />
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
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
              className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] pl-10 focus:outline-none  border-none focus:ring-[#145B10] "
              placeholder="Enter email"
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Country */}
        <div className="space-y-2">
          <Select
            value={formData.country}
            onValueChange={(value) => handleSelectChange("country", value)}
          >
            <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none  border-none focus:ring-[#145B10] ">
              <SelectValue placeholder="Select country" />
              <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 focus-within:rotate-90 transition ease-in 2s" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Rwanda">Rwanda</SelectItem>
              <SelectItem value="USA">USA</SelectItem>
              <SelectItem value="UK">UK</SelectItem>
              {/* Add more countries as needed */}
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
            className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none  border-none focus:ring-[#145B10] "
            placeholder="Enter phone number"
          />
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Select
            value={formData.gender}
            onValueChange={(value) => handleSelectChange("gender", value)}
          >
            <SelectTrigger className="bg-white relative text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none  border-none focus:ring-[#145B10] ">
              <SelectValue placeholder="Select gender" />
              <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 focus-within:rotate-90 transition ease-in 2s" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Languages Spoken */}
        <div className="space-y-2">
          <Select
            value={formData.languages}
            onValueChange={(value) => handleSelectChange("languages", value)}
          >
            <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none  border-none focus:ring-[#145B10] ">
              <SelectValue placeholder="Select languages" />
              <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 focus-within:rotate-90 transition ease-in 2s" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Kinyarwanda">Kinyarwanda</SelectItem>
              <SelectItem value="French">French</SelectItem>
              {/* Add more languages as needed */}
            </SelectContent>
          </Select>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none  border-none focus:ring-[#145B10] "
            placeholder="Enter address"
          />
        </div>

        {/* Update Button */}
        <Button
          size={"lg"}
          type="submit"
          className="w-full bg-[#167021] text-white rounded-full font-bold leading-6 py-[18px] px-4 h-full hover:bg-[#0F4D0C] transition-colors"
        >
          Update
        </Button>
      </form>
    </div>
  );
};

export default EditProfile;
