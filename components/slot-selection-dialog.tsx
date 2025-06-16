"use client";

import React, { useState, useEffect } from "react";
import CustomDialog from "./custom-dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Define the interface for available dates
interface AvailableDate {
    day: string;
    date: number;
}

// Props interface for the dialog
interface SlotSelectionDialogProps {
    trigger: React.ReactNode;
    providerName: string;
    price: string;
    onConfirm: (selectedDate: string, selectedTime: string) => void;
    availableDates: AvailableDate[];
    availableTimes: string[];
    provider: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const SlotSelectionDialog: React.FC<SlotSelectionDialogProps> = ({
    trigger,
    onConfirm,
    availableDates,
    availableTimes,
    provider,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const router = useRouter();

    const handleDateSelect = (day: string, date: number) => {
        // Construct ISO date (assuming current year for simplicity; adjust if needed)
        const currentYear = new Date().getFullYear();
        const month = new Date().getMonth() + 1; // Adjust month for current date
        const formattedDate = `${currentYear}-${month.toString().padStart(2, "0")}-${date
            .toString()
            .padStart(2, "0")}`;
        setSelectedDate(formattedDate);
    };

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time);
    };

    // Auto-navigate when both date and time are selected
    useEffect(() => {
        if (selectedDate && selectedTime) {
            onConfirm(selectedDate, selectedTime); // Call the onConfirm callback
            setIsOpen(false); // Close the dialog
            // Navigate to the booking summary page with serviceId and slot details
            router.push(
                `/book/${provider.type}/${provider.id}/booking-summary?serviceId=${encodeURIComponent(
                    provider.id
                )}&date=${encodeURIComponent(selectedDate)}&time=${encodeURIComponent(selectedTime)}`
            );
        }
    }, [selectedDate, selectedTime, onConfirm, router, provider]);

    return (
        <div>
            <div onClick={() => setIsOpen(true)}>{trigger}</div>
            <CustomDialog isOpen={isOpen} onClose={() => setIsOpen(false)} className="p-3">
                <div className="space-y-6">
                    {/* Date Selection */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Select Date</h3>
                        <div className="grid grid-cols-4 gap-4">
                            {availableDates.map((date) => (
                                <div
                                    key={`${date.day}-${date.date}`}
                                    className={`flex flex-col items-center cursor-pointer bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-lg py-3 ${selectedDate?.includes(date.date.toString()) ? "bg-white/20" : ""
                                        }`}
                                    onClick={() => handleDateSelect(date.day, date.date)}
                                >
                                    <span>{date.day}</span> {date.date}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Time Selection */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Select Time</h3>
                        <div className="grid grid-cols-4 gap-4">
                            {availableTimes.map((time, index) => (
                                <Button
                                    key={index}
                                    variant="outline"
                                    className={`bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-lg py-3 ${selectedTime === time ? "bg-white/20" : ""
                                        }`}
                                    onClick={() => handleTimeSelect(time)}
                                >
                                    {time}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </CustomDialog>
        </div>
    );
};

export default SlotSelectionDialog;