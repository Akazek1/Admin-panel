'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import api from '@/lib/axios-instance'
import { formatDate } from '@/lib/utils'

type User = {
    id: string
    name: string | null
    email: string
    phoneNumber: string
    userType: 'INDIVIDUAL' | 'AGENCY'
    profileVerified: boolean
    createdAt: string
    updatedAt: string
    dateOfBirth?: string
    gender?: string
    firstName?: string
    lastName?: string
    isEmailVerified?: boolean
}

export default function UserDetailPage() {
    const { userId } = useParams()
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState<Partial<User>>({})

    useEffect(() => {
        setError('User management coming soon')
        setLoading(false)
    }, [userId])


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSave = async () => {
        alert('User management coming soon')
    }

    const handleDelete = async () => {
        alert('User management coming soon')
        try {
            void userId;
        } catch (error) {
            console.error('Failed to delete user:', error)
            setError('Failed to delete user')
        }
    }

    if (loading) {
        return (
            <div className="p-6">
                <p className="text-muted-foreground">Loading user data...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6">
                <p className="text-destructive">{error}</p>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="p-6">
                <p className="text-muted-foreground">User not found</p>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">User Details</h1>
                <div className="space-x-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave}>
                                Save Changes
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => router.push('/users')}>
                                Back to Users
                            </Button>
                            <Button variant="outline" onClick={() => setIsEditing(true)}>
                                Edit User
                            </Button>
                            <Button variant="destructive" onClick={handleDelete}>
                                Delete User
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>Profile Information</span>
                        <Badge variant={user.profileVerified ? 'default' : 'secondary'}>
                            {user.profileVerified ? 'Verified' : 'Unverified'}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="name">Name</Label>
                            {isEditing ? (
                                <Input
                                    id="name"
                                    name="name"
                                    value={`${user.firstName} ${user.lastName}` || ''}
                                    onChange={handleInputChange}
                                />
                            ) : (
                                <p>{`${user.firstName} ${user.lastName}` || 'Not provided'}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            {isEditing ? (
                                <Input
                                    id="email"
                                    name="email"
                                    value={formData.email || ''}
                                    onChange={handleInputChange}
                                />
                            ) : (
                                <p>{user.email}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="phoneNumber">Phone Number</Label>
                            {isEditing ? (
                                <Input
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    value={formData.phoneNumber || ''}
                                    onChange={handleInputChange}
                                />
                            ) : (
                                <p>{user.phoneNumber}</p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="userType">User Type</Label>
                            {isEditing ? (
                                <Select
                                    value={formData.userType}
                                    onValueChange={(value) => handleSelectChange('userType', value as 'INDIVIDUAL' | 'AGENCY')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select user type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                                        <SelectItem value="AGENCY">Agency</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <p>{user.userType}</p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="dateOfBirth">Date of Birth</Label>
                            {isEditing ? (
                                <Input
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    type="date"
                                    value={formData.dateOfBirth?.split('T')[0] || ''}
                                    onChange={handleInputChange}
                                />
                            ) : (
                                <p>{user.dateOfBirth ? formatDate(user.dateOfBirth) : 'Not provided'}</p>
                            )}
                        </div>
                        <div>
                            <Label>Joined Date</Label>
                            <p>{formatDate(user.createdAt)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {user.userType === 'INDIVIDUAL' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="gender">Gender</Label>
                                {isEditing ? (
                                    <Select
                                        value={formData.gender}
                                        onValueChange={(value) => handleSelectChange('gender', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MALE">Male</SelectItem>
                                            <SelectItem value="FEMALE">Female</SelectItem>
                                            <SelectItem value="OTHER">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <p>{user.gender || 'Not provided'}</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="firstName">First Name</Label>
                                {isEditing ? (
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        value={formData.firstName || ''}
                                        onChange={handleInputChange}
                                    />
                                ) : (
                                    <p>{user.firstName || 'Not provided'}</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="lastName">Last Name</Label>
                                {isEditing ? (
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        value={formData.lastName || ''}
                                        onChange={handleInputChange}
                                    />
                                ) : (
                                    <p>{user.lastName || 'Not provided'}</p>
                                )}
                            </div>
                            <div>
                                <Label>Email Verified</Label>
                                <p>{user.isEmailVerified ? 'Yes' : 'No'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 flex items-center justify-between">
                        <div>
                            <Label>User ID</Label>
                            <p className="font-mono text-sm">{user.id}</p>
                        </div>
                        <div>
                            <Label>Last Updated</Label>
                            <p>{formatDate(user.updatedAt)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}