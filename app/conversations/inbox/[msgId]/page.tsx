import BackButtonHeader from "@/components/header/back-button-header";

export default function ChatInbox() {
    return (
        <div className="relative flex flex-col h-screen  p-6 bg-gray-50  rounded-lg">
            <BackButtonHeader text="Jenny Wilson" className="" backHref="/conversations" />
            <div className="flex flex-col space-y-4 mt-4">
                <div className="flex justify-end">
                    <div className="max-w-[70%] p-3 bg-purple-600 text-white rounded-lg">
                        <p>Hi Jenny, good morning 😊</p>
                        <p className="text-xs text-gray-200 mt-1">10:00</p>
                    </div>
                </div>
                <div className="flex justify-end">
                    <div className="max-w-[70%] p-3 bg-purple-600 text-white rounded-lg">
                        <p>I have booked your house cleaning service for December 23 at 10 AM 😊</p>
                        <p className="text-xs text-gray-200 mt-1">10:00</p>
                    </div>
                </div>
                <div className="flex justify-start">
                    <div className="max-w-[70%] p-3 bg-white text-black rounded-lg shadow">
                        <p>Hi, morning too Andrew! 😊</p>
                        <p className="text-xs text-gray-400 mt-1">10:00</p>
                    </div>
                </div>
                <div className="flex justify-start">
                    <div className="max-w-[70%] p-3 bg-white text-black rounded-lg shadow">
                        <p>Yes, I have received your order. I will come on that date! 😊😊</p>
                        <p className="text-xs text-gray-400 mt-1">10:00</p>
                    </div>
                </div>
                <div className="flex justify-end">
                    <div className="max-w-[70%] p-3 bg-purple-600 text-white rounded-lg">
                        <p>Good, thanks Jenny... 😊</p>
                        <p className="text-xs text-gray-200 mt-1">10:01</p>
                    </div>
                </div>
            </div>
            <div className="absolute z-50 w-full bottom-5 left-0 flex items-center space-x-2 p-2 bg-white border border-black rounded-lg">
                <input
                    type="text"
                    placeholder="Message..."
                    className="flex-1 p-2 border-none focus:outline-none border border-gray-300 w-full"
                />
                <button className="p-2 bg-purple-600 rounded-full text-white">
                    <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                        ></path>
                    </svg>
                </button>
            </div>
        </div>
    );
}