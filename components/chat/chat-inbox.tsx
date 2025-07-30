"use client"
import { motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { cn } from "@/lib/utils"
import api from "@/lib/axios"
import toast from "react-hot-toast"
import { initializeSocket } from "@/lib/socket"
import type { RootState } from "@/store"
import { useSelector } from "react-redux"
import type { Socket } from "socket.io-client"

// Define interfaces
interface Message {
  id: string
  bookingId: string
  senderId: string
  content: string
  createdAt: string
  isRead: boolean
  sender: {
    id: string
    firstName: string
    lastName: string
  }
}

interface Booking {
  userId: string
  bookingId: string
  service: {
    id: string
    title: string
    providerId: string
    provider: {
      id: string
      firstName: string
      lastName: string
      profilePicture?: string
    }
  }
  worker: {
    id: string
    firstName: string
    lastName: string
  } | null
  latestMessage?: Message
  unreadCount?: number
  user: {
    id: string
    firstName: string
    lastName: string
  }
}

interface ChatInboxProps {
  searchQuery: string
}

export default function ChatInbox({ searchQuery }: ChatInboxProps) {
  const searchParams = useSearchParams()
  const currentTab = searchParams.get("tab") || "All"
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [socketConnected, setSocketConnected] = useState<boolean>(false)
  const { token } = useSelector((state: RootState) => state.auth)
  const userId = useSelector((state: RootState) => state.auth.user?.id ?? "")
  const socketRef = useRef<Socket | null>(null)
  const isInitialized = useRef(false)

  // Fetch missing booking function
  const fetchMissingBooking = useCallback(
    async (bookingId: string, message: Message) => {
      try {
        const { data } = await api.get<{ data: Booking }>(`/bookings/${bookingId}`, {
          withCredentials: true,
        })

        const newBooking = {
          ...data.data,
          latestMessage: message,
          unreadCount: message.senderId !== userId ? 1 : 0,
        }

        setBookings((prev) => {
          // Check if booking already exists
          const exists = prev.find((b) => b.bookingId === bookingId)
          if (exists) {
            return prev.map((b) =>
              b.bookingId === bookingId
                ? {
                  ...b,
                  latestMessage: message,
                  unreadCount: message.senderId !== userId ? (b.unreadCount || 0) + 1 : b.unreadCount || 0,
                }
                : b,
            )
          }
          return [...prev, newBooking]
        })

        // Join the new booking room
        if (socketRef.current?.connected) {
          socketRef.current.emit("joinBooking", bookingId)
        }
      } catch (error) {
        console.error("Failed to fetch missing booking:", error)
      }
    },
    [userId],
  )

  // Initialize socket connection
  const initializeSocketConnection = useCallback(
    (bookingsData: Booking[]) => {
      if (isInitialized.current) {
        return
      }

      const socket = initializeSocket(token ?? "", userId ?? "")
      socketRef.current = socket
      isInitialized.current = true

      socket.on("connect", () => {
        setSocketConnected(true)

        // Join all booking rooms
        bookingsData.forEach((booking) => {
          if (booking.bookingId) {
            socket.emit("joinBooking", booking.bookingId)
          }
        })
      })

      socket.on("disconnect", () => {
        setSocketConnected(false)
      })

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error)
        setSocketConnected(false)
      })


      socket.on("joinBookingError", (error) => {
        console.error("Failed to join booking room:", error)
      })

      // Handle new messages
      socket.on("newMessage", (message: Message) => {

        setBookings((prevBookings) => {
          const existingBookingIndex = prevBookings.findIndex((b) => b.bookingId === message.bookingId)

          if (existingBookingIndex !== -1) {
            // Update existing booking
            const updatedBookings = [...prevBookings]
            updatedBookings[existingBookingIndex] = {
              ...updatedBookings[existingBookingIndex],
              latestMessage: message,
              unreadCount:
                message.senderId !== userId
                  ? (updatedBookings[existingBookingIndex].unreadCount || 0) + 1
                  : updatedBookings[existingBookingIndex].unreadCount || 0,
            }
            return updatedBookings
          } else {
            // Fetch missing booking
            fetchMissingBooking(message.bookingId, message)
            return prevBookings
          }
        })
      })

      // Handle messages read
      socket.on("messagesRead", ({ bookingId, userId: readByUserId }: { bookingId: string; userId: string }) => {

        setBookings((prevBookings) =>
          prevBookings.map((booking) => {
            if (booking.bookingId === bookingId) {
              return {
                ...booking,
                unreadCount: readByUserId !== userId ? 0 : booking.unreadCount,
                latestMessage: booking.latestMessage
                  ? {
                    ...booking.latestMessage,
                    isRead: readByUserId !== userId ? true : booking.latestMessage.isRead,
                  }
                  : booking.latestMessage,
              }
            }
            return booking
          }),
        )
      })

      socket.on("messageError", (error) => {
        console.error("Socket error:", error)
      })

    },
    [token, userId, fetchMissingBooking],
  )

  // Fetch initial data
  useEffect(() => {
    if (!token || !userId) {
      console.warn("No JWT token or userId found for socket authentication")
      toast.error("Authentication required")
      router.push("/login")
      return
    }

    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await api.get<{ data: Booking[] }>("/bookings/chats", {
          withCredentials: true,
        })

        const bookingsData = Array.isArray(response.data.data)
          ? response.data.data.map((booking) => ({
            ...booking,
            unreadCount: booking.unreadCount || 0,
            latestMessage: booking.latestMessage || undefined,
          }))
          : []

        setBookings(bookingsData)

        // Initialize socket after data is loaded
        initializeSocketConnection(bookingsData)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load messages")
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect")
        socketRef.current.off("disconnect")
        socketRef.current.off("connect_error")
        socketRef.current.off("newMessage")
        socketRef.current.off("messagesRead")
        socketRef.current.off("joinBookingSuccess")
        socketRef.current.off("joinBookingError")
        socketRef.current.off("messageError")
        socketRef.current.offAny()
        isInitialized.current = false
      }
    }
  }, [token, userId, router, initializeSocketConnection])

  // Polling fallback when socket is not connected
  useEffect(() => {
    if (!socketConnected && !loading && bookings.length > 0) {

      const pollForUpdates = async () => {
        try {
          const response = await api.get<{ data: Booking[] }>("/bookings/chats", {
            withCredentials: true,
          })

          const updatedBookings = Array.isArray(response.data.data)
            ? response.data.data.map((booking) => ({
              ...booking,
              unreadCount: booking.unreadCount || 0,
              latestMessage: booking.latestMessage || undefined,
            }))
            : []

          // Check for actual changes
          const hasChanges = updatedBookings.some((updatedBooking) => {
            const currentBooking = bookings.find((b) => b.bookingId === updatedBooking.bookingId)
            return (
              !currentBooking ||
              currentBooking.latestMessage?.id !== updatedBooking.latestMessage?.id ||
              currentBooking.unreadCount !== updatedBooking.unreadCount ||
              currentBooking.latestMessage?.isRead !== updatedBooking.latestMessage?.isRead
            )
          })

          if (hasChanges || updatedBookings.length !== bookings.length) {
            setBookings(updatedBookings)
          }
        } catch (error) {
          console.error("Error polling for updates:", error)
        }
      }

      const interval = setInterval(pollForUpdates, 3000) // Poll every 3 seconds
      return () => clearInterval(interval)
    }
  }, [socketConnected, loading, bookings])

  const markAsRead = async (bookingId: string) => {
    try {
      // Optimistically update UI
      setBookings((prev) =>
        prev.map((booking) =>
          booking.bookingId === bookingId
            ? {
              ...booking,
              unreadCount: 0,
              latestMessage: booking.latestMessage
                ? { ...booking.latestMessage, isRead: true }
                : booking.latestMessage,
            }
            : booking,
        ),
      )

      if (socketConnected && socketRef.current?.connected) {
        socketRef.current.emit("markMessagesAsRead", { bookingId })
      } else {
        await api.patch(`/bookings/messages/${bookingId}/read`, {}, { withCredentials: true })
      }
    } catch (error) {
      console.error(`Error marking messages as read for booking ${bookingId}:`, error)
      // Revert optimistic update on error
      setBookings((prev) =>
        prev.map((booking) =>
          booking.bookingId === bookingId
            ? {
              ...booking,
              unreadCount: booking.unreadCount || 1,
              latestMessage: booking.latestMessage
                ? { ...booking.latestMessage, isRead: false }
                : booking.latestMessage,
            }
            : booking,
        ),
      )
    }
  }

  const filteredBookings = useMemo(() => {
    let filtered = bookings

    // Filter by tab
    switch (currentTab.toLowerCase()) {
      case "read":
        filtered = bookings.filter((booking) => booking.latestMessage?.isRead === true)
        break
      case "unread":
        filtered = bookings.filter((booking) => booking.latestMessage?.isRead === false)
        break
      default:
        break
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter((booking) => {
        const message = booking.latestMessage
        return (
          message &&
          (`${message.sender.firstName} ${message.sender.lastName}`.toLowerCase().includes(query) ||
            message.content.toLowerCase().includes(query) ||
            booking.service.title.toLowerCase().includes(query))
        )
      })
    }

    // Sort by latest message timestamp
    return filtered.sort((a, b) => {
      const aTime = a.latestMessage ? new Date(a.latestMessage.createdAt).getTime() : 0
      const bTime = b.latestMessage ? new Date(b.latestMessage.createdAt).getTime() : 0
      return bTime - aTime
    })
  }, [bookings, currentTab, searchQuery])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const formatTimestamp = (isoDate: string): string => {
    const date = new Date(isoDate)
    if (isNaN(date.getTime())) return "Invalid date"

    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })
    } else if (diffDays === 1) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric", timeZone: "Asia/Kolkata" })
    }
  }

  return (
    <div className="flex items-center justify-center">
      <div className="w-full overflow-hidden">

        {loading ? (
          <p className="text-center text-gray-500">Loading messages...</p>
        ) : (
          <motion.div
            className="overflow-y-auto space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => {
                const msg = booking.latestMessage
                if (!msg) return null

                return (
                  <motion.div
                    key={booking.bookingId}
                    className={`flex justify-between cursor-pointer  hover:bg-gray-50`}
                    variants={itemVariants}
                    onClick={() => {
                      router.push(`/conversations/inbox/${booking.bookingId}`)
                      markAsRead(booking.bookingId)
                    }}
                  >
                    <div className="flex items-center gap-5">
                      <Avatar className={cn("h-16 w-16")}>
                        <AvatarImage src={booking.service.provider.profilePicture || ""} className="object-cover" />
                        <AvatarFallback>
                          <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-white font-medium">
                            {msg.sender.firstName[0]}
                          </div>
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3 flex flex-col gap-1">
                        <p
                          className={`text-lg sm:text-xl font-bold leading-5 ${!msg.isRead ? "text-[#212121]" : "text-gray-700"}`}
                        >
                          {booking?.user?.id === userId ? `${booking.service.provider.firstName} ${booking.service.provider.lastName}` : `${booking.user.firstName} ${booking.user.lastName}`}
                        </p>
                        <p
                          className={`text-sm font-medium leading-5 line-clamp-1 ${!msg.isRead ? "text-[#616161]" : "text-gray-500"
                            }`}
                          title={msg.content}
                        >
                          {msg.content}
                        </p>
                      </div>
                    </div>
                    <div className="relative flex flex-col items-end gap-2 w-20">
                      {booking.unreadCount && booking.unreadCount > 0 ? (
                        <span className="bg-[#145B10] text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {booking.unreadCount > 99 ? "99+" : booking.unreadCount}
                        </span>
                      ) : null}
                      <p className="absolute bottom-0 right-0 text-xs text-[#616161] leading-4 text-right">{formatTimestamp(msg.createdAt)}</p>
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <p className="text-center text-gray-500">
                {bookings.length === 0 ? "No bookings available" : "No messages found"}
              </p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
