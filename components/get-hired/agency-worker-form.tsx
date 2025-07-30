"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, Loader2, Trash2, Pencil, XCircle, User, Mail, Phone, Languages, VenusAndMars } from "lucide-react"
import { MultiSelectLanguage } from "../multi-language-select"
import api from "@/lib/axios"
import toast from "react-hot-toast"
import { Label } from "../ui/label"

// Define interfaces
interface AgencyWorker {
    id?: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    dateOfBirth: string;
    languages: string[];
    gender: string;
}

interface WorkerResponse {
    data: AgencyWorker[];
    statusCode: number;
    message: string;
    timestamp: string;
}

const AgencyWorkerManagement: React.FC = () => {
    const [agencyWorker, setAgencyWorker] = useState<AgencyWorker>({
        firstName: "",
        lastName: "",
        phoneNumber: "",
        email: "",
        dateOfBirth: "",
        languages: [],
        gender: "",
    })
    const [nationalIdFile, setNationalIdFile] = useState<File | null>(null)
    const [workerList, setWorkerList] = useState<AgencyWorker[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null)

    // Fetch workers
    useEffect(() => {
        const getAgencyWorker = async () => {
            try {
                setIsLoading(true)
                setError(null)
                const response = await api.get<WorkerResponse>("/agency/workers")

                if (response.data && response.data.data) {
                    setWorkerList(response.data.data)
                } else {
                    throw new Error("Invalid response format")
                }
            } catch (err: unknown) {
                console.error("Error fetching workers:", err)
                setError(
                    err instanceof Error
                        ? err.message || "Failed to fetch workers. Please try again."
                        : "Failed to fetch workers. Please try again."
                )
                setWorkerList([])
            } finally {
                setIsLoading(false)
            }
        }

        getAgencyWorker()
    }, [])

    // Validate form data
    const validateForm = (workerData: AgencyWorker, file: File | null): string | null => {
        if (!workerData.firstName.trim()) return "First name is required"
        if (!workerData.lastName.trim()) return "Last name is required"
        if (!workerData.phoneNumber.trim()) return "Phone number is required"
        if (!workerData.email.trim()) return "Email is required"
        if (!workerData.dateOfBirth) return "Date of birth is required"
        if (workerData.languages.length === 0) return "At least one language is required"

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(workerData.email.trim())) return "Invalid email format"

        const phoneRegex = /^\+?[\d\s-]{10,}$/
        if (!phoneRegex.test(workerData.phoneNumber.trim())) return "Invalid phone number format"

        const dob = new Date(workerData.dateOfBirth)
        const today = new Date()
        const age = today.getFullYear() - dob.getFullYear()
        const monthDiff = today.getMonth() - dob.getMonth()
        const dayDiff = today.getDate() - dob.getDate()
        const adjustedAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age

        if (isNaN(dob.getTime()) || adjustedAge <= 18) {
            return "Worker must be older than 18 years"
        }

        if (!editingWorkerId && !file) return "National ID file is required"

        return null
    }

    // handle add or update worker
    const handleAddOrUpdateAgencyWorker = async (workerData: AgencyWorker, file: File | null) => {
        try {
            setIsLoading(true);

            const validationError = validateForm(workerData, file);
            if (validationError) {
                toast.error(validationError);
                return;
            }

            // Ensure all fields are strings
            const formData = new FormData()
            formData.append("firstName", workerData.firstName.trim())
            formData.append("lastName", workerData.lastName.trim())
            formData.append("phoneNumber", workerData.phoneNumber.trim())
            formData.append("email", workerData.email.trim())
            if (workerData.dateOfBirth) {
                formData.append("dateOfBirth", workerData.dateOfBirth)
            }
            formData.append("languages", JSON.stringify(workerData.languages.map((lang) => lang.trim())))
            if (workerData.gender) {
                formData.append("gender", workerData.gender)
            }
            if (file) {
                formData.append("file", file)
            }

            const token = localStorage.getItem("token");
            const config = {
                headers: {
                    Authorization: `Bearer ${token || ""}`,
                    "Content-Type": "multipart/form-data",
                },
                withCredentials: true,
            };

            let response;
            if (editingWorkerId) {
                response = await api.patch(`/agency/workers/${editingWorkerId}`, formData, config);
            } else {
                response = await api.post("/agency/workers", formData, config);
            }

            if (response.status === 200 || response.status === 201) {
                toast.success(editingWorkerId ? "Worker updated successfully" : "Worker added successfully");

                // Reset form
                setAgencyWorker({
                    firstName: "",
                    lastName: "",
                    phoneNumber: "",
                    email: "",
                    dateOfBirth: "",
                    languages: [],
                    gender: "",
                });
                setNationalIdFile(null);
                setEditingWorkerId(null);

                const fileInput = document.getElementById("nationalId") as HTMLInputElement | null;
                if (fileInput) fileInput.value = "";

                const updatedResponse = await api.get<WorkerResponse>("/agency/workers");
                const workersWithFlatLanguages = updatedResponse.data.data.map((worker) => ({
                    ...worker,
                    languages: (worker.languages || [])
                        .flat(Infinity)
                        .filter((lang): lang is string => typeof lang === "string" && lang.trim() !== ""),
                }));
                setWorkerList(workersWithFlatLanguages);
            }
        } catch (error: unknown) {
            const message =
                typeof error === "object" &&
                    error !== null &&
                    "response" in error &&
                    (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
                    ? Array.isArray(
                        (error as { response: { data: { message: string | string[] } } }).response.data.message
                    )
                        ? (error as { response: { data: { message: string[] } } }).response.data.message.join(", ")
                        : (error as { response: { data: { message: string } } }).response.data.message
                    : "Failed to update worker";
            console.error("Error:", message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };


    // Handle worker deletion
    const handleDeleteWorker = async (workerId: string) => {
        try {
            setIsLoading(true)
            const token = localStorage.getItem("token")
            const response = await api.delete(`/agency/workers/${workerId}`, {
                headers: {
                    Authorization: `Bearer ${token || ''}`,
                },
                withCredentials: true,
            })

            if (response.status === 200) {
                toast.success("Worker deleted successfully")
                const updatedResponse = await api.get<WorkerResponse>("/agency/workers")
                setWorkerList(updatedResponse.data.data)
            }
        } catch (error: unknown) {
            const message =
                typeof error === "object" &&
                    error !== null &&
                    "response" in error &&
                    (error as { response?: { data?: { message?: string } } }).response?.data?.message
                    ? (error as { response: { data: { message: string } } }).response.data.message
                    : "Failed to update service";
            toast.error(message);
        } finally {
            setIsLoading(false)
        }
    }


    // scroll to top while editing the worker
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle edit button click
    const handleEditWorker = (worker: AgencyWorker) => {
        setAgencyWorker({
            firstName: worker.firstName,
            lastName: worker.lastName,
            phoneNumber: worker.phoneNumber,
            email: worker.email,
            dateOfBirth: worker.dateOfBirth ? worker.dateOfBirth.split('T')[0] : '',
            languages: worker.languages,
            gender: worker.gender || '',
        })
        setEditingWorkerId(worker.id || null)
        setNationalIdFile(null)
        scrollToTop();
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        await handleAddOrUpdateAgencyWorker(agencyWorker, nationalIdFile)
    }

    return (
        <div className="space-y-8 max-w-2xl mx-auto pb-8">
            {/* Worker Form */}
            <form onSubmit={handleSubmit} className="space-y-6 flex flex-col items-center mb-5">
                <div className="space-y-0.5 w-full">
                    <Label className="text-xs font-semibold text-secondary-foreground/50">Worker&apos;s First Name</Label>
                    <Input
                        id="firstName"
                        value={agencyWorker.firstName}
                        onChange={(e) => setAgencyWorker((prev) => ({ ...prev, firstName: e.target.value }))}
                        className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                        placeholder="Worker's First Name"
                        required
                    />
                </div>
                <div className="space-y-0.5 w-full">
                    <Label className="text-xs font-semibold text-secondary-foreground/50">Worker&apos;s Last Name</Label>
                    <Input
                        id="lastName"
                        value={agencyWorker.lastName}
                        onChange={(e) => setAgencyWorker((prev) => ({ ...prev, lastName: e.target.value }))}
                        className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                        placeholder="Worker's Last Name"
                        required
                    />
                </div>
                <div className="space-y-0.5 w-full">
                    <Label className="text-xs font-semibold text-secondary-foreground/50">Worker&apos;s Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={agencyWorker.email}
                        onChange={(e) => setAgencyWorker((prev) => ({ ...prev, email: e.target.value }))}
                        className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                        placeholder="Worker's Email"
                        required
                    />
                </div>
                <div className="space-y-0.5 w-full">
                    <Label className="text-xs font-semibold text-secondary-foreground/50">Worker&apos;s Phone Number</Label>
                    <Input
                        id="phoneNumber"
                        type="tel"
                        value={agencyWorker.phoneNumber}
                        onChange={(e) => setAgencyWorker((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                        className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                        placeholder="Worker's Phone Number"
                        required
                    />
                </div>
                <MultiSelectLanguage
                    selectedLanguages={agencyWorker.languages}
                    onChange={(langs) => setAgencyWorker((prev) => ({ ...prev, languages: langs }))}
                    label="Worker's Languages"
                />
                <div className="space-y-0.5 w-full">
                    <Label className="text-xs font-semibold text-secondary-foreground/50">Worker&apos;s Gender</Label>
                    <Select
                        value={agencyWorker.gender}
                        onValueChange={(value) => setAgencyWorker((prev) => ({ ...prev, gender: value }))}
                    >
                        <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border focus:ring-[#145B10]">
                            <SelectValue placeholder="Select gender" />
                            <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 transition" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-0.5 w-full">
                    <Label className="text-xs font-semibold text-secondary-foreground/50">Worker&apos;s Date of Birth()</Label>
                    <Input
                        id="dateOfBirth"
                        type="date"
                        value={agencyWorker.dateOfBirth}
                        onChange={(e) => setAgencyWorker((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                        className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                    />
                    <span className="text-[10px] text-secondary-foreground/50">Must be older than 18</span>
                </div>
                <div className="space-y-0.5 w-full">
                    <Label className="text-xs font-semibold text-secondary-foreground/50">Worker&apos;s National ID</Label>
                    <Input
                        id="nationalId"
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => setNationalIdFile(e.target.files?.[0] || null)}
                        className="bg-white text-sm font-semibold rounded-lg px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]"
                        required={!editingWorkerId}
                    />
                </div>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#167021] text-white rounded-full font-bold leading-6 h-14 hover:bg-[#0F4D0C] transition-colors disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : editingWorkerId ? "Update Worker" : "Add Worker"}
                </Button>
            </form>

            {/* Worker List as Cards */}
            <div className="pb-5">
                <Label className="text-lg font-semibold">Your Workers</Label>
                {/* Status Messages */}
                {isLoading && (
                    <div className="flex justify-center items-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
                        <span className="text-gray-600">Loading workers...</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <XCircle className="h-5 w-5 text-red-500" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Worker Cards Grid */}
                {!isLoading && workerList.length > 0 && (
                    <div className="grid grid-cols-1 gap-5">
                        {workerList.map((worker) => (
                            <div
                                key={worker.id}
                                className="border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 bg-white"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-blue-100 text-[#145B10] rounded-full h-6 w-6 flex items-center justify-center">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div className=" min-w-0 ">
                                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                {worker.firstName} {worker.lastName}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className=" border-t border-gray-100 flex justify-end space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditWorker(worker)}
                                            className="text-[#145B10] hover:text-[#145B10]/50 border-blue-200 hover:bg-blue-50"
                                        >
                                            <Pencil className="w-4 h-4 mr-2" />

                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteWorker(worker.id || '')}
                                            className="text-red-600 hover:text-red-800 border-red-200 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />

                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                            <span className="truncate">{worker.email}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                            <span>{worker.phoneNumber || 'Not provided'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Languages className="w-4 h-4 mr-2 text-gray-400" />
                                            <span>{worker.languages?.join(", ") || "None"}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                            <VenusAndMars className="w-4 h-4 mr-2 text-gray-400" />
                                            <span>{worker.gender || "Not specified"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default AgencyWorkerManagement