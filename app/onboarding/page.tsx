"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import AppIcon from "@/public/svg/app-icon.svg";
import GreenAppIcon from "@/public/svg/green-app-icon.svg";
import RightFlowerIcon from "@/public/svg/flower.svg";
import LeftFlowerIcon from "@/public/svg/left-flower.svg";
import BubbleLoader from "@/components/loader/Bubble-Loader.tsx";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const CODE_LENGTH = 4;

interface OnboardingStep {
  title: string;
  image: string;
  bgColor: string;
  textColor: string;
  buttonText: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: "Quality, Affordable, Best Services.",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#145B10]",
    textColor: "text-[#1B5E20]",
    buttonText: "Next",
  },
  {
    title: "Quick & Professional Solutions to your Problems.",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#729D70]",
    textColor: "text-[#145B10]",
    buttonText: "Next",
  },
  {
    title: "Get services by HWA's verified professionals.",
    image:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#1B5E20]",
    textColor: "text-white",
    buttonText: "Next",
  },
  {
    title: "Get services by HWA's verified professionals.",
    image:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#1B5E20]",
    textColor: "text-white",
    buttonText: "Next",
  },
  {
    title: "Get services by HWA's verified professionals.",
    image:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#1B5E20]",
    textColor: "text-white",
    buttonText: "Submit",
  },
  {
    title: "",
    image:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#1B5E20]",
    textColor: "text-white",
    buttonText: "Submit",
  },
];

const Step: React.FC<{
  currentStepData: OnboardingStep;
  stepNumber: number;
  code: string[];
  setCode: React.Dispatch<React.SetStateAction<string[]>>;
  inputsRef: React.MutableRefObject<Array<HTMLInputElement | null>>;
  handleChange: (value: string, index: number) => void;
  handleKeyDown: (e: React.KeyboardEvent, index: number) => void;
  handlePaste: (e: React.ClipboardEvent) => void;
}> = ({ currentStepData, stepNumber, code, inputsRef, handleChange, handleKeyDown, handlePaste }) => {
  const imageWrapper = "p-6 bg-[#F1FCEF] rounded-full";
  const imageStyle = "w-[287px] h-[287px] object-cover rounded-full";

  const renderImage = (height: number = 287, width: number = 287) => (
    <div className={imageWrapper}>
      <Image
        height={400}
        width={400}
        src={currentStepData.image || "/placeholder.svg"}
        alt={`Onboarding step ${stepNumber + 1}`}
        className={`${imageStyle} w-[${width}px] h-[${height}px]`}
      />
    </div>
  );

  switch (stepNumber) {
    case 0:
      return (
        <div>
          <div className="absolute -right-[130px] -top-56 flex">
            <LeftFlowerIcon />
            {renderImage(287, 287)}
          </div>
          <div className="mb-8">
            <div className={`${currentStepData.textColor} text-4xl font-serif`}>
              <GreenAppIcon />
            </div>
          </div>
          <h1 className="text-[40px] font-bold leading-[48px] text-gray-900 mb-8 max-w-[280px]">
            {currentStepData.title}
          </h1>
        </div>
      );
    case 1:
      return (
        <div>
          <div className="absolute -left-[130px] -top-[350px] flex items-center">
            {renderImage(287, 287)}
            <RightFlowerIcon />
          </div>
          <div className="text-right flex items-center justify-end w-full">
            <h1 className="text-[40px] font-bold leading-[48px] text-gray-900 mb-8">
              {currentStepData.title}
            </h1>
          </div>
        </div>
      );
    case 2:
      return (
        <div className="h-full">
          <div className="flex flex-col items-center gap-[60px]">
            <div className="text-center flex items-center justify-center w-full">
              <h1 className="text-[40px] font-bold leading-[48px] text-gray-900 mb-8">
                {currentStepData.title}
              </h1>
            </div>
            {renderImage(287, 287)}
          </div>
        </div>
      );
    case 3:
      return (
        <div>
          <div className="mb-2">
            <div className={`${currentStepData.textColor} flex items-center justify-center text-4xl font-serif`}>
              <GreenAppIcon />
            </div>
          </div>
          <div className={`${imageWrapper} flex items-center justify-between w-max mx-auto mb-10`}>
            <Image
              height={400}
              width={400}
              src={currentStepData.image || "/placeholder.svg"}
              alt={`Onboarding step ${stepNumber + 1}`}
              className={`${imageStyle} w-[260px] h-[260px]`}
            />
          </div>
          <div className="flex items-center border border-black rounded-xl overflow-hidden w-full">
            <div className="flex items-center gap-2 pl-3 pr-5 py-4 border-r border-black">
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
              type="text"
              placeholder="Phone Number"
              className="px-4 py-4 text-[#212121] font-semibold placeholder:text-[#212121] placeholder:font-semibold placeholder:text-sm 
             border-none focus:outline-none focus:ring-0 focus:border-transparent 
             active:outline-none active:ring-0 active:border-transparent shadow-none"
            />
          </div>
        </div>
      );
    case 4:
      return (
        <div className="flex flex-col items-center gap-20">
          <span className="flex flex-col items-center gap-2 mb-8">
            <h2 className="font-bold text-3xl text-[#212121]">Enter Verification Code</h2>
            <p className="text-sm font-bold text-center text-[#212121]">
              We have sent you a 4 digit verification code on your registered mobile
            </p>
          </span>
          <div onPaste={handlePaste} className="flex gap-6">
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-16 h-12 text-center text-lg font-medium border border-black rounded-md focus:ring-2 focus:ring-none focus:outline-none outline-none"
              />
            ))}
          </div>
        </div>
      );
    case 5:
      return (
        <>
          <div className="h-full flex flex-col items-center justify-center gap-[13px]">
            <GreenAppIcon />
            {renderImage(287, 287)}
          </div>
          <div className="mt-14 w-full">
            <Select>
              <SelectTrigger className="w-full py-4 border border-black rounded-xl overflow-hidden">
                <SelectValue placeholder="Customer" className="text-black" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Agency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      );
    default:
      return null;
  }
};

const OnboardingPage = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isVerified, setIsVerified] = useState(false);
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const inputsRef = useRef<Array<HTMLInputElement | null>>(Array(CODE_LENGTH).fill(null));

  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      setCurrentStep(0);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const handleChange = (value: string, index: number) => {
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    if (newCode.every((val) => val)) {
      const finalCode = newCode.join("");
      console.log("Code entered:", finalCode);
      setIsVerified(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasteData = e.clipboardData.getData("text").slice(0, CODE_LENGTH).split("");
    const newCode = [...code];

    for (let i = 0; i < CODE_LENGTH; i++) {
      newCode[i] = pasteData[i] || "";
    }
    setCode(newCode);

    const nextIndex = Math.min(pasteData.length - 1, CODE_LENGTH - 1);
    inputsRef.current[nextIndex]?.focus();

    if (pasteData.length === CODE_LENGTH) {
      const finalCode = pasteData.join("");
      console.log("Code entered:", finalCode);
      setIsVerified(true);
    }

    e.preventDefault();
  };

  const handleNext = () => {
    if (currentStep === 4 && !isVerified) {
      return;
    }
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setIsVerified(false);
    } else {
      router.push("/");
    }
  };

  const getButtonText = () => {
    if (currentStep === 4 && !isVerified) {
      return "Verify";
    }
    return ONBOARDING_STEPS[currentStep].buttonText;
  };

  if (showSplash) {
    return (
      <div className="relative h-screen bg-gradient-to-l from-[#145B10] to-[#729D70] flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1 }}
        >
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
    );
  }

  return (
    <div className="relative h-screen overflow-hidden bg-white">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-32 w-full h-full px-6 flex flex-col justify-center items-center"
        >
          <div className="flex flex-col absolute bottom-0 space-y-[56px] w-full px-6">
            <Step
              currentStepData={ONBOARDING_STEPS[currentStep]}
              stepNumber={currentStep}
              code={code}
              setCode={setCode}
              inputsRef={inputsRef}
              handleChange={handleChange}
              handleKeyDown={handleKeyDown}
              handlePaste={handlePaste}
            />
            <div className="mt-auto">
              <button
                onClick={handleNext}
                className="w-full bg-[#1B5E20] text-[#ffffff] py-[20px] rounded-[100px] font-bold"
                disabled={currentStep === 4 && !code.every((digit) => digit)}
              >
                {getButtonText()}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute w-full bottom-0 flex justify-center space-x-2 pb-12">
        {ONBOARDING_STEPS.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full ${index === currentStep
              ? "bg-[#1B5E20] w-8 transition transform 1s"
              : "bg-[#E0E0E0] w-2"
              }`}
          />
        ))}
      </div>
    </div>
  );
};

export default OnboardingPage;