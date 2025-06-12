import React, { FormEvent, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ChevronDown, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import { Button } from '../ui/button';

const IndividualForm = () => {
    const [submitting, setSubmitting] = useState(false);

    type IndividualData = {
        category: string;
        price: number;
        serviceType: string;
        scopeOfService: string;
        timing?: string; // Optional, combining weekdaysHours and weekendsHours
        areaServed?: string; // Optional, for areas serviced
    };

    const [individualData, setIndividualData] = useState<IndividualData>({

        category: '',
        price: 0,
        serviceType: '',
        scopeOfService: '',
        timing: '',
        areaServed: '', // Optional, for areas serviced
    });

    const handleServiceSubmit = async (e: FormEvent) => {
        setSubmitting(true);
        e.preventDefault();
        // Prepare the payload for the API, excluding fields the backend doesn't expect
        const payload = {
            category: individualData.category.toLowerCase(), // API expects lowercase (e.g., "electrician")
            price: individualData.price,
            serviceType: individualData.serviceType,
            scopeOfService: individualData.scopeOfService,
            timing: individualData.timing, // Optional field
            areaServed: individualData.areaServed, // Optional field
        };

        try {
            const response = await api.post('/services', payload);
            console.log(response.data);
            toast.success('Services submitted successfully');
        } catch (error) {
            const message = (error as Error).message || 'Failed to submit service';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <form onSubmit={handleServiceSubmit} className="space-y-6">

                {/* Category Select */}
                <div className="space-y-2">
                    <Select
                        onValueChange={(value) =>
                            setIndividualData((prev) => ({ ...prev, category: value }))
                        }
                    >
                        <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg px-5 py-[18px] border-none focus:ring-[#145B10]">
                            <SelectValue placeholder="Select Service" />
                            <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 focus-within:rotate-90 transition ease-in 2s" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="electrician" className="text-sm font-semibold">
                                Electrician
                            </SelectItem>
                            <SelectItem value="babysitter" className="text-sm font-semibold">
                                Baby Sitter
                            </SelectItem>
                            <SelectItem value="painter" className="text-sm font-semibold">
                                Painter
                            </SelectItem>
                            <SelectItem value="househelp" className="text-sm font-semibold">
                                House Help
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Price Select */}
                <div className="space-y-2">
                    <Select
                        onValueChange={(value) =>
                            setIndividualData((prev) => ({ ...prev, price: parseInt(value) }))
                        }
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
                        onValueChange={(value) =>
                            setIndividualData((prev) => ({ ...prev, timing: value }))
                        }
                    >
                        <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg flex-wrap px-5 py-[18px] border-none focus:ring-[#145B10]">
                            <SelectValue placeholder="Select Work Time" className="border border-black" />
                            <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 focus-within:rotate-90 transition ease-in 2s" />
                        </SelectTrigger>
                        <SelectContent className="flex-wrap px-0 border border-black">
                            <SelectItem className="px-0 flex-wrap" value="Weekdays: 9:00 AM - 9:00 PM, Weekends: 9:00 AM - 1:00 PM">
                                Weekdays: 9:00 AM - 9:00 PM, Weekends: 9:00 AM - 1:00 PM
                            </SelectItem>
                            <SelectItem className="px-0 flex-wrap" value="Weekdays: 8:00 AM - 6:00 PM, Weekends: 10:00 AM - 2:00 PM">
                                Weekdays: 8:00 AM - 6:00 PM, Weekends: 10:00 AM - 2:00 PM
                            </SelectItem>
                            <SelectItem className="px-0 flex-wrap" value="Weekdays: 9:00 AM - 5:00 PM, Weekends: Closed">
                                Weekdays: 9:00 AM - 5:00 PM, Weekends: Closed
                            </SelectItem>
                            <SelectItem className="px-0 flex-wrap" value="Weekdays: 10:00 AM - 8:00 PM, Weekends: 9:00 AM - 12:00 PM">
                                Weekdays: 10:00 AM - 8:00 PM, Weekends: 9:00 AM - 12:00 PM
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Scope of service */}
                <div className="space-y-2 overflow-hidden">
                    <Select
                        onValueChange={(value) =>
                            setIndividualData((prev) => ({ ...prev, serviceType: value }))
                        }
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
                        onValueChange={(value) =>
                            setIndividualData((prev) => ({ ...prev, serviceType: value }))
                        }
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

                {/* Scope of Service Select (Replaces Property Type) */}
                <div className="space-y-2 overflow-hidden">
                    <Select
                        onValueChange={(value) => {
                            setIndividualData((prev) => ({
                                ...prev,
                                areasServiced: value.split(",").map((item) => item.trim()),
                            }));
                        }}
                    >
                        <SelectTrigger className="relative bg-white text-sm font-semibold rounded-lg flex-wrap px-5 py-[18px] focus:outline-none border-none focus:ring-[#145B10]">
                            <SelectValue placeholder="Select Property Type" className="border border-black" />
                            <ChevronDown className="w-5 h-5 text-black fill-black absolute right-5 focus-within:rotate-90 transition ease-in 2s" />
                        </SelectTrigger>
                        <SelectContent className="flex-wrap px-0 border border-black">
                            <SelectItem className="px-0 flex-wrap" value="1B">1B</SelectItem>
                            <SelectItem className="px-0 flex-wrap" value="2B">2B</SelectItem>
                            <SelectItem className="px-0 flex-wrap" value="3B">3B</SelectItem>
                            <SelectItem className="px-0 flex-wrap" value="4B">4B</SelectItem>
                            <SelectItem className="px-0 flex-wrap" value="Condo">Condo</SelectItem>
                            <SelectItem className="px-0 flex-wrap" value="Townhome">Townhome</SelectItem>
                            <SelectItem className="px-0 flex-wrap" value="Multi-family">Multi-family</SelectItem>
                            <SelectItem className="px-0 flex-wrap" value="1B,2B,3B,4B,Condo,Townhome,Multi-family">
                                All Property Types
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Button
                    size="lg"
                    type="submit"
                    className="w-full bg-[#167021] text-white rounded-full font-bold leading-6 py-[18px] h-13 hover:bg-[#0F4D0C] transition-colors"
                >
                    {
                        submitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Submit'
                        )
                    }
                </Button>
            </form>
            {/* <div>
                <h1 className='text-lg font-bold'>Your Services</h1>

            </div> */}
        </div>
    );
};

export default IndividualForm;