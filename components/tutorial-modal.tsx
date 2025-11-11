"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Briefcase, ArrowRight } from "lucide-react";
import ViewModeToggle from "./view-mode-toggle";
import { useViewMode } from "@/context/view-mode-context";

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const { viewMode } = useViewMode();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Welcome to HWA! 🎉</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Switch Between Two Views
              </h3>
              <p className="text-gray-600 mb-4">
                You can switch between being an <strong>Employer</strong> and a <strong>Provider</strong> anytime! Use the toggle above to switch views.
              </p>
              
              <div className="flex justify-center mb-4">
                <ViewModeToggle />
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-[#F1FCEF] rounded-lg">
                  <div className="p-2 bg-[#145B10] rounded-lg mt-0.5">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Employer Mode</h4>
                    <p className="text-sm text-gray-600">
                      Browse and hire service providers for your needs
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-[#F1FCEF] rounded-lg">
                  <div className="p-2 bg-[#145B10] rounded-lg mt-0.5">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Provider Mode</h4>
                    <p className="text-sm text-gray-600">
                      Find job postings and work opportunities
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="w-full bg-[#145B10] text-white py-3 rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-[#1B5E20] transition-colors"
              >
                Got it!
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TutorialModal;

