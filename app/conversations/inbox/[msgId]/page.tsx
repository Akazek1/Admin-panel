import BackButtonHeader from "@/components/header/back-button-header";
import { Icons } from "@/components/icons";

export default function ChatInbox() {
    return (
        <div className="relative flex flex-col h-screen  p-6 bg-gray-50  rounded-lg">
            <BackButtonHeader text="Jenny Wilson" className="" backHref="/conversations" />
            <div className="flex flex-col space-y-4 mt-4">
                <div className="flex justify-end">
                    <div className="max-w-[70%] p-3 tracking-[0.2px] bg-gradient-to-tl from-[#7210FF] to-[#9D59FF] text-white rounded-b-lg rounded-tl-lg">
                        <p>Hi Jenny, good morning 😊</p>
                        <p className="text-sm text-white mt-1 text-end">10:00</p>
                    </div>
                </div>
                <div className="flex justify-end">
                    <div className="max-w-[70%] p-3 tracking-[0.2px] bg-gradient-to-tl from-[#7210FF] to-[#9D59FF] text-white rounded-b-lg rounded-tl-lg">
                        <p>I have booked your house cleaning service for December 23 at 10 AM 😊</p>
                        <p className="text-sm text-white mt-1 text-end">10:00</p>
                    </div>
                </div>
                <div className="flex justify-start">
                    <div className="max-w-[70%] p-3 tracking-[0.2px] bg-[#F5F5F5] text-black rounded-b-lg rounded-tr-lg">
                        <p>Hi, morning too Andrew! 😊</p>
                        <p className="text-sm text-[#757575] mt-1 text-end">10:00</p>
                    </div>
                </div>
                <div className="flex justify-start">
                    <div className="max-w-[70%] p-3 tracking-[0.2px] bg-[#F5F5F5] text-black rounded-b-lg rounded-tr-lg">
                        <p>Yes, I have received your order. I will come on that date! 😊😊</p>
                        <p className="text-sm text-[#757575] mt-1 text-end">10:00</p>
                    </div>
                </div>
                <div className="flex justify-end">
                    <div className="max-w-[70%] tracking-[0.2px] p-3 bg-gradient-to-tl from-[#7210FF] to-[#9D59FF] text-white rounded-b-lg rounded-tl-lg">
                        <p>Good, thanks Jenny... 😊</p>
                        <p className="text-sm text-white mt-1 text-end">10:01</p>
                    </div>
                </div>
            </div>
            <div className="absolute z-50  w-[95%] bottom-5 left-1/2 -translate-x-1/2 flex items-center space-x-2 p-1 rounded-lg">
                <input
                    type="text"
                    placeholder="Message..."
                    className="flex-1 p-2 border-none focus:outline-none border bg-[#FAFAFA] w-[90%]"
                />
                <Icons.Gallery className="w-6 h-6" />
                <button className="p-2.5 bg-gradient-to-tl from-[#7210FF] to-[#9D59FF] rounded-full text-white">
                    <Icons.Mic className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}