"use client";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn } from "@/lib/utils";
import { getUnsplashImageUrl } from "@/lib/unsplash";

// Define the message interface for TypeScript
interface Message {
  id: number;
  name: string;
  message: string;
  timestamp: string;
  read: boolean;
  profile: string;
}

const messages: Message[] = [
  {
    id: 1,
    name: "Gahigi",
    message: "I have booked your house ...",
    timestamp: "13:29",
    read: true,
    profile:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 2,
    name: "Gasimba",
    message: "I just finished it 😂😂",
    timestamp: "10:48",
    read: true,
    profile:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 3,
    name: "Rusanganwa",
    message: "omg, this is amazing 🔥🔥",
    timestamp: "09:25",
    read: true,
    profile:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 4,
    name: "Mujawimana",
    message: "Wow, this is really epic 😎",
    timestamp: "Yesterday",
    read: false,
    profile:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 5,
    name: "Keza",
    message: "Just ideas for next time 😊",
    timestamp: "Dec 20",
    read: true,
    profile:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 6,
    name: "Nshimyiye",
    message: "How are you? 😃😃",
    timestamp: "Dec 20",
    read: true,
    profile:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 7,
    name: "Siboyintore",
    message: "perfect!! 😍😍",
    timestamp: "Dec 18",
    read: true,
    profile:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 8,
    name: "Mugwaneza",
    message: "Message",
    timestamp: "Dec 18",
    read: false,
    profile:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80",
  },
];

export default function ChatInbox() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "All"; // Get tab from URL, default to "All"
  const route = useRouter()

  // Map URL tab values to filter logic
  const filterMessages = (): Message[] => {
    switch (currentTab.toLowerCase()) {
      case "all":
        return messages;
      case "read":
        return messages.filter((msg) => !msg.read);
      case "unread":
        return messages.filter((msg) => msg.read);
      default:
        return messages; // Default to all messages
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className=" flex items-center justify-center">
      <div className="w-full  overflow-hidden">
        <motion.div
          className="overflow-y-auto space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filterMessages().map((msg, index) => (
            <motion.div
              key={msg.id}
              className={`flex justify-between  rounded-lg cursor-pointer ${!msg.read ? "bg-green-50" : "hover:bg-gray-50"
                }`}
              variants={itemVariants}
              onClick={() => route.push(`/conversations/inbox/${msg.id}`)}
            >
              <div className="flex items-center gap-5">
                <Avatar className={cn("h-16 w-16")}>

                  <AvatarImage
                    src={getUnsplashImageUrl(index)}
                    className="object-cover"
                  />
                  <AvatarFallback>
                    <div className=" w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
                      {msg.name[0]}
                    </div>
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3 flex flex-col gap-1">
                  <p
                    className={`text-xl font-bold leading-5 ${!msg.read ? "text-gray-900" : "text-gray-700"
                      }`}
                  >
                    {msg.name}
                  </p>
                  <p
                    className={`text-sm font-medium leading-5 ${!msg.read ? " text-[#616161]" : "text-gray-500"
                      }`}
                  >
                    {msg.message}
                  </p>
                </div>
              </div>
              {msg.read && (
                <div className=" text-right flex flex-col items-center gap-[10px]">
                  <p className="flex items-center justify-center text-white rounded-full text-[10px] leading-3 w-6 h-6 bg-[#145B10]">
                    2
                  </p>
                  <p className="text-xs text-[#616161] leading-4">
                    {msg.timestamp}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
