"use client"

import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import { LogOut } from "lucide-react"

export function LogoutButton() {
    const router = useRouter()

    const handleLogout = async () => {
        try {
            // Clear the access token cookie
            Cookies.remove("access_token", { path: "/" })

            // Clear any other stored auth data
            localStorage.removeItem("token")

            // Redirect to login page
            router.push("/auth/login")
            window.location.reload()
        } catch (error) {
            console.error("Logout failed:", error)
            // Still redirect to login even if API call fails
            router.push("/auth/login")
        }
    }

    return (
        <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-sidebarActive transition-colors w-full"
        >
            <LogOut className="h-5 w-5" />
            Logout
        </button>
    )
}