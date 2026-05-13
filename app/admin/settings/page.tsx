"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/lib/axios-instance";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

// Fallback banner URL
const fallbackBannerUrl = "/placeholder.svg?height=400&width=1200";

interface Banner {
    url: string;
}

export default function AdminBannerPage() {
    const [banner, setBanner] = useState<Banner | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Fetch current banner
    useEffect(() => {
        async function fetchBanner() {
            try {
                const res = await axiosInstance.get("/admin/banner");
                setBanner(res.data.data as Banner);
            } catch (error: any) {
                console.error("Failed to fetch banner:", error);
                setBanner({ url: fallbackBannerUrl });
                toast({
                    title: "Error",
                    description: error.response?.data?.message || "Failed to fetch banner. Showing placeholder.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        }
        fetchBanner();
    }, []);

    // Handle file selection
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        console.log("Selected file:", selectedFile);
        if (selectedFile) {
            // Validate file type and size (2MB to match backend)
            if (!["image/png", "image/jpeg", "image/jpg"].includes(selectedFile.type)) {
                toast({ title: "Error", description: "Please upload a PNG or JPEG image.", variant: "destructive" });
                return;
            }
            if (selectedFile.size > 2 * 1024 * 1024) {
                toast({ title: "Error", description: "File size must be less than 2MB.", variant: "destructive" });
                return;
            }
            setFile(selectedFile);
            setFileName(selectedFile.name);
            toast({ title: "File Selected", description: `Selected: ${selectedFile.name}` });
        } else {
            setFile(null);
            setFileName("");
            toast({ title: "No File", description: "No file was selected.", variant: "destructive" });
        }
    };

    const handleUpload = async () => {
        toast({ title: "Coming Soon", description: "Banner upload is not yet available.", variant: "destructive" });
    };

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="w-6 h-6 animate-spin" />
        </div>;
    }

    return (
        <div className="flex flex-col w-full min-h-screen p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
            <Card className="bg-darkCard border-none rounded-lg shadow-lg">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-darkText">Banner Management</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {/* Current Banner */}
                    <div className="mb-8">
                        <h4 className="text-xl font-semibold text-darkText mb-4">Current Banner</h4>
                        {banner ? (
                            <Image
                                src={banner.url || fallbackBannerUrl}
                                width={1200}
                                height={500}
                                alt="Current Banner"
                                className="w-full h-[400px] object-cover rounded-lg"
                            />
                        ) : (
                            <p className="text-muted-foreground">No banner available.</p>
                        )}
                    </div>

                    {/* Upload New Banner */}
                    <div>
                        <h4 className="text-xl font-semibold text-darkText mb-4">Upload New Banner</h4>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="banner" className="text-sm font-medium text-darkText">
                                    Select Image (PNG/JPEG, max 2MB)
                                </Label>
                                <input
                                    id="banner"
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg"
                                    onChange={handleFileChange}
                                    className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#145B10] file:text-white hover:file:bg-green-700"
                                />
                                {fileName ? (
                                    <p className="text-sm text-muted-foreground mt-2">Selected: {fileName}</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground mt-2">No file selected</p>
                                )}
                            </div>
                            <Button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="bg-[#145B10] text-white"
                            >
                                {uploading ? "Uploading..." : "Upload Banner"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}