"use client";
import React, { FormEvent, useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ChevronDown, Loader2, Edit, Trash2 } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Button } from '../ui/button';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  serviceType: string;
  scopeOfService: string;
  timing?: string;
  areaServed?: string;
  serviceImage: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    userType: string;
  };
  providerId: string;
  worker: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  workerId: string | null;
  serviceAreas: string[];
}

type IndividualData = {
  category: string;
  price: number;
  serviceType: string;
  scopeOfService: string;
  timing?: string;
  areaServed?: string;
  title: string;
};

interface ServiceFormProps {
  initialData: IndividualData;
  onSubmit: (e: FormEvent) => Promise<void>;
  submitting: boolean;
  setData: React.Dispatch<React.SetStateAction<IndividualData>>;
  onCancel?: () => void;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ initialData, onSubmit, submitting, setData, onCancel }) => {
  
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      
      {/* Category Select */}
      <div className="space-y-2">
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

      {/* Price Select */}
      <div className="space-y-2">
        <Select
          value={initialData?.price?.toString()}
          onValueChange={(value) => setData((prev) => ({ ...prev, price: parseInt(value) }))}
        >
          <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] border-none focus:ring-[#145B10]">
            <SelectValue placeholder="Select Price" />
            <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 focus-within:rotate-90 transition ease-in 2s" />
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

      {/* Work Timing Select */}
      <div className="space-y-2 overflow-hidden">
        <Select
          value={initialData.timing}
          onValueChange={(value) => setData((prev) => ({ ...prev, timing: value }))}
        >
          <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-4 py-[18px] border-none focus:ring-[#145B10] w-full">
            <SelectValue placeholder="Select Work Time" />
            <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 transition-transform duration-300" />
          </SelectTrigger>
          <SelectContent className="w-[--radix-select-trigger-width] max-w-full">
            {[
              "Weekdays: 9:00 AM - 9:00 PM, Weekends: 9:00 AM - 1:00 PM",
              "Weekdays: 8:00 AM - 6:00 PM, Weekends: 10:00 AM - 2:00 PM",
              "Weekdays: 9:00 AM - 5:00 PM, Weekends: Closed",
              "Weekdays: 10:00 AM - 8:00 PM, Weekends: 9:00 AM - 12:00 PM",
            ].map((text, idx) => (
              <SelectItem
                key={idx}
                value={text}
                className="whitespace-normal font-semibold break-words text-sm px-4 py-2"
              >
                {text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Area of Service */}
      <div className="space-y-2 overflow-hidden">
        <Select
          value={initialData.areaServed}
          onValueChange={(value) => setData((prev) => ({ ...prev, areaServed: value }))}
        >
          <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg flex-wrap px-5 py-[18px] border-none focus:ring-[#145B10]">
            <SelectValue placeholder="Area of service" />
            <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 focus-within:rotate-90 transition ease-in 2s" />
          </SelectTrigger>
          <SelectContent className="flex-wrap">
            <SelectItem className="text-sm font-semibold flex-wrap" value="kigali">
              Kigali
            </SelectItem>
            <SelectItem className="text-sm font-semibold flex-wrap" value="nyarugenge">
              Nyarugenge
            </SelectItem>
            <SelectItem className="text-sm font-semibold flex-wrap" value="gasabo">
              Gasabo
            </SelectItem>
            <SelectItem className="text-sm font-semibold flex-wrap" value="kicukiro">
              Kicukiro
            </SelectItem>
            <SelectItem className="text-sm font-semibold flex-wrap" value="all">
              All Areas
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Service Type Select */}
      <div className="space-y-2 overflow-hidden">
        <Select
          value={initialData.serviceType}
          onValueChange={(value) => setData((prev) => ({ ...prev, serviceType: value }))}
        >
          <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg flex-wrap px-5 py-[18px] border-none focus:ring-[#145B10]">
            <SelectValue placeholder="Select Service Type" />
            <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 focus-within:rotate-90 transition ease-in 2s" />
          </SelectTrigger>
          <SelectContent className="flex-wrap">
            <SelectItem className="text-sm font-semibold flex-wrap" value="RESIDENTIAL">
              Residential
            </SelectItem>
            <SelectItem className="text-sm font-semibold flex-wrap" value="COMMERCIAL">
              Commercial
            </SelectItem>
            <SelectItem className="text-sm font-semibold flex-wrap" value="RESIDENTIAL,COMMERCIAL">
              Residential & Commercial
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Scope of Service Select */}
      <div className="space-y-2 overflow-hidden">
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
          className="w-full bg-[#167021] text-white rounded-full font-bold leading-6 py-[12px] h-13 hover:bg-[#0F4D0C] transition-colors"
          disabled={submitting}
        >
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
        </Button>
        {onCancel && (
          <Button
            size="lg"
            type="button"
            variant="outline"
            className="w-full rounded-full"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

const IndividualForm = () => {
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const { user } = useSelector((state: RootState) => state.auth);

  const [individualData, setIndividualData] = useState<IndividualData>({
    category: '',
    price: 0,
    serviceType: '',
    scopeOfService: '',
    timing: '',
    areaServed: '',
    title: '',
  });

  const [updateData, setUpdateData] = useState<Record<string, IndividualData>>({});

  // Fetch services for the logged-in user
  useEffect(() => {
    const fetchServices = async () => {
      if (!user?.id) return;
      setLoadingServices(true);
      try {
        const response = await api.get(`/services?providerId=${user.id}`);
        console.log(response.data);
        
        setServices(response.data.data || []);
      } catch  {
        toast.error('Failed to fetch services');
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, [user?.id]);

  // Initialize update form data for a service
  const initializeUpdateData = (service: Service) => {
    // console.log(service);
    
    setUpdateData((prev) => ({
      ...prev,
      [service.id]: {
        category: service.category || '',
        price: service.price || 0,
        serviceType: service.serviceType || '',
        scopeOfService: service.description || '',
        timing: service.timing || '',
        areaServed: Array.isArray(service.serviceAreas) ? service.serviceAreas.join(', ') : (service.areaServed || ''),
        title: service.title || '',
      },
    }));
  };

  // Handle edit button click
  const handleEditClick = (service: Service) => {
    initializeUpdateData(service);
    setEditingServiceId(service.id);
    setEditModalOpen(true);
  };

  // Handle form submission for creating a new service
  const handleServiceSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      category: individualData.category.toLowerCase(),
      price: individualData.price,
      serviceType: individualData.serviceType,
      scopeOfService: individualData.scopeOfService,
      timing: individualData.timing,
      areaServed: individualData.areaServed,
    };

    try {
      const response = await api.post('/services', payload);
      toast.success('Service submitted successfully');
      setServices([...services, response.data]);
      setIndividualData({
        category: '',
        price: 0,
        serviceType: '',
        scopeOfService: '',
        timing: '',
        areaServed: '',
        title: '',
      });
    } catch (error) {
      const message = (error as Error).message || 'Failed to submit service';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle update service
  const handleUpdateService = async (e: FormEvent, serviceId: string) => {
    e.preventDefault();
    setSubmitting(true);

    const data = updateData[serviceId];
    if (!data) return;

    try {
      const payload = {
        category: data.category.toLowerCase(),
        price: data.price,
        serviceType: data.serviceType,
        scopeOfService: data.scopeOfService,
        timing: data.timing,
        areaServed: data.areaServed,
      };
      await api.patch(`/services/${serviceId}`, payload);
      toast.success('Service updated successfully');
      setServices(
        services.map((service) =>
          service.id === serviceId ? { ...service, ...payload } : service
        )
      );
      setEditModalOpen(false);
      setEditingServiceId(null);
    } catch  {
      toast.error('Failed to update service');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete service
  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    try {
      await api.delete(`/services/${serviceToDelete}`);
      toast.success('Service deleted successfully');
      setServices(services.filter((service) => service.id !== serviceToDelete));
      setDeleteModalOpen(false);
      setServiceToDelete(null);
    } catch  {
      toast.error('Failed to delete service');
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (serviceId: string) => {
    setServiceToDelete(serviceId);
    setDeleteModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Service Creation Form */}
      <ServiceForm
        initialData={individualData}
        onSubmit={handleServiceSubmit}
        submitting={submitting}
        setData={setIndividualData}
      />

      {/* Display User's Services */}
      <div>
        <h1 className="text-lg font-bold">Your Services</h1>
        {loadingServices ? (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : services.length === 0 ? (
          <p className="text-gray-500">No services found.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(service)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteModal(service.id)}
                      className="text-gray-600 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p className='flex items-center justify-between'>
                    <span className="font-medium text-gray-900">Category</span>{' '}
                    {service?.category?.charAt(0).toUpperCase() + service?.category?.slice(1)}
                  </p>
                  <p className='flex items-center justify-between'>
                    <span className="font-medium text-gray-900">Price</span> {service.price} RWF/day
                  </p>
                  <p className='flex items-center justify-between'>
                    <span className="font-medium text-gray-900">Service Type</span>{' '}
                    {service.serviceType}
                  </p>
                  <p className='flex items-center justify-between'>
                    <span className="font-medium text-gray-900">Area Served</span>{' '}
                    {service.areaServed || 'N/A'}
                  </p>
                  <p className='flex items-center justify-between'>
                    <span className="font-medium text-gray-900">Status</span>{' '}
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px] top-1/3 translate-y-1/3 ">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this service? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setServiceToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteService}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="w-[400px] max-h-[90vh] overflow-y-auto top-16">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
          </DialogHeader>
          {editingServiceId && updateData[editingServiceId] && (
            <ServiceForm
              initialData={updateData[editingServiceId]}
              onSubmit={(e) => handleUpdateService(e, editingServiceId)}
              submitting={submitting}
              setData={(newData) =>
                setUpdateData((prev) => ({
                  ...prev,
                  [editingServiceId]: typeof newData === "function"
                    ? (newData(prev[editingServiceId]))
                    : newData,
                }))
              }
              onCancel={() => {
                setEditModalOpen(false);
                setEditingServiceId(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IndividualForm;