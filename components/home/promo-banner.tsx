import Image from "next/image";

const PromoBanner = () => {
  return (
    <div className="w-full rounded-[32px] overflow-hidden">
      <Image
        src="/images/Banner.png"
        alt="Promo"
        width={500}
        height={500}
        className=" h-[181px] object-cover"
      />
    </div>
  );
};

export default PromoBanner;
