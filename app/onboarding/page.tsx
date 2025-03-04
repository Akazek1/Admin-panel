"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import AppIcon from "@/public/svg/app-icon.svg";
import GreenAppIcon from "@/public/svg/green-app-icon.svg";
import RightFlowerIcon from "@/public/svg/flower.svg";
import LeftFlowerIcon from "@/public/svg/left-flower.svg";
import BubbleLoader from "@/components/loader/Bubble-Loader.tsx";
import { useRouter } from "next/navigation";

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
    buttonText: "Next Step",
  },
  {
    title: "Get services by HWA's verified professionals.",
    image:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=800",
    bgColor: "bg-[#1B5E20]",
    textColor: "text-white",
    buttonText: "Get Started",
  },
];

const Step: React.FC<{
  currentStepData: OnboardingStep;
  stepNumber: number;
}> = ({ currentStepData, stepNumber }) => {
  const imageWrapper = "p-6 bg-[#F1FCEF] rounded-full";
  const imageStyle = "w-[287px] h-[287px] object-cover rounded-full";

  const renderImage = () => (
    <div className={imageWrapper}>
      <Image
        height={800}
        width={500}
        src={currentStepData.image || "/placeholder.svg"}
        alt={`Onboarding step ${stepNumber + 1}`}
        className={imageStyle}
      />
    </div>
  );

  switch (stepNumber) {
    case 0:
      return (
        <div>
          <div className="absolute -right-[130px] -top-56 flex">
            <LeftFlowerIcon />
            {renderImage()}
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
            {renderImage()}
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
            {renderImage()}
          </div>
        </div>
      );
    default:
      return null;
  }
};

const OnboardingPage = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentStep, setCurrentStep] = useState(-1);

  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      setCurrentStep(0);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      router.push("/");
    }
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
    <div className="relative min-h-screen overflow-hidden bg-white">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-32 w-full h-full px-6 flex flex-col justify-center items-center"
        >
          <div className="flex flex-col absolute bottom-0 space-y-[60px] w-full px-6">
            <Step
              currentStepData={ONBOARDING_STEPS[currentStep]}
              stepNumber={currentStep}
            />

            <div className="mt-auto">
              <button
                onClick={handleNext}
                className="w-full bg-[#1B5E20] text-[#ffffff] py-[20px] rounded-[100px] font-bold"
              >
                {ONBOARDING_STEPS[currentStep].buttonText}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute w-full bottom-0 flex justify-center space-x-2 pb-12">
        {ONBOARDING_STEPS.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full ${
              index === currentStep
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
