"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import AppIcon from "@/public/svg/app-icon.svg"
import GreenAppIcon from "@/public/svg/green-app-icon.svg"
import RightFlowerIcon from "@/public/svg/flower.svg"
import LeftFlowerIcon from "@/public/svg/left-flower.svg"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "react-hot-toast"
import BubbleLoader from "@/components/loader/Bubble-Loader.tsx"
import { Briefcase, User, ArrowRight, X } from "lucide-react"
import api from "@/lib/axios"
import { useDispatch } from "react-redux"
import { AppDispatch } from "@/store"
import { updateUser } from "@/store/slices/auth-slice"

const HARDCODED_OTP = "111111" // 6 digits to match backend
const OTP_LENGTH = 6 // 6-digit OTPs

interface OnboardingStep {
  title: string
  subtitle?: string
  image: string
  bgColor: string
  textColor: string
  buttonText: string
  type?: "info" | "dual-mode" | "phone" | "otp" | "user-type"
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Quality, Affordable, Best Services.",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#145B10]",
    textColor: "text-[#1B5E20]",
    buttonText: "Next",
    type: "info",
  },
  {
    title: "Quick & Professional Solutions to your Problems.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#729D70]",
    textColor: "text-[#145B10]",
    buttonText: "Next",
    type: "info",
  },
  {
    title: "Get services by HWA's verified professionals.",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#1B5E20]",
    textColor: "text-white",
    buttonText: "Next",
    type: "info",
  },
  {
    title: "Switch Between Two Views Anytime",
    subtitle: "You can be both an Employer and a Provider",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#1B5E20]",
    textColor: "text-white",
    buttonText: "Next",
    type: "dual-mode",
  },
  {
    title: "Choose Your Account Type",
    subtitle: "You can change this later in your profile",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#1B5E20]",
    textColor: "text-white",
    buttonText: "Continue",
    type: "user-type",
  },
  {
    title: "Enter your phone number",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#1B5E20]",
    textColor: "text-white",
    buttonText: "Send OTP",
    type: "phone",
  },
  {
    title: "Enter Verification Code",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#1B5E20]",
    textColor: "text-white",
    buttonText: "Verify",
    type: "otp",
  },
  {
    title: "Tell us about yourself",
    subtitle: "We just need your name to get started",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#1B5E20]",
    textColor: "text-white",
    buttonText: "Continue",
    type: "basic-info",
  },
]

