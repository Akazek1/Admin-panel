'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import api from '@/lib/axios-instance'
import Cookies from 'js-cookie'
import { useQueryClient } from '@tanstack/react-query'
import { ADMIN_ACCESS_QUERY_KEY } from '@/lib/admin-access'
import { APP_CONFIG } from '@/constant/app.config' 

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [status, setStatus] = useState({ success: false, message: '' })
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()
    const queryClient = useQueryClient()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsPending(true)
        setStatus({ success: false, message: '' })

        try {
            const res = await api.post(
                '/auth/admin/login',
                { email, password },
                { withCredentials: true }
            )

            // Backend wraps responses as { data: { token, user } } via its
            // TransformInterceptor, so the token lives at res.data.data.token.
            // Keep older shapes as fallbacks.
            const accessToken =
                res.data?.data?.token ||
                res.data?.token ||
                res.data?.data?.accessToken

            if ((res.status === 200 || res.status === 201) && accessToken) {
                // Store token in cookie for reuse
                Cookies.set('access_token', accessToken, {
                    expires: 7, // 7 days
                    secure: true,
                    sameSite: 'Lax',
                })

                // Drop any access cached for a previous session, then hold
                // owner-issued temporary passwords on the change screen.
                queryClient.removeQueries({ queryKey: ADMIN_ACCESS_QUERY_KEY })
                const mustChange = res.data?.data?.user?.mustChangePassword === true
                router.push(mustChange ? '/admin/change-password' : '/admin')
            } else {
                console.warn('Login response missing token')
                setStatus({ success: false, message: 'Invalid credentials' })
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Something went wrong.'
            setStatus({ success: false, message: errorMsg })
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-darkBackground p-4">
            <Card className="w-full max-w-md bg-darkCard text-darkText border-gray-700">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold text-[#145B10]">
                        {APP_CONFIG.name} Admin
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Enter your credentials to access the dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {status.message && (
                            <p
                                className={`text-sm ${status.success ? 'text-green-500' : 'text-red-500'}`}
                            >
                                {status.message}
                            </p>
                        )}
                        <Button type="submit" className="w-full bg-[#145B10] hover:bg-[#145B10]/50" disabled={isPending}>
                            {isPending ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            <p>
                                Demo Credentials: <strong>admin@example.com</strong> /{' '}
                                <strong>admin123</strong>
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
