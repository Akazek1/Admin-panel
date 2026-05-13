'use client'

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import api from '@/lib/axios-instance'
import { Loader2 } from 'lucide-react'

type User = {
    id: string
    name: string | null
    email: string
    phoneNumber: string
    userType: 'INDIVIDUAL' | 'AGENCY'
    profileVerified: boolean
    createdAt: string
    [key: string]: any
}

export default function UserManagementPage() {
    const [users, setUsers] = useState<{ customers: User[]; agencies: User[] }>({
        customers: [],
        agencies: [],
    })
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const router = useRouter()

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setUsers({ customers: [], agencies: [] })
        setLoading(false)
    }

    const handleDelete = async (userId: string) => {
        void userId;
        alert('User management coming soon');
    }

    const filteredUsers = (type: 'customers' | 'agencies') => {
        return users[type].filter(user =>
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            user?.phoneNumber?.includes(searchTerm)
        )
    }

    const UserTable = ({ title, data }: { title: string; data: User[] }) => (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>{title}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                        {data.length} {data.length === 1 ? 'user' : 'users'}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <p className="text-muted-foreground">No users found.</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((user) => (
                                <TableRow key={user.id} className="hover:bg-muted/50">
                                    <TableCell>
                                        <div className="font-medium">
                                            {user.name || 'No name provided'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>{user.email}</div>
                                        <div className="text-sm text-muted-foreground">{user.phoneNumber}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.profileVerified ? 'default' : 'secondary'}>
                                            {user.profileVerified ? 'Verified' : 'Unverified'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(user.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(`/admin/users/${user.id}`)}
                                        >
                                            View
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(user.id)}
                                        >
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">User Management</h1>
                <div className="w-1/3">
                    <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center min-h-full">
                    <Loader2 className="w-6 h-6 animate-spin" />
                </div>
            ) : (
            <>
                <UserTable title="Customers" data={filteredUsers('customers')} />
                <UserTable title="Agencies" data={filteredUsers('agencies')} />
            </>
            )}
        </div>
    )
}