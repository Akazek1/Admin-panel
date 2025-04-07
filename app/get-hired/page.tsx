"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ServiceProvider from "@/components/home/service-providers";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, Verified } from "lucide-react";
import BackButtonHeader from "@/components/header/back-button-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define a shared interface for common fields
interface CommonProfile {
  name: string;
  email: string;
  lastName: string;
  dob: string;
  phone: string;
  country: string;
  servicesOffered: string[];
  weekdaysHours: string;
  weekendsHours: string;
  areasServiced: string[];
}

// Define interfaces for specific profiles
interface IndividualProfile extends CommonProfile {
  languages: string;
  yearsExperience: string;
  image: string
}

interface Professional {
  name: string;
  experience: string;
  languages: string;
  services: string;
  location: string;
  rating: string;
  profileImage?: string; // Optional, as it’s a placeholder
}

interface AgencyProfile extends CommonProfile {
  certificate: File | string | null; // Updated to handle File or string (URL/path) or null
  professionals: Professional[];
  logoImage?: string; // Optional, as it’s a placeholder
}

const GetHired: React.FC = () => {
  // Simulate user type (individual or agency) for demonstration
  const userType = "individual"

  // State for individual and agency profile data (editable)
  const [individualData, setIndividualData] = useState<IndividualProfile>({
    name: "Gate",
    email: "gate@gmail.com",
    lastName: "Optional",
    dob: "12/27/1995",
    phone: "+250 467 379 999",
    country: "Rwanda",
    servicesOffered: ["Electrician"],
    weekdaysHours: "9:00 AM - 5:00 PM",
    weekendsHours: "9:00 AM - 1:00 PM",
    areasServiced: ["18. 30. 40. Condo, Townhouse, Multi-family"],
    languages: "English, Kinyarwanda",
    yearsExperience: "14.5 Years, Rwanda",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
  });

  const [agencyData, setAgencyData] = useState<AgencyProfile>({
    name: "HouseHelp",
    email: "househelp@gmail.com",
    lastName: "Optional",
    dob: "12/27/1995",
    phone: "+250 467 379 999",
    country: "Rwanda",
    servicesOffered: ["Plumbing", "Carpentry", "Roofing"],
    weekdaysHours: "9:00 AM - 5:00 PM",
    weekendsHours: "9:00 AM - 1:00 PM",
    areasServiced: ["18. 30. 40. Condo, Townhouse, Multi-family"],
    certificate: null, // Start with null, user will upload a file
    professionals: [
      {
        name: "Abakiza Sitter",
        experience: "5 Years of Experience",
        languages: "English, Kinyarwanda, Kigali",
        services: "Baby Sitter",
        location: "Nyamirambo",
        rating: "4.8 - 5,000 reviews/day",
      },
      {
        name: "Mutanguha Electrician",
        experience: "5 Years of Experience",
        languages: "English, Kinyarwanda",
        services: "Electrician",
        location: "Kinyarwanda",
        rating: "4.5 - 3,000 reviews/day",
      },
    ],
  });

  // Handle input changes for individual profile
  const handleIndividualChange = (field: keyof IndividualProfile, value: string) => {
    if (field === "servicesOffered" || field === "areasServiced") {
      setIndividualData((prev) => ({
        ...prev,
        [field]: value ? value.split(",").map((item) => item.trim()) : [],
      }));
    } else {
      setIndividualData((prev) => ({
        ...prev,
        [field]: value || "", // Ensure value is never undefined
      }));
    }
  };

  // Handle input changes for agency profile
  const handleAgencyChange = (field: keyof AgencyProfile, value: string | File | null) => {
    if (field === "servicesOffered" || field === "areasServiced") {
      setAgencyData((prev) => ({
        ...prev,
        [field]: value ? (value as string).split(",").map((item) => item.trim()) : [],
      }));
    } else if (field === "certificate" && value instanceof File) {
      setAgencyData((prev) => ({
        ...prev,
        certificate: value, // Store the File object
      }));
    } else {
      setAgencyData((prev) => ({
        ...prev,
        [field]: value as string || "", // Ensure value is never undefined
      }));
    }
  };

  // Handle file input change for certificate
  const handleCertificateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    handleAgencyChange("certificate", file);
  };



  return (
    <div className="">
      <BackButtonHeader text="Get Hired" className="p-6" backHref="/" />
      {/* Profile Header */}
      <div className="flex flex-col items-center gap-4">
        {userType === "individual" ? (

          <>
            <Avatar className="w-[120px] h-[120px]">
              <AvatarImage src={individualData.image} className="object-cover" />
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-lg font-semibold text-[#1B2431]">
                  {individualData.name}
                </h2>
                <Verified className="w-5 h-5 fill-[#145B10] stroke-white" />
              </div>
              <p className="text-sm text-[#212121] font-bold">{individualData.email}</p>
            </div>
          </>
        ) : (
          <>
            <Avatar className="w-[120px] h-[120px]">
              <AvatarImage src={individualData.image} className="object-cover" />
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-lg font-semibold text-[#1B2431]">
                  {agencyData.name}
                </h2>
                <Verified className="w-5 h-5 fill-[#145B10] stroke-white" />
              </div>
              <p className="text-sm text-[#212121] font-bold">{agencyData.email}</p>
            </div>
          </>
        )}
      </div>

      {/* Profile Details (Form with shadcn/ui Inputs) */}
      <div className="">
        {userType === "individual" ? (
          // Individual Profile Form
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <div className="space-y-2">
                  <Select
                    value={individualData.country}
                  >
                    <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none  border-none focus:ring-[#145B10] ">
                      <SelectValue placeholder="Select country" />
                      <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 focus-within:rotate-90 transition ease-in 2s" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rwanda">Agency</SelectItem>
                      <SelectItem value="USA">Agency</SelectItem>
                      {/* Add more countries as needed */}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>

                <Input
                  id="lastName"
                  value={individualData.lastName || ""}
                  onChange={(e) => handleIndividualChange("lastName", e.target.value)}
                  className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                />
              </div>
              <div>

                <Input
                  id="email"
                  value={individualData.email || ""}
                  onChange={(e) => handleIndividualChange("email", e.target.value)}
                  className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                />
              </div>
              <div>

                <Input
                  id="dob"
                  type="date"
                  value={individualData.dob || ""}
                  onChange={(e) => handleIndividualChange("dob", e.target.value)}
                  className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                />
              </div>
              <div>

                <Input
                  id="phone"
                  value={individualData.phone || ""}
                  onChange={(e) => handleIndividualChange("phone", e.target.value)}
                  className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                />
              </div>

              <div>
                <div className="space-y-2">
                  <Select
                    value={individualData.country}
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
              </div>
              <div>

                <Input
                  id="languages"
                  value={individualData.languages || ""}
                  onChange={(e) => handleIndividualChange("languages", e.target.value)}
                  className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                />
              </div>
              <div>

                <Input
                  id="yearsExperience"
                  value={individualData.yearsExperience || ""}
                  onChange={(e) => handleIndividualChange("yearsExperience", e.target.value)}
                  className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                />
              </div>
              <div>
                <Label>
                  Services Offered
                </Label>
                <Input
                  id="servicesOffered"
                  value={individualData.servicesOffered.join(", ") || ""}
                  onChange={(e) => handleIndividualChange("servicesOffered", e.target.value)}
                  className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                />
              </div>
              <div>

                <Input
                  id="weekdaysHours"
                  value={individualData.weekdaysHours || ""}
                  onChange={(e) => handleIndividualChange("weekdaysHours", e.target.value)}
                  className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                />
              </div>
              <div>

                <Input
                  id="weekendsHours"
                  value={individualData.weekendsHours || ""}
                  onChange={(e) => handleIndividualChange("weekendsHours", e.target.value)}
                  className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                />
              </div>
              <div>

                <Input
                  id="areasServiced"
                  value={individualData.areasServiced.join(", ") || ""}
                  onChange={(e) => handleIndividualChange("areasServiced", e.target.value)}
                  className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                />
              </div>
            </div>
          </div>
        ) : (
          // Agency Profile Form
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">{agencyData.name || "Agency"}</h2>
            <div className="space-y-6">
              <div>

                <Input
                  id="agencyName"
                  value={agencyData.name || ""}
                  onChange={(e) => handleAgencyChange("name", e.target.value)}
                  className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                />
              </div>
              <div>

                <Input
                  id="lastName"
                  value={agencyData.lastName || ""}
                  onChange={(e) => handleAgencyChange("lastName", e.target.value)}
                  className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                />
              </div>
              <div>

                <Input
                  id="email"
                  value={agencyData.email || ""}
                  onChange={(e) => handleAgencyChange("email", e.target.value)}
                  className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                />
              </div>
              <div>

                <Input
                  id="dob"
                  type="date"
                  value={agencyData.dob || ""}
                  onChange={(e) => handleAgencyChange("dob", e.target.value)}
                  className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                />
              </div>
              <div>

                <Input
                  id="phone"
                  value={agencyData.phone || ""}
                  onChange={(e) => handleAgencyChange("phone", e.target.value)}
                  className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                />
              </div>
              <div>
                <Input
                  id="country"
                  value={agencyData.country || ""}
                  onChange={(e) => handleAgencyChange("country", e.target.value)}
                  className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                />
              </div>
              <div>

                <Input
                  id="certificate"
                  type="file"
                  onChange={handleCertificateChange}
                  className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                  accept="application/pdf"
                />
                {agencyData.certificate instanceof File && (
                  <p className="text-sm text-gray-500 mt-1">
                    Selected file: {agencyData.certificate.name}
                  </p>
                )}
                {typeof agencyData.certificate === "string" && agencyData.certificate && (
                  <p className="text-sm text-gray-500 mt-1">
                    Current file: {agencyData.certificate}
                  </p>
                )}
              </div>
              <div>

                <Input
                  id="servicesOffered"
                  value={agencyData.servicesOffered.join(", ") || ""}
                  onChange={(e) => handleAgencyChange("servicesOffered", e.target.value)}
                  className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                />
              </div>
              <div>

                <Input
                  id="weekdaysHours"
                  value={agencyData.weekdaysHours || ""}
                  onChange={(e) => handleAgencyChange("weekdaysHours", e.target.value)}
                  className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                />
              </div>
              <div>

                <Input
                  id="weekendsHours"
                  value={agencyData.weekendsHours || ""}
                  onChange={(e) => handleAgencyChange("weekendsHours", e.target.value)}
                  className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                />
              </div>
              <div>

                <Input
                  id="areasServiced"
                  value={agencyData.areasServiced.join(", ") || ""}
                  onChange={(e) => handleAgencyChange("areasServiced", e.target.value)}
                  className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                />
              </div>
            </div>

            {/* Service Professionals for Agency */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Service Professionals</h3>
              <ServiceProvider showHeader={false} />
            </div>
          </div>
        )}
      </div>
    </div >
  );
};

export default GetHired;