/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { type FormEvent, useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, Loader2, Pencil, Trash2 } from "lucide-react"
import api from "@/lib/axios"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"

import ImagePicker from "../image-picker"
import ServiceCard from "../service-card"

// Service interface for services fetched from or sent to the backend
interface Service {
  id: string
  title: string
  description: string
  price: number
  category: string
  serviceType: string
  scopeOfService: string
  areaServed?: string
  serviceImage: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  provider: {
    id: string
    firstName: string
    lastName: string
    email: string
    userType: string
  }
  providerId: string
  worker: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  workerId: string | null
  serviceAreas: string[]
  availability: {
    id: string
    serviceId: string
    dayOfWeek: number
    startTime: string
    endTime: string
    createdAt: string
    updatedAt: string
  }[]
  reviews: {
    averageRating: number;
    totalReviews: number;
  };
}

// Availability interface for service availability
interface Availability {
  dayOfWeek: number
  startTime: string
  endTime: string
  enabled: boolean
}

// IndividualData interface for form data
interface IndividualData {
  category: string
  price: number
  serviceType: string
  scopeOfService: string
  areaServed?: string
  title: string
  availability: Availability[]
  serviceImage: File | null
  workerId?: string // Added workerId field
}

// ServiceFormProps interface for the ServiceForm component
interface ServiceFormProps {
  initialData: IndividualData
  onSubmit: (e: FormEvent) => Promise<void>
  submitting: boolean
  setData: React.Dispatch<React.SetStateAction<IndividualData>>
  onCancel?: () => void
  isWorker: boolean
}

// ServiceForm component
const ServiceForm: React.FC<ServiceFormProps> = ({
  initialData,
  onSubmit,
  submitting,
  setData,
  onCancel,
  isWorker,
}) => {
  const [selectedDayGroup, setSelectedDayGroup] = useState<string>("Weekdays")
  const [availabilityStatus, setAvailabilityStatus] = useState<string>("unavailable")
  const [imagePreview, setImagePreview] = useState<string | null>(initialData.serviceImage ? null : null)
  const [workerList, setWorkerList] = useState<any[]>([])
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(initialData.workerId || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dayGroups = [
    { value: "Weekdays", label: "Weekdays (Mon-Fri)", days: [1, 2, 3, 4, 5] },
    { value: "Weekends", label: "Weekends (Sat-Sun)", days: [6, 7] },
    { value: "Monday", label: "Monday", days: [1] },
    { value: "Tuesday", label: "Tuesday", days: [2] },
    { value: "Wednesday", label: "Wednesday", days: [3] },
    { value: "Thursday", label: "Thursday", days: [4] },
    { value: "Friday", label: "Friday", days: [5] },
    { value: "Saturday", label: "Saturday", days: [6] },
    { value: "Sunday", label: "Sunday", days: [7] },
  ]

  useEffect(() => {
    const getAgencyWorker = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await api.get("/agency/workers")
        if (response.data && response.data.data) {
          setWorkerList(response.data.data)
        } else {
          throw new Error("Invalid response format")
        }
      } catch (err) {
        console.error("Error fetching workers:", err)
        setError(
          typeof err === "object" && err !== null && "message" in err
            ? (err as { message?: string }).message || "Failed to fetch workers. Please try again."
            : "Failed to fetch workers. Please try again.",
        )
        setWorkerList([])
      } finally {
        setIsLoading(false)
      }
    }

    if (isWorker) {
      getAgencyWorker()
    }
  }, [isWorker])

  useEffect(() => {
    if (initialData.serviceImage instanceof File) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImagePreview(reader.result)
        }
      }
      reader.readAsDataURL(initialData.serviceImage)
    } else {
      setImagePreview(initialData.serviceImage)
    }
  }, [initialData.serviceImage])

  const handleAvailabilityChange = (days: number[], field: keyof Availability | "status", value: string | boolean) => {
    setData((prev) => ({
      ...prev,
      availability: prev.availability.map((avail) => {
        if (days.includes(avail.dayOfWeek)) {
          if (field === "status") {
            return { ...avail, enabled: value === "available" }
          }
          return { ...avail, [field]: value, enabled: true }
        }
        return avail
      }),
    }))
  }

  const currentDays = dayGroups.find((group) => group.value === selectedDayGroup)?.days || [1]
  const firstDayAvail = initialData.availability.find((a) => currentDays.includes(a.dayOfWeek)) || {
    startTime: "09:00",
    endTime: "17:00",
    enabled: false,
  }

  const handleImageSelect = (file: File) => {
    setData((prev) => ({ ...prev, serviceImage: file }))
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {isWorker && (
        <>
          {isLoading && <div className="text-sm text-gray-500">Loading workers...</div>}
          {error && <div className="text-sm text-red-500">{error}</div>}
          {!isLoading && !error && workerList.length === 0 && (
            <div className="text-sm text-gray-500">No workers available</div>
          )}
          {!isLoading && !error && workerList.length > 0 && (
            <div className="space-y-0.5">
              <Label className="font-semibold text-secondary-foreground/50 text-xs">Select Worker</Label>
              <Select
                value={selectedWorkerId}
                onValueChange={(value) => {
                  setSelectedWorkerId(value)
                  setData((prev) => ({ ...prev, workerId: value }))
                }}
              >
                <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] border-none focus:ring-2 focus:ring-[#145B10] w-full">
                  <SelectValue placeholder="Select Worker" />
                  <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 top-1/2 -translate-y-1/2 transition-transform duration-300" />
                </SelectTrigger>
                <SelectContent className="w-[--radix-select-trigger-width] max-w-full">
                  {workerList.map((worker) => (
                    <SelectItem
                      key={worker.id}
                      value={worker.id}
                      className="text-sm font-semibold whitespace-normal break-words px-4 py-2"
                    >
                      {worker.firstName} {worker.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}

      <ImagePicker onImageSelect={handleImageSelect} initialPreview={imagePreview} />

      <div className="space-y-0.5">
        <Label className="font-semibold text-secondary-foreground/50 text-xs">Service Category</Label>
        <Select
          value={initialData.category}
          onValueChange={(value) => setData((prev) => ({ ...prev, category: value }))}
        >
          <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] border-none focus:ring-2 focus:ring-[#145B10] w-full">
            <SelectValue placeholder="Select Service" />
            <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 top-1/2 -translate-y-1/2 transition-transform duration-300" />
          </SelectTrigger>
          <SelectContent className="w-[--radix-select-trigger-width] max-w-full">
            {[
              { value: "electrician", label: "Electrician" },
              { value: "babysitter", label: "Baby Sitter" },
              { value: "painter", label: "Painter" },
              { value: "househelp", label: "House Help" },
              { value: "plumber", label: "Plumber" },
              { value: "carpenter", label: "Carpenter" },
              { value: "gardener", label: "Gardener" },
              { value: "cook", label: "Cook" },
              { value: "driver", label: "Driver" },
              { value: "laundry", label: "Laundry Service" },
              { value: "security", label: "Security Guard" },
              { value: "acrepair", label: "AC Repair" },
              { value: "technician", label: "Appliance Technician" },
              { value: "cleaning", label: "Home Cleaning" },
              { value: "mover", label: "Mover & Packer" },
            ].map((service) => (
              <SelectItem
                key={service.value}
                value={service.value}
                className="text-sm font-semibold whitespace-normal break-words px-4 py-2"
              >
                {service.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-0.5">
        <Label className="font-semibold text-secondary-foreground/50 text-xs">Service Price</Label>
        <Select
          value={
            initialData?.price && ["1500", "4500", "8000"].includes(initialData.price.toString())
              ? initialData.price.toString()
              : ""
          }
          onValueChange={(value) => setData((prev) => ({ ...prev, price: Number.parseInt(value) }))}
        >
          <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] border-none focus:ring-[#145B10]">
            <SelectValue placeholder="Select Price" />
            <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 transition-transform duration-300" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1500" className="text-sm font-semibold">
              1000-2000 RWF/day
            </SelectItem>
            <SelectItem value="4500" className="text-sm font-semibold">
              3000-6000 RWF/day
            </SelectItem>
            <SelectItem value="8000" className="text-sm font-semibold">
              6000-10000 RWF/day
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-0.5">
        <Label className="font-semibold text-secondary-foreground/50 text-xs">Availability</Label>
        <div className="space-y-2">
          <Select
            value={selectedDayGroup}
            onValueChange={(value) => {
              setSelectedDayGroup(value)
              const days = dayGroups.find((group) => group.value === value)?.days || [1]
              const firstAvail = initialData.availability.find((a) => days.includes(a.dayOfWeek))
              setAvailabilityStatus(firstAvail?.enabled ? "available" : "unavailable")
            }}
          >
            <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] border-none focus:ring-[#145B10] w-full">
              <SelectValue placeholder="Select Day Group" />
              <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 transition-transform duration-300" />
            </SelectTrigger>
            <SelectContent>
              {dayGroups.map((group) => (
                <SelectItem key={group.value} value={group.value} className="text-sm font-semibold">
                  {group.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={availabilityStatus}
            onValueChange={(value) => {
              setAvailabilityStatus(value)
              handleAvailabilityChange(currentDays, "status", value)
            }}
          >
            <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] border-none focus:ring-[#145B10] w-full">
              <SelectValue placeholder="Status" />
              <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 transition-transform duration-300" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="unavailable">Unavailable</SelectItem>
            </SelectContent>
          </Select>
          {availabilityStatus === "available" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Start Time</Label>
                <Input
                  type="time"
                  value={firstDayAvail.startTime}
                  onChange={(e) => handleAvailabilityChange(currentDays, "startTime", e.target.value)}
                  className="rounded-lg border-[#145B10] focus:ring-[#145B10] font-medium"
                />
              </div>
              <div>
                <Label className="text-xs">End Time</Label>
                <Input
                  type="time"
                  value={firstDayAvail.endTime}
                  onChange={(e) => handleAvailabilityChange(currentDays, "endTime", e.target.value)}
                  className="rounded-lg border-[#145B10] focus:ring-[#145B10] font-medium"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-0.5">
        <Label className="font-semibold text-secondary-foreground/50 text-xs">Area of Service</Label>
        <Select
          value={initialData.areaServed}
          onValueChange={(value) => setData((prev) => ({ ...prev, areaServed: value }))}
        >
          <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] border-none focus:ring-[#145B10]">
            <SelectValue placeholder="Area of service" />
            <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 transition-transform duration-300" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem className="text-sm font-semibold" value="kigali">
              Kigali
            </SelectItem>
            <SelectItem className="text-sm font-semibold" value="nyarugenge">
              Nyarugenge
            </SelectItem>
            <SelectItem className="text-sm font-semibold" value="gasabo">
              Gasabo
            </SelectItem>
            <SelectItem className="text-sm font-semibold" value="kicukiro">
              Kicukiro
            </SelectItem>
            <SelectItem className="text-sm font-semibold" value="all">
              All Areas
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-0.5">
        <Label className="font-semibold text-secondary-foreground/50 text-xs">Service Type</Label>
        <Select
          value={initialData.serviceType}
          onValueChange={(value) => setData((prev) => ({ ...prev, serviceType: value }))}
        >
          <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] border-none focus:ring-[#145B10]">
            <SelectValue placeholder="Select Service Type" />
            <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 transition-transform duration-300" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem className="text-sm font-semibold" value="RESIDENTIAL">
              Residential
            </SelectItem>
            <SelectItem className="text-sm font-semibold" value="COMMERCIAL">
              Commercial
            </SelectItem>
            <SelectItem className="text-sm font-semibold" value="BOTH">
              Residential & Commercial
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-0.5">
        <Label className="font-semibold text-secondary-foreground/50 text-xs">Service Scope</Label>
        <Select
          value={initialData.scopeOfService}
          onValueChange={(value) => setData((prev) => ({ ...prev, scopeOfService: value }))}
        >
          <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] border-none focus:ring-2 focus:ring-[#145B10] w-full">
            <SelectValue placeholder="Select Property Type" />
            <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 top-1/2 -translate-y-1/2 transition-transform duration-300" />
          </SelectTrigger>
          <SelectContent className="w-[--radix-select-trigger-width] max-w-full">
            {[
              "1B",
              "2B",
              "3B",
              "4B",
              "Condo",
              "Townhome",
              "Multi-family",
              "1B,2B,3B,4B,Condo,Townhome,Multi-family",
            ].map((value, index) => (
              <SelectItem
                key={index}
                value={value}
                className="whitespace-normal break-words font-semibold px-4 py-2 text-sm"
              >
                {value === "1B,2B,3B,4B,Condo,Townhome,Multi-family" ? "All Property Types" : value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex space-x-2">
        <Button
          size="lg"
          type="submit"
          className="w-full bg-[#167021] text-white rounded-full font-bold leading-6 h-12 hover:bg-[#0F4D0C] transition-colors"
          disabled={submitting}
        >
          {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Save"}
        </Button>
        {onCancel && (
          <Button
            size="lg"
            type="button"
            variant="outline"
            className="w-full rounded-full h-13 bg-transparent"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

// IndividualForm component
const IndividualForm = ({ isWorker }: { isWorker: boolean }) => {
  const [submitting, setSubmitting] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null)
  const { user } = useSelector((state: RootState) => state.auth)
  const [imagePreviews, setImagePreviews] = useState<Record<string, string | null>>({})

  const defaultAvailability: Availability[] = [
    { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", enabled: false },
    { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", enabled: false },
    { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", enabled: false },
    { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", enabled: false },
    { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", enabled: false },
    { dayOfWeek: 6, startTime: "09:00", endTime: "17:00", enabled: false },
    { dayOfWeek: 7, startTime: "09:00", endTime: "17:00", enabled: false },
  ]

  const [individualData, setIndividualData] = useState<IndividualData>({
    category: "",
    price: 0,
    serviceType: "",
    scopeOfService: "",
    areaServed: "",
    title: "",
    availability: defaultAvailability,
    serviceImage: null,
    workerId: "", // Added workerId to initial state
  })

  const [updateData, setUpdateData] = useState<Record<string, IndividualData>>({})

  // Exponential backoff retry mechanism
  async function retryWithBackoff<T>(operation: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
    let lastError: Error | null = null
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation()
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error))
        const status =
          typeof error === "object" && error !== null && "response" in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined
        if (status === 429 || (typeof status === "number" && status >= 500)) {
          const delay = baseDelay * Math.pow(2, i)
          await new Promise((resolve) => setTimeout(resolve, delay))
        } else {
          throw error
        }
      }
    }
    throw lastError || new Error("Retry failed")
  }

  // Fetch services for the logged-in user
  useEffect(() => {
    const fetchServices = async () => {
      if (!user?.id) return

      setLoadingServices(true)
      try {
        const response = await retryWithBackoff(() => api.get(`/services?providerId=${user.id}`))
        const fetchedServices = response.data.data || []
        console.log(fetchedServices);
        
        setServices(fetchedServices)
        const previews: Record<string, string | null> = {}
        fetchedServices.forEach((service: Service) => {
          previews[service.id] = service.serviceImage
        })
        setImagePreviews(previews)
      } catch {
        toast.error("Failed to fetch services")
      } finally {
        setLoadingServices(false)
      }
    }

    fetchServices()
  }, [user?.id])

  // Initialize update form data for a service
  const initializeUpdateData = (service: Service) => {
    const availability = defaultAvailability.map((defaultAvail) => {
      const serviceAvail = service.availability.find((avail) => avail.dayOfWeek === defaultAvail.dayOfWeek)
      return serviceAvail
        ? {
          dayOfWeek: serviceAvail.dayOfWeek,
          startTime: serviceAvail.startTime.slice(11, 16),
          endTime: serviceAvail.endTime.slice(11, 16),
          enabled: true,
        }
        : defaultAvail
    })

    // Set form state (no image File initially)
    setUpdateData((prev: any) => ({
      ...prev,
      [service.id]: {
        category: service.category || "",
        price: Number(service.price) || 0,
        serviceType: service.serviceType || "",
        scopeOfService: service.description || "",
        areaServed: Array.isArray(service.serviceAreas) ? service.serviceAreas.join(", ") : service.areaServed || "",
        title: service.title || "",
        availability,
        serviceImage: service.serviceImage,
        workerId: service.workerId || "", // Include workerId in update data
      },
    }))

    // Set preview image (string URL from server)
    setImagePreviews((prev) => ({
      ...prev,
      [service.id]: service.serviceImage ?? "",
    }))
  }

  // Handle edit button click
  const handleEditClick = (service: Service) => {
    initializeUpdateData(service)
    setEditingServiceId(service.id)
    setEditModalOpen(true)
  }

  // Handle service creation
  const handleServiceSubmit = async (e: FormEvent) => {
    e.preventDefault()

    // if (user?.isProfileComplete) {
    //   toast.error("Please complete your profile first.")
    //   return
    // }

    setSubmitting(true)
    const formData = new FormData()
    formData.append("category", individualData.category.toLowerCase())
    formData.append("price", individualData.price.toString())
    formData.append("serviceType", individualData.serviceType)
    formData.append("scopeOfService", individualData.scopeOfService)
    formData.append("areaServed", individualData.areaServed || "")
    formData.append("title", individualData.category)

    // Add workerId if isWorker is true and workerId is selected
    if (isWorker && individualData.workerId) {
      formData.append("workerId", individualData.workerId)
    }

    if (individualData.serviceImage instanceof File) {
      formData.append("serviceImage", individualData.serviceImage)
    }

    formData.append(
      "availability",
      JSON.stringify(
        individualData.availability
          .filter((avail) => avail.enabled)
          .map((avail) => ({
            startTime: avail.startTime,
            endTime: avail.endTime,
          })),
      ),
    )

    try {
      const response = await retryWithBackoff(() =>
        api.post("/services", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
      )

      toast.success("Service submitted successfully")
      const newService = response.data.data
      setServices([...services, newService])
      setIndividualData({
        category: "",
        price: 0,
        serviceType: "",
        scopeOfService: "",
        areaServed: "",
        title: "",
        availability: defaultAvailability,
        serviceImage: null,
        workerId: "", // Reset workerId
      })
      setImagePreviews((prev) => ({
        ...prev,
        [newService.id]: newService.serviceImage,
      }))
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
          error !== null &&
          "response" in error &&
          (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (error as { response: { data: { message: string } } }).response.data.message
          : "Failed to submit service"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle service update
  const handleUpdateService = async (e: FormEvent, serviceId: string) => {
    e.preventDefault()
    setSubmitting(true)

    const data = updateData[serviceId]
    if (!data) return

    const price = Number(data.price)
    if (isNaN(price) || price < 0) {
      toast.error("Price must be a valid non-negative number.")
      setSubmitting(false)
      return
    }

    const servicePayload = {
      category: data.category.toLowerCase(),
      price: price,
      serviceType: data.serviceType,
      scopeOfService: data.scopeOfService,
      areaServed: data.areaServed ?? "",
      title: data.category,
      availability: data.availability
        .filter((avail) => avail.enabled)
        .map((avail) => ({
          startTime: avail.startTime,
          endTime: avail.endTime,
        })),
      ...(isWorker && data.workerId && { workerId: data.workerId }), // Include workerId in update if applicable
    }

    const formData = new FormData()
    formData.append("data", JSON.stringify(servicePayload)) // backend parses `data` as JSON

    if (data.serviceImage instanceof File) {
      formData.append("serviceImage", data.serviceImage)
    }

    try {
      const response = await retryWithBackoff(() =>
        api.patch(`/services/${serviceId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
      )

      toast.success("Service updated successfully")
      const updatedService = response.data
      setServices(
        services.map((service) =>
          service.id === serviceId
            ? {
              ...service,
              category: data.category,
              price: price,
              serviceType: data.serviceType,
              scopeOfService: data.scopeOfService,
              areaServed: data.areaServed,
              title: data.title,
              serviceImage: updatedService.serviceImage || service.serviceImage,
              workerId: data.workerId || service.workerId, // Update workerId
              availability: data.availability
                .filter((avail) => avail.enabled)
                .map((avail) => ({
                  id: "",
                  serviceId,
                  dayOfWeek: avail.dayOfWeek,
                  startTime: `1970-01-01T${avail.startTime}:00Z`,
                  endTime: `1970-01-01T${avail.endTime}:00Z`,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                })),
            }
            : service,
        ),
      )

      setImagePreviews((prev) => ({
        ...prev,
        [serviceId]: updatedService.serviceImage || prev[serviceId],
      }))

      setEditModalOpen(false)
      setEditingServiceId(null)
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
          error !== null &&
          "response" in error &&
          (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? (error as { response: { data: { message: string } } }).response.data.message
          : "Failed to update service"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle service deletion
  const handleDeleteService = async () => {
    if (!serviceToDelete) return

    try {
      await retryWithBackoff(() => api.delete(`/services/${serviceToDelete}`))
      toast.success("Service deleted successfully")
      setServices(services.filter((service) => service.id !== serviceToDelete))
      setImagePreviews((prev) => {
        const newPreviews = { ...prev }
        delete newPreviews[serviceToDelete]
        return newPreviews
      })
      setDeleteModalOpen(false)
      setServiceToDelete(null)
    } catch {
      toast.error("Failed to delete service")
    }
  }

  // Open delete confirmation modal
  const openDeleteModal = (serviceId: string) => {
    setServiceToDelete(serviceId)
    setDeleteModalOpen(true)
  }

  // Format availability for display
  // const formatAvailability = (availability: Service["availability"]) => {
  //   const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  //   return availability
  //     .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
  //     .map((avail) => {
  //       const start = avail.startTime.slice(11, 16)
  //       const end = avail.endTime.slice(11, 16)
  //       return `${daysOfWeek[avail.dayOfWeek - 1]}: ${start} - ${end}`
  //     })
  //     .join(", ")
  // }

  return (
    <div className="space-y-8">
      <ServiceForm
        initialData={individualData}
        onSubmit={handleServiceSubmit}
        submitting={submitting}
        setData={setIndividualData}
        isWorker={isWorker}
      />

      <div className="pb-6">
        <h1 className="text-lg font-bold">{isWorker ? "Worker's Service" : "Your Services"}</h1>
        {loadingServices ? (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : services.length === 0 ? (
          <p className="text-gray-500">No services found.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4">
            {services.map((service) => (
              <div key={service.id} className="relative">
                <ServiceCard
                  id={service.id}
                  image={imagePreviews[service.id] || "/placeholder.svg?height=200&width=200"}
                  name={
                    service.provider
                      ? `${service?.provider?.firstName} ${service.provider?.lastName}`
                      : `Not Available`
                  }
                  title={service.title}
                  experience={service.scopeOfService || "No experience provided"}
                  languages="English, Kinyarwanda"
                  location={service.areaServed || service.serviceAreas?.join(", ") || "No location provided"}
                  price={`${service.price} RWF/day`}
                  rating={service?.reviews?.averageRating || 0}
                  reviews={service?.reviews?.totalReviews || 0}
                  distance="2.5 km"
                  available={service.isActive}
                  verified={service?.provider?.userType === "VERIFIED"}
                  onClick={() => handleEditClick(service)}
                />
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(service)}
                    className="flex-1 text-[#145B10] hover:text-[#20471e] border-[#20471e] border hover:bg-red-50 z-10"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteModal(service.id)}
                    className="flex-1 border-red-600 border text-red-600 hover:text-red-800 hover:bg-red-50 z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="w-[90%] top-1/3 translate-y-1/3">
          <DialogHeader className="text-start">
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this service? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col w-full items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false)
                setServiceToDelete(null)
              }}
               className="w-full"
            >
              Cancel
            </Button>
            <Button variant="destructive" className="w-full" onClick={handleDeleteService} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="w-[380px] max-h-[80vh] overflow-y-auto top-10">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          {editingServiceId && updateData[editingServiceId] && (
            <ServiceForm
              initialData={updateData[editingServiceId]}
              isWorker={isWorker}
              onSubmit={(e) => handleUpdateService(e, editingServiceId)}
              submitting={submitting}
              setData={(newData) =>
                setUpdateData((prev) => ({
                  ...prev,
                  [editingServiceId]: typeof newData === "function" ? newData(prev[editingServiceId]) : newData,
                }))
              }
              onCancel={() => {
                setEditModalOpen(false)
                setEditingServiceId(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default IndividualForm
