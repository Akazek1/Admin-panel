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
import { APP_CONFIG } from '@/constant/app.config' 

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [status, setStatus] = useState({ success: false, message: '' })
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsPending(true)
        setStatus({ success: false, message: '' })

        try {
            const res = await api.post(
                '/admin/login',
                { email, password },
                { withCredentials: true }
            )

            const accessToken = res.data?.data?.accessToken

            if (res.status === 201 && accessToken) {
                // Store token in cookie for reuse
                Cookies.set('access_token', accessToken, {
                    expires: 7, // 7 days
                    secure: true,
                    sameSite: 'Lax',
                })

                router.push('/admin')
            } else {
                setStatus({ success: false, message: 'Invalid credentials' })
            }
        } catch (err) {
            setStatus({ success: false, message: 'Something went wrong.' })
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
                                placeholder="admin123"
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
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        <p>
                            Demo Credentials: <strong>admin@example.com</strong> /{' '}
                            <strong>admin123</strong>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
