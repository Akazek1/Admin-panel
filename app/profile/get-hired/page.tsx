"use client";

import React, { useState } from "react";
import { ChevronDown, SquarePlus } from "lucide-react";
import BackButtonHeader from "@/components/header/back-button-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProfileImageUploader from "@/components/profile/profile-img-uloader";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { useAuth } from "@/hooks/useAuth";
import { updateUser } from "@/store/slices/auth-slice";
import { toast } from "react-hot-toast";
import IndividualForm from "@/components/get-hired/individual-form";
import { Label } from "@/components/ui/label";
import AgencyWorkerForm from "@/components/get-hired/agency-worker-form";
import Link from "next/link";
import EditProfile from "@/components/edit-profile";


const GetHired: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { updateUserProfile } = useAuth();
    const [showWorkerForm, setShowWorkerForm] = useState(false)

    // Determine if user is coming for the first time
    const [selectedUserType, setSelectedUserType] = useState<"Individual" | "Agency">(user?.userType as "Individual" | "Agency" || "Individual");


    const handleUserTypeChange = async (value: "Individual" | "Agency") => {
        setSelectedUserType(value);

        try {
            // Update the user profile on the server
            const success = await updateUserProfile({
                userType: value,
            }, user);

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


    const handleAddWorker = () => {
        setShowWorkerForm((p) => !p)
    }

    return (
        <div className="">
            <div className="p-6 flex items-center justify-between">
                <BackButtonHeader text="Get Hired" backHref="/profile" />
                {
                    user?.userType === "Agency" && !showWorkerForm ? (
                        <SquarePlus onClick={handleAddWorker} className="text-[#145B10] w-6 h-6 cursor-pointer" />
                    ) : (
                        <Link href={"/profile/edit"} type="button" className="p-1.5 rounded-sm bg-transparent hover:bg-transparent text-[#145B10] border text-sm font-semibold border-[#145B10]">
                            Edit Personal Info
                        </Link>
                    )
                }
            </div>
            {
                showWorkerForm ? <div className="px-6 pb-6">
                    <AgencyWorkerForm />
                </div> : <div className="pb-10">
                    <ProfileImageUploader />
                    <div className="px-6 pt-6">
                        <div className="space-y-0.5">
                            <Label className="font-semibold text-secondary-foreground/50 text-xs">User Type</Label>
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
                        <div className="">
                           <EditProfile idEditable={false} />
                            <div className="px-6 space-y-6">


                                <div className="text-[#1B2431] text-lg font-medium">
                                    Services Offered
                                </div>
                                <IndividualForm isWorker={false} />
                            </div>
                        </div>
                    ) : (
                        // Agency Profile Form
                        <>
                            <EditProfile idEditable={false} />
                            <div className="p-6">
                                <Label className="text-base pb-5 font-semibold">Add Service</Label>
                                <IndividualForm isWorker={true} />
                            </div>
                        </>
                    )}
                </div>
            }

        </div >
    );
};

export default GetHired;