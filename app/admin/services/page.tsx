"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import axiosInstance from "@/lib/axios-instance"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"
import { getPendingApprovals, Provider } from "@/lib/api"

// Mock fallback data for providers/agencies
const fallbackProviders: Provider[] = [
    {
        id: "prov-x",
        firstName: "Mock",
        lastName: "Provider",
        email: "mock@provider.com",
        userType: "AGENCY",
        profilePicture: "/placeholder.svg?height=48&width=48",
        phoneNumber: "0000000000",
        isEmailVerified: false,
    },
]

export default function AdminApprovalsPage() {
    const [providers, setProviders] = useState<Provider[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    // Fetch pending approvals on mount
    useEffect(() => {
        async function fetchData() {
            const data = await getPendingApprovals()
            const unverifiedProviders = data.filter((p) => !p.isEmailVerified)
            setProviders(unverifiedProviders.length > 0 ? unverifiedProviders : fallbackProviders)
            setLoading(false)
        }
        fetchData()
    }, [])

    // Handle approve action
    const handleApprove = async (providerId: string) => {
        try {
            await axiosInstance.patch(`/admin/approvals/${providerId}/approve`)
            toast({ title: "Success", description: "Provider approved successfully." })
            const data = await getPendingApprovals()
            const unverifiedProviders = data.filter((p) => !p.isEmailVerified)
            setProviders(unverifiedProviders.length > 0 ? unverifiedProviders : fallbackProviders)
        } catch (error) {
            console.error("Failed to approve provider:", error)
            toast({ title: "Error", description: "Failed to approve provider.", variant: "destructive" })
        }
    }

    // Handle decline action
    const handleDecline = async (providerId: string) => {
        try {
            await axiosInstance.patch(`/admin/approvals/${providerId}/decline`)
            toast({ title: "Success", description: "Provider declined and deleted successfully." })
            const data = await getPendingApprovals()
            const unverifiedProviders = data.filter((p) => !p.isEmailVerified)
            setProviders(unverifiedProviders.length > 0 ? unverifiedProviders : fallbackProviders)
        } catch (error) {
            console.error("Failed to decline provider:", error)
            toast({ title: "Error", description: "Failed to decline provider.", variant: "destructive" })
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen">Loading Providers...</div>
    }

    return (
        <div className="flex flex-col w-full min-h-screen p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
            <section className="mb-16">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-3xl font-bold text-darkText">Pending Approvals</h3>
                </div>
                {providers.length === 0 ? (
                    <p className="text-muted-foreground">No providers or agencies pending approval.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {providers.map((provider) => (
                            <Card
                                key={provider.id}
                                className="bg-darkCard border-none rounded-lg overflow-hidden shadow-lg transition-transform duration-200 hover:scale-[1.02]"
                            >
                                <Image
                                    src={provider?.profilePicture ? provider.profilePicture : "/placeholder.svg?height=400&width=400"}
                                    alt={`${provider.firstName} ${provider.lastName}`}
                                    width={300}
                                    height={340}
                                    className="w-full h-44"
                                />
                                <CardHeader className="p-3">
                                    <CardTitle className="text-xl font-semibold text-darkText">
                                        {provider.firstName} {provider.lastName}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-3">
                                    <p className="text-sm text-muted-foreground mb-2">Email: {provider.email}</p>
                                    <p className="text-sm text-muted-foreground mb-2">Type: {provider.userType}</p>
                                    <p className="text-sm text-muted-foreground mb-2">Gender: {provider.gender || "NOT DEFINED"}</p>
                                    {provider.phoneNumber && (
                                        <p className="text-sm text-muted-foreground mb-4">Phone: {provider.phoneNumber}</p>
                                    )}
                                    <div className="flex space-x-4">
                                        <Button
                                            onClick={() => handleApprove(provider.id)}
                                            className="bg-green-600 text-white"
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            onClick={() => handleDecline(provider.id)}
                                            variant="destructive"
                                        >
                                            Decline
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}