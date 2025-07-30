import api from "@/lib/axios";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Banner {
  url: string;
}

const fallbackBannerUrl = "/images/Banner.png";

const PromoBanner = () => {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBanner() {
      try {
        setLoading(true)
        const res = await api.get("/admin/banner");
        setBanner(res.data.data as Banner);
      } catch (error: unknown) {
        console.error("Failed to fetch banner:", error);
        setBanner({ url: fallbackBannerUrl });
        toast.error("Failed to fetch banner. Showing placeholder.");
      } finally {
        setLoading(false);
      }
    }
    fetchBanner();
  }, []);


  return (
    <div className="w-full rounded-[32px] overflow-hidden">
      {
        loading ?
          <div className="min-h-28 bg-[#F1FCEF] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#145B10]" />
          </div>
          :
          <Image
            src={banner?.url ?? fallbackBannerUrl}
            alt="Promo"
            width={500}
            height={500}
            className="h-[181px] object-cover"
          />

      }
    </div>
  );
};

export default PromoBanner;