const OnboardingPage = () => {
  const [showSplash, setShowSplash] = useState(true)
  const [currentStep, setCurrentStep] = useState(-1)
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill("")) // Support 6-digit OTPs
  const [phoneNumber, setPhoneNumber] = useState("")
  const [selectedUserType, setSelectedUserType] = useState<"INDIVIDUAL" | "AGENCY" | null>(null)
  const [isReturningUser, setIsReturningUser] = useState(false)
  const [userExists, setUserExists] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [verifiedUser, setVerifiedUser] = useState<any>(null) // Store verified user data
  const inputsRef = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null))
  const [activeInputIndex, setActiveInputIndex] = useState(0)
  const firstNameInputRef = useRef<HTMLInputElement | null>(null)
  const lastNameInputRef = useRef<HTMLInputElement | null>(null)
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const [hasFocusedFirstName, setHasFocusedFirstName] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useDispatch<AppDispatch>()
  const { sendOtp, verifyOtp, updateUserProfile, isLoading } = useAuth()
  
  // Get redirect URL from query params
  const redirectUrl = searchParams.get("redirect") || null

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
      setCurrentStep(0)
    }, 3500)

    return () => clearTimeout(timer)
  }, [])

  // Auto-focus firstName field when step 7 is shown
  useEffect(() => {
    if (currentStep === 7 && !hasFocusedFirstName && firstNameInputRef.current) {
      const timer = setTimeout(() => {
        firstNameInputRef.current?.focus()
        setHasFocusedFirstName(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [currentStep, hasFocusedFirstName])

  // Check if user exists when phone number is entered
  const checkUserExists = async (phone: string) => {
    try {
      // Clean phone number
      const cleanedPhone = phone.replace(/^\+\d{1,4}/, "").replace(/\D/g, "")
      
      // Try to check if user exists (endpoint might not exist, so handle gracefully)
      try {
        const response = await api.get(`/auth/check-user/${cleanedPhone}`, {
          withCredentials: true,
        })
        
        if (response?.data?.exists) {
          setUserExists(true)
          setIsReturningUser(true)
          return true
        }
      } catch (apiError) {
        // Endpoint doesn't exist or user doesn't exist - both are fine
        // We'll just proceed with normal flow
      }
      
      setUserExists(false)
      setIsReturningUser(false)
      return false
    } catch (error) {
      // User doesn't exist, which is fine for new signups
      setUserExists(false)
      setIsReturningUser(false)
      return false
    }
  }

  const handleSkipIntro = () => {
    // Skip to phone number entry (step 5)
    setCurrentStep(5)
  }

  const handleChange = (value: string, index: number) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    const newCode = [...code];
    newCode[index] = numericValue.slice(-1);
    setCode(newCode);

    const nextIndex = index + 1;

    if (numericValue && nextIndex < OTP_LENGTH) {
      setTimeout(() => {
        setActiveInputIndex(nextIndex);
        inputsRef.current[nextIndex]?.focus();
      }, 50);
    }

    // Auto-verify if all 6 digits are filled
    const fullCode = newCode.join("")
    const filledDigits = newCode.filter((val) => val.length > 0).length
    
    // Auto-verify when all 6 digits are entered
    if (fullCode.length === OTP_LENGTH && filledDigits === OTP_LENGTH) {
      handleVerifyOtp(fullCode);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      setActiveInputIndex(index - 1)
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasteData = e.clipboardData.getData("text").slice(0, OTP_LENGTH).split("")
    const newCode = [...code]

    for (let i = 0; i < OTP_LENGTH; i++) {
      newCode[i] = pasteData[i] || ""
    }
    setCode(newCode)

    const nextIndex = Math.min(pasteData.length - 1, OTP_LENGTH - 1)
    setActiveInputIndex(nextIndex)
    inputsRef.current[nextIndex]?.focus()

    // Auto-verify if we have 6 digits
    if (pasteData.length === OTP_LENGTH) {
      const finalCode = pasteData.join("")
      handleVerifyOtp(finalCode)
    }

    e.preventDefault()
  }

  const handleInputFocus = (index: number) => {
    if (activeInputIndex === index) return;
    setActiveInputIndex(index);
  };

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      toast.error("Please enter a valid phone number (at least 9 digits)")
      return
    }

    // Clean phone number - remove any country code and non-digits
    let cleanedPhoneNumber = phoneNumber.replace(/^\+\d{1,4}/, "").replace(/\D/g, "")

    // Remove leading 250 if present (Rwanda country code)
    if (cleanedPhoneNumber.startsWith("250")) {
      cleanedPhoneNumber = cleanedPhoneNumber.substring(3)
    }

    // Validate length (should be 9 digits for Rwanda)
    if (cleanedPhoneNumber.length !== 9) {
      toast.error("Please enter a valid 9-digit phone number")
      return
    }

    // Format phone number with country code for backend (250 + 9 digits = 12 digits)
    const formattedPhoneNumber = `250${cleanedPhoneNumber}`

    // Check if user exists (using cleaned number without country code for lookup)
    await checkUserExists(cleanedPhoneNumber)

    try {
      console.log("Sending OTP request for:", formattedPhoneNumber)
      const success = await sendOtp({ phoneNumber: formattedPhoneNumber })

      if (success) {
        // Show toast with hardcoded OTP for all users (development mode)
        toast.success(`OTP sent! Use ${HARDCODED_OTP} for verification`, { duration: 5000 })
        
        // Store cleaned phone number (without country code) for OTP verification
        setPhoneNumber(cleanedPhoneNumber)
        setCurrentStep(6) // Move to OTP step
        setTimeout(() => {
          inputsRef.current[0]?.focus()
        }, 500)
      }
    } catch (error: any) {
      console.error("OTP send error:", error)
      if (error.code === "ERR_NETWORK" || error.message?.includes("Network Error")) {
        toast.error("Cannot connect to server. Is the backend running on port 3001?")
      } else {
        toast.error(error.response?.data?.message || "Failed to send OTP")
      }
    }
  }

  const handleVerifyOtp = async (otpCode: string) => {
    try {
      // Clean phone number and ensure it has country code for backend
      let cleanedPhone = phoneNumber.replace(/^\+\d{1,4}/, "").replace(/\D/g, "")
      
      // Remove leading 250 if present
      if (cleanedPhone.startsWith("250")) {
        cleanedPhone = cleanedPhone.substring(3)
      }
      
      // Format with country code for backend (250 + 9 digits)
      const formattedPhone = cleanedPhone.length === 9 ? `250${cleanedPhone}` : cleanedPhone
      
      // Use the updated verifyOtp that accepts object format
      const user = await verifyOtp({ phoneNumber: formattedPhone, otp: otpCode });

      if (user) {
        // Store verified user data
        setVerifiedUser(user);
        
        // Update user type if selected
        if (selectedUserType) {
          await updateUserProfile({ userType: selectedUserType }, user);
        }

        // If user has firstName, go to home or redirect URL. Otherwise, collect basic info
        if (user.firstName && user.firstName.trim() !== "") {
          // Redirect to intended URL if available, otherwise check for tutorial
          if (redirectUrl) {
            router.push(redirectUrl);
          } else {
            // Check if this is first login to show tutorial
            const isFirstLogin = !localStorage.getItem("hasSeenTutorial");
            if (isFirstLogin) {
              localStorage.setItem("hasSeenTutorial", "true");
              router.push("/?tutorial=true");
            } else {
              router.push("/");
            }
          }
        } else {
          // Move to basic info step
          setCurrentStep(7);
        }
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast.error(error.response?.data?.message || "Invalid OTP. Use 11111 for development.");
    }
  };

  const handleSaveBasicInfo = async () => {
    if (!firstName.trim()) {
      toast.error("Please enter your name")
      return
    }

    if (!verifiedUser) {
      toast.error("User verification required. Please go back and verify OTP.")
      return
    }

    try {
      // Prepare minimal update payload
      const updatePayload: any = {
        firstName: firstName.trim(),
      }

      // Add lastName if provided
      if (lastName.trim()) {
        updatePayload.lastName = lastName.trim()
      }

      // Add email if provided
      if (email.trim() && /\S+@\S+\.\S+/.test(email.trim())) {
        updatePayload.email = email.trim()
      }
      
      // Username will be auto-generated on backend from firstName

      // Update user via API
      const response = await api.patch("/users/profile", updatePayload, {
        withCredentials: true,
      })

      if (response.data) {
        // Get updated user data from response or construct it
        const updatedUserData = response.data.data || response.data
        
        // Update local user state - preserve phone number and other fields
        const updatedUser = {
          ...verifiedUser,
          firstName: firstName.trim(),
          lastName: lastName.trim() || updatedUserData.lastName || verifiedUser.lastName,
          username: updatedUserData.username || verifiedUser.username,
          email: email.trim() || verifiedUser.email || updatedUserData.email,
          phoneNumber: verifiedUser.phoneNumber, // Preserve phone number
        }

        // Update Redux store
        dispatch(updateUser(updatedUser))

        // Update localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(updatedUser))
        }

            toast.success("Welcome! Let's get started.")

            // Redirect to intended URL if available, otherwise check for tutorial
            if (redirectUrl) {
              router.push(redirectUrl)
            } else {
              // Check if this is first login to show tutorial
              const isFirstLogin = !localStorage.getItem("hasSeenTutorial")
              if (isFirstLogin) {
                localStorage.setItem("hasSeenTutorial", "true")
                router.push("/?tutorial=true")
              } else {
                router.push("/")
              }
            }
      }
    } catch (error: any) {
      console.error("Error saving basic info:", error)
      toast.error(error.response?.data?.message || "Failed to save information. Please try again.")
    }
  }

  const handleNext = async () => {
    // User type selection step
    if (currentStep === 4) {
      if (!selectedUserType) {
        toast.error("Please select an account type")
        return
      }
      setCurrentStep(5) // Move to phone number entry
      return
    }

    // Phone number entry step
    if (currentStep === 5) {
      await handleSendOtp()
      return
    }

    // OTP verification step
    if (currentStep === 6) {
      const otpCode = code.join("")
      if (otpCode.length === OTP_LENGTH) {
        await handleVerifyOtp(otpCode)
      } else {
        toast.error(`Please enter the complete ${OTP_LENGTH}-digit verification code`)
      }
      return
    }

    // Basic info step
    if (currentStep === 7) {
      await handleSaveBasicInfo()
      return
    }

    // Regular next step
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep === 6) {
      setCurrentStep(5)
      setCode(Array(OTP_LENGTH).fill(""))
      setActiveInputIndex(0)
    } else if (currentStep === 7) {
      setCurrentStep(6)
      setCode(Array(OTP_LENGTH).fill(""))
      setActiveInputIndex(0)
    } else if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const getButtonText = () => {
    if (currentStep === 4) return "Continue"
    if (currentStep === 5) return "Send OTP"
    if (currentStep === 6) return "Verify"
    if (currentStep === 7) return "Continue"
    return ONBOARDING_STEPS[currentStep]?.buttonText || "Next"
  }

  const Step: React.FC<{
    currentStepData: OnboardingStep
    stepNumber: number
    code: string[]
    inputsRef: React.MutableRefObject<Array<HTMLInputElement | null>>
    handleChange: (value: string, index: number) => void
    handleKeyDown: (e: React.KeyboardEvent, index: number) => void
    handlePaste: (e: React.ClipboardEvent) => void
    handleInputFocus: (index: number) => void
  }> = ({ currentStepData, stepNumber, code, inputsRef, handleChange, handleKeyDown, handlePaste, handleInputFocus }) => {
    const imageWrapper = "p-5 bg-[#F1FCEF] rounded-full"
    const imageStyle = "w-[160px] h-[160px] sm:w-[250px] sm:h-[250px] object-cover rounded-full"

    const renderImage = () => (
      <div className={imageWrapper}>
        <Image
          height={400}
          width={400}
          src={currentStepData.image || "/placeholder.svg"}
          alt={`Onboarding step ${stepNumber + 1}`}
          className={imageStyle}
        />
      </div>
    )

    switch (stepNumber) {
      case 0:
        return (
          <div>
            <div className="absolute -right-20 -top-52 sm:-right-[130px] sm:-top-56 flex">
              <LeftFlowerIcon className="w-16 h-auto sm:w-auto sm:h-auto" />
              {renderImage()}
            </div>
            <div className="mb-4 sm:mb-8">
              <div className={`${currentStepData.textColor} text-3xl font-serif`}>
                <GreenAppIcon />
              </div>
            </div>
            <h1 className="text-2xl sm:text-[40px] font-bold leading-tight sm:leading-[48px] text-gray-900 mb-6 sm:mb-8 max-w-[280px]">
              {currentStepData.title}
            </h1>
          </div>
        )
      case 1:
        return (
          <div>
            <div className="absolute -left-20 -top-80 sm:-left-[130px] sm:-top-[350px] flex items-center">
              {renderImage()}
              <RightFlowerIcon className="w-40 h-auto sm:w-auto sm:h-auto" />
            </div>
            <div className="text-right flex items-center justify-end w-full">
              <h1 className="text-3xl sm:text-[40px] font-bold leading-tight sm:leading-[48px] text-gray-900 mb-6 sm:mb-8">
                {currentStepData.title}
              </h1>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="h-full">
            <div className="flex flex-col items-center gap-8 sm:gap-[60px]">
              <div className="text-center flex items-center justify-center w-full">
                <h1 className="text-3xl sm:text-[40px] font-bold leading-tight sm:leading-[48px] text-gray-900 mb-6 sm:mb-8">
                  {currentStepData.title}
                </h1>
              </div>
              {renderImage()}
            </div>
          </div>
        )
      case 3:
        // Dual-mode explanation step
        return (
          <div className="h-full flex flex-col items-center justify-center gap-6 sm:gap-8">
            <div className="text-center">
              <h1 className="text-2xl sm:text-[40px] font-bold leading-tight sm:leading-[48px] text-gray-900 mb-4">
                {currentStepData.title}
              </h1>
              {currentStepData.subtitle && (
                <p className="text-base sm:text-lg text-gray-600 mb-8">
                  {currentStepData.subtitle}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-md">
              <div className="flex-1 p-6 bg-[#F1FCEF] rounded-xl border-2 border-[#145B10]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-[#145B10] rounded-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg">Employer</h3>
                </div>
                <p className="text-sm text-gray-700">
                  Find and hire service providers for your needs
                </p>
              </div>
              <div className="flex-1 p-6 bg-[#F1FCEF] rounded-xl border-2 border-[#145B10]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-[#145B10] rounded-lg">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg">Provider</h3>
                </div>
                <p className="text-sm text-gray-700">
                  Find job postings and work opportunities
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 text-center mt-4">
              Switch between views anytime using the toggle on the home page
            </p>
          </div>
        )
      case 4:
        // User type selection
        return (
          <div className="h-full flex flex-col items-center justify-center gap-6 sm:gap-8">
            <div className="text-center mb-4">
              <h1 className="text-2xl sm:text-[40px] font-bold leading-tight sm:leading-[48px] text-gray-900 mb-2">
                {currentStepData.title}
              </h1>
              {currentStepData.subtitle && (
                <p className="text-base sm:text-lg text-gray-600">
                  {currentStepData.subtitle}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full max-w-md">
              <button
                onClick={() => setSelectedUserType("INDIVIDUAL")}
                className={`flex-1 p-6 rounded-xl border-2 transition-all ${
                  selectedUserType === "INDIVIDUAL"
                    ? "bg-[#145B10] text-white border-[#145B10]"
                    : "bg-white text-gray-700 border-gray-300 hover:border-[#145B10]"
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    selectedUserType === "INDIVIDUAL" ? "bg-white/20" : "bg-[#F1FCEF]"
                  }`}>
                    <User className={`w-8 h-8 ${
                      selectedUserType === "INDIVIDUAL" ? "text-white" : "text-[#145B10]"
                    }`} />
                  </div>
                  <h3 className="font-bold text-lg">Individual</h3>
                  <p className="text-sm text-center">
                    Personal service provider
                  </p>
                </div>
              </button>
              <button
                onClick={() => setSelectedUserType("AGENCY")}
                className={`flex-1 p-6 rounded-xl border-2 transition-all ${
                  selectedUserType === "AGENCY"
                    ? "bg-[#145B10] text-white border-[#145B10]"
                    : "bg-white text-gray-700 border-gray-300 hover:border-[#145B10]"
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    selectedUserType === "AGENCY" ? "bg-white/20" : "bg-[#F1FCEF]"
                  }`}>
                    <Briefcase className={`w-8 h-8 ${
                      selectedUserType === "AGENCY" ? "text-white" : "text-[#145B10]"
                    }`} />
                  </div>
                  <h3 className="font-bold text-lg">Agency</h3>
                  <p className="text-sm text-center">
                    Business with multiple workers
                  </p>
                </div>
              </button>
            </div>
          </div>
        )
      case 5:
        // Phone number entry
        return (
          <div>
            <div className="mb-2">
              <div className={`${currentStepData.textColor} flex items-center justify-center text-4xl font-serif`}>
                <GreenAppIcon />
              </div>
            </div>
            <div className={`${imageWrapper} flex items-center justify-between w-max mx-auto mb-6 sm:mb-10`}>
              <Image
                height={400}
                width={400}
                src={currentStepData.image || "/placeholder.svg"}
                alt={`Onboarding step ${stepNumber + 1}`}
                className="w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] object-cover rounded-full"
              />
            </div>
            <div className="flex items-center border border-black rounded-xl overflow-hidden w-full">
              <div className="flex items-center gap-2 pl-3 pr-5 py-3 sm:py-4 border-r border-black">
                <Image
                  height={40}
                  width={40}
                  src="https://flagcdn.com/w40/rw.png"
                  alt="Rwanda Flag"
                  className="w-6 h-4 object-cover rounded-sm"
                />
                <span className="text-[#212121] font-semibold text-sm">+250</span>
              </div>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => {
                  try {
                    const value = e.target.value.replace(/\D/g, "")
                    setPhoneNumber(value)
                  } catch (error) {
                    console.error("Error handling phone input:", error)
                  }
                }}
                onKeyDown={(e) => {
                  try {
                    if (e.key === "Enter" && phoneNumber.length >= 9) {
                      handleSendOtp()
                    }
                  } catch (error) {
                    console.error("Error on keydown:", error)
                  }
                }}
                className="px-4 py-3 sm:py-4 w-full text-[#212121] font-semibold placeholder:text-[#212121] placeholder:font-semibold placeholder:text-sm 
                    border-none focus:outline-none focus:ring-0 focus:border-transparent 
                    active:outline-none active:ring-0 active:border-transparent shadow-none"
                autoFocus
                maxLength={9}
              />
            </div>
            {isReturningUser && (
              <p className="text-sm text-[#145B10] mt-2 text-center">
                Welcome back! Enter the OTP to continue.
              </p>
            )}
          </div>
        )
      case 6:
        // OTP verification
        return (
          <div className="relative w-full">
            <button
              onClick={handleBack}
              className="absolute -top-60 sm:-top-80 left-0 p-2 text-[#1B5E20] font-semibold flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Back
            </button>
            <div className="flex flex-col items-center gap-10 sm:gap-20 pt-12">
              <span className="flex flex-col items-center gap-2 mb-6 sm:mb-8">
                <h2 className="font-bold text-2xl sm:text-3xl text-[#212121]">Enter Verification Code</h2>
                <p className="text-sm font-bold text-center text-[#212121] max-w-[300px]">
                  Enter the {OTP_LENGTH}-digit verification code
                </p>
                <p className="text-xs text-[#145B10] mt-2 font-semibold">
                  Development: Use {HARDCODED_OTP} to verify (SMS service not configured yet)
                </p>
              </span>
              <div onPaste={handlePaste} className="flex gap-1 sm:gap-2">
                {/* Show 6 inputs for OTP (supports both 5-digit hardcoded and 6-digit real) */}
                {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputsRef.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={code[index] || ""}
                    onChange={(e) => handleChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onFocus={() => {
                      const firstEmptyIndex = code.findIndex(d => !d);
                      if (index === firstEmptyIndex || index === activeInputIndex) {
                        handleInputFocus(index);
                      } else {
                        inputsRef.current[index]?.blur();
                      }
                    }}
                    autoFocus={activeInputIndex === index}
                    className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg font-medium border border-black rounded-md focus:ring-2 focus:ring-none focus:outline-none outline-none"
                  />
                ))}
              </div>
            </div>
          </div>
        )
      case 7:
        // Basic info collection
        return (
          <div className="relative w-full">
            <button
              onClick={() => setCurrentStep(6)}
              className="absolute -top-60 sm:-top-80 left-0 p-2 text-[#1B5E20] font-semibold flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Back
            </button>
            <div className="flex flex-col items-center gap-6 sm:gap-8 pt-12">
              <div className="text-center mb-4">
                <h2 className="font-bold text-2xl sm:text-3xl text-[#212121] mb-2">
                  {currentStepData.title}
                </h2>
                {currentStepData.subtitle && (
                  <p className="text-sm text-gray-600">
                    {currentStepData.subtitle}
                  </p>
                )}
              </div>
              
              <div className="w-full max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    ref={firstNameInputRef}
                    type="text"
                    placeholder="Enter your first name"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145B10] focus:border-[#145B10]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && firstName.trim()) {
                        e.preventDefault()
                        lastNameInputRef.current?.focus()
                      }
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name (Optional)
                  </label>
                  <Input
                    ref={lastNameInputRef}
                    id="lastName"
                    type="text"
                    placeholder="Enter your last name"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145B10] focus:border-[#145B10]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        emailInputRef.current?.focus()
                      }
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (Optional)
                  </label>
                  <Input
                    ref={emailInputRef}
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#145B10] focus:border-[#145B10]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && firstName.trim()) {
                        e.preventDefault()
                        handleSaveBasicInfo()
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    You can add this later in your profile
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (showSplash) {
    return (
      <div className="relative h-screen bg-gradient-to-l from-[#145B10] to-[#729D70] flex items-center justify-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 1 }}>
          <AppIcon />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-[160px] left-[50%]"
        >
          <BubbleLoader />
        </motion.div>
      </div>
    )
  }

  const introSteps = [0, 1, 2, 3] // Steps that can be skipped
  const canSkip = introSteps.includes(currentStep)

  return (
    <div className="relative h-screen overflow-hidden bg-white">
      {/* Skip button for intro steps */}
      {canSkip && (
        <button
          onClick={handleSkipIntro}
          className="absolute top-6 right-4 sm:top-8 sm:right-8 z-50 flex items-center gap-2 text-[#1B5E20] font-semibold text-sm hover:text-[#145B10] transition-colors"
        >
          <span>Skip</span>
          <X className="w-4 h-4" />
        </button>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-32 w-full h-full px-4 sm:px-6 flex flex-col justify-center items-center"
        >
          <div className="flex flex-col absolute bottom-0 space-y-8 sm:space-y-[56px] w-full px-4 sm:px-6">
            <Step
              currentStepData={ONBOARDING_STEPS[currentStep]}
              stepNumber={currentStep}
              code={code}
              inputsRef={inputsRef}
              handleChange={handleChange}
              handleKeyDown={handleKeyDown}
              handlePaste={handlePaste}
              handleInputFocus={handleInputFocus}
            />
            <div className="mt-auto">
              <button
                onClick={handleNext}
                className="w-full bg-[#1B5E20] text-[#ffffff] py-4 sm:py-[20px] rounded-[100px] font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  isLoading || 
                  (currentStep === 6 && code.join("").length < OTP_LENGTH) ||
                  (currentStep === 4 && !selectedUserType) ||
                  (currentStep === 7 && !firstName.trim())
                }
              >
                {isLoading ? "Please wait..." : getButtonText()}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute w-full bottom-0 flex justify-center space-x-2 pb-8 sm:pb-12">
        {ONBOARDING_STEPS.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full ${index === currentStep ? "bg-[#1B5E20] w-6 sm:w-8 transition-all duration-300" : "bg-[#E0E0E0] w-2"}`}
          />
        ))}
      </div>
    </div>
  )
}

export default OnboardingPage

