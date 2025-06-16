"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import ServiceProvider from "@/components/home/service-providers";
import { ChevronDown, SquarePlus } from "lucide-react";
import BackButtonHeader from "@/components/header/back-button-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProfileImageUploader from "@/components/profile/profile-img-uloader";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { updateUser } from "@/store/slices/auth-slice";
import { toast } from "react-hot-toast";
import IndividualForm from "@/components/get-hired/individual-form";

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
    price: string;
}

interface Professional {
    name: string;
    experience: string;
    languages: string;
    services: string;
    location: string;
    rating: string;
    profileImage?: string;
}

interface AgencyProfile extends CommonProfile {
    certificate: File | string | null;
    professionals: Professional[];
    logoImage?: string;
}

const GetHired: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { updateUserProfile } = useAuth();

    // Determine if user is coming for the first time
    const [selectedUserType, setSelectedUserType] = useState<"Individual" | "Agency">(user?.userType as "Individual" | "Agency" || "Individual");
    // State for individual and agency profile data (editable)
    const [individualData, setIndividualData] = useState<IndividualProfile>({
        name: "",
        email: "",
        lastName: "",
        dob: "",
        phone: "",
        country: "",
        servicesOffered: [],
        weekdaysHours: "",
        weekendsHours: "",
        areasServiced: [],
        languages: "",
        yearsExperience: "",
        image: "",
        price: "",
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

    const handleUserTypeChange = async (value: "Individual" | "Agency") => {
        setSelectedUserType(value);

        try {
            // Update the user profile on the server
            const success = await updateUserProfile({
                userType: value,
            });

            if (success) {
                // Update Redux state
                dispatch(updateUser({ userType: value }));
            }
        } catch (error) {
            const message = (error as Error).message || "Failed to update user type";
            toast.error(message);
            // Revert the local state if the API call fails
            setSelectedUserType(user?.userType as "Individual" | "Agency" || "Individual");
        }
    };

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
            <div className="p-6 flex items-center justify-between">
                <BackButtonHeader text="Get Hired" backHref="/profile" />
                {
                    user?.userType === "Agency" && (
                        <SquarePlus className="text-[#145B10] w-6 h-6" />
                    )
                }
            </div>
            <ProfileImageUploader />
            {/* Profile Details (Form with shadcn/ui Inputs) */}
            <div className="pb-10">
                <div className="px-6 pt-6">
                    <div className="space-y-2">
                        <Select
                            value={user?.userType || selectedUserType}
                            disabled
                            onValueChange={handleUserTypeChange}
                        >
                            <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]">
                                <SelectValue placeholder="Select user type" />
                                <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 focus-within:rotate-90 transition ease-in 2s" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Individual">Individual</SelectItem>
                                <SelectItem value="Agency">Agency</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {user?.userType === "Individual" ? (
                    // Individual Profile Form
                    <div className="p-6">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    defaultValue={user?.firstName}
                                    className={`bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]`}
                                    placeholder="Enter first name"
                                />
                            </div>

                            {/* Last Name */}
                            <div className="space-y-2">
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    defaultValue={user?.lastName}
                                    className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                                    placeholder="Enter last name(Optional)"
                                />
                            </div>
                            <div>
                                <Input
                                    id="#0F4D0C"
                                    type="date"
                                    placeholder="Date of Birth"
                                    value={user?.dateOfBirth || ""}
                                    onChange={(e) => handleIndividualChange("email", e.target.value)}
                                    className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                                />
                            </div>
                            <div>
                                <Input
                                    id="email"
                                    defaultValue={user?.email || ""}
                                    onChange={(e) => handleIndividualChange("email", e.target.value)}
                                    className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Select
                                    value={individualData.country}
                                >
                                    <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none  border-none focus:ring-[#145B10] ">
                                        <SelectValue placeholder="Select country" className="text-sm font-semibold" />
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
                            <div className="flex items-center border border-black rounded-xl overflow-hidden w-full">
                                <div className="flex items-center gap-2 pl-3 pr-5 py-4 border-r border-black bg-white">
                                    <Image
                                        height={40}
                                        width={40}
                                        src="https://flagcdn.com/w40/rw.png"
                                        alt="Rwanda Flag"
                                        className="w-6 h-4 object-cover rounded-sm"
                                    />
                                    <span className="text-[#212121] font-semibold text-sm">+256</span>
                                </div>
                                <Input
                                    id="phone"
                                    type="tel"
                                    inputMode="numeric"
                                    value={user?.phoneNumber || ""}
                                    placeholder="Phone Number"
                                    onChange={(e) => handleIndividualChange("phone", e.target.value)}
                                    className="px-4 py-4 w-full text-[#212121] font-semibold placeholder:text-[#212121] placeholder:font-semibold placeholder:text-sm 
                                                border-none focus:outline-none focus:ring-0 focus:border-transparent 
                                                active:outline-none active:ring-0 active:border-transparent shadow-none"
                                    autoFocus
                                    maxLength={10}
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
                            <div className="space-y-2">
                                <Select
                                    value={user?.gender}
                                >
                                    <SelectTrigger
                                        id="gender"
                                        className={`relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border focus:ring-[#145B10]`}
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
                            </div>
                            <div className="space-y-2">
                                <Select
                                    value={user?.gender}
                                >
                                    <SelectTrigger
                                        id="gender"
                                        className={`relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border focus:ring-[#145B10]`}
                                    >
                                        <SelectValue placeholder="Select Language" />
                                        <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 focus-within:rotate-180 transition ease-in duration-200" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Kinyarwanda">Kinyarwanda</SelectItem>
                                        <SelectItem value="English">English</SelectItem>
                                        <SelectItem value="French">French</SelectItem>
                                        <SelectItem value="Swahili">
                                            Swahili
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="text-[#1B2431] text-lg font-medium">
                                Services Offered
                            </div>
                            <IndividualForm />
                        </div>
                    </div>
                ) : (
                    // Agency Profile Form
                    <div className="p-6">
                        <div className="space-y-6">
                            <div>
                                <Input
                                    id="agencyName"
                                    defaultValue={agencyData.name || ""}
                                    onChange={(e) => handleAgencyChange("name", e.target.value)}
                                    className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                                />
                            </div>
                            <div>

                                <Input
                                    id="lastName"
                                    defaultValue={agencyData.lastName || ""}
                                    onChange={(e) => handleAgencyChange("lastName", e.target.value)}
                                    className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                                />
                            </div>
                            <div>

                                <Input
                                    id="email"
                                    defaultValue={agencyData.email || ""}
                                    onChange={(e) => handleAgencyChange("email", e.target.value)}
                                    className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                                />
                            </div>
                            <div>

                                <Input
                                    id="dob"
                                    type="date"
                                    defaultValue={agencyData.dob || ""}
                                    onChange={(e) => handleAgencyChange("dob", e.target.value)}
                                    className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                                />
                            </div>
                            <div>

                                <Input
                                    id="phone"
                                    defaultValue={agencyData.phone || ""}
                                    onChange={(e) => handleAgencyChange("phone", e.target.value)}
                                    className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                                />
                            </div>
                            <div>
                                <Input
                                    id="country"
                                    defaultValue={agencyData.country || ""}
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
                                    defaultValue={agencyData.servicesOffered.join(", ") || ""}
                                    onChange={(e) => handleAgencyChange("servicesOffered", e.target.value)}
                                    className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                                />
                            </div>
                            <div>

                                <Input
                                    id="weekdaysHours"
                                    defaultValue={agencyData.weekdaysHours || ""}
                                    onChange={(e) => handleAgencyChange("weekdaysHours", e.target.value)}
                                    className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                                />
                            </div>
                            <div>

                                <Input
                                    id="weekendsHours"
                                    defaultValue={agencyData.weekendsHours || ""}
                                    onChange={(e) => handleAgencyChange("weekendsHours", e.target.value)}
                                    className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                                />
                            </div>
                            <div>

                                <Input
                                    id="areasServiced"
                                    defaultValue={agencyData.areasServiced.join(", ") || ""}
                                    onChange={(e) => handleAgencyChange("areasServiced", e.target.value)}
                                    className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                                />
                            </div>
                        </div>

                        {/* Service Professionals for Agency */}
                        {
                            user && user.userType === "Agency" && (
                                <div className="mt-6">
                                    <h3 className="text-lg font-semibold mb-4">Service Professionals</h3>
                                    <ServiceProvider showHeader={false} />
                                </div>
                            )
                        }
                    </div>
                )}
            </div>
        </div >
    );
};

export default GetHired;