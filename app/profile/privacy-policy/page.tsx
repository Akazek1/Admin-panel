import React from "react";
import BackButtonHeader from "@/components/header/back-button-header";
import { Separator } from "@/components/ui/separator";
import { PrivacyPolicyData } from "@/constant";

const PrivacyPolicy = () => {
  return (
    <div className="bg-[#F1FCEF] px-6 py-11 space-y-6 font-urbanist">
      {/* Header */}
      <BackButtonHeader text="Privacy Policy" />
      <Separator />
      <div className="space-y-8">
        {PrivacyPolicyData.map((section) => (
          <section key={section.id} className="space-y-6">
            <h2 className="text-xl leading-6 font-bold text-[#212121] font-urbanist">
              {section.id}. {section.title}
            </h2>
            <p className="text-[#424242] font-normal text-sm tracking-[0.2px] font-urbanist">
              {section.content}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
};

export default PrivacyPolicy;
