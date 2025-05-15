"use client";
import React, { useState } from "react";
import { Camera, Verified } from "lucide-react";
import { Avatar, AvatarImage } from "../ui/avatar";
import api from "@/lib/axios";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { updateUser } from "@/store/slices/auth-slice";

type ProfileImageUploaderProps = {
    className?: string;
};

const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({
    className = "",
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useSelector((state: RootState) => state.auth);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.id) return;

        setIsUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await api.patch("/users/profile/image", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.data?.imageUrl) {
                dispatch(updateUser({ profileURL: response.data.data.imageUrl }));
            }
        } catch (err: unknown) {
            if (err instanceof Error && (err as { response?: { data?: { message?: string } } })?.response?.data?.message) {
                setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || "An error occurred");
            } else {
                setError("Failed to update profile image");
            }
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <label htmlFor="profile-image" className={`relative cursor-pointer group ${className}`}>
                <Avatar className={`w-[120px] h-[120px] ${isUploading ? "animate-pulse" : ""}`}>
                    <AvatarImage src={user?.profileURL || "/images/user.png"} className="object-cover" />
                </Avatar>
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white" />
                </div>
                <input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={isUploading}
                />
            </label>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex items-center justify-center">
                <h2 className="text-xl font-bold text-[#1B2431] leading-[120%]">
                    {user?.firstName} {user?.lastName}
                </h2>
                {user?.isProfileComplete && (
                    <Verified className="w-5 h-5 fill-[#145B10] stroke-white" />
                )}
            </div>
            <p className="text-sm text-center text-[#212121] font-bold leading-[140%]">
                {user?.email || user?.phoneNumber}
            </p>
        </div>
    );
};

export default ProfileImageUploader;
