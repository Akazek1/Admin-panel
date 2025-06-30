"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Scroller from "../scroller";
import { Icons } from "@/components/icons";
import api from "@/lib/axios";
import { getUnsplashImageUrl } from "@/lib/unsplash";
import { Loader2 } from "lucide-react";

interface Category {
  title: string;
  image: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/services");
      const services = response.data.data;

      // Extract unique categories
      const uniqueCategories: { [key: string]: boolean } = {};
      const categoryList: Category[] = [];

      interface Service {
        category: string;
      }

      services.forEach((service: Service, index: number) => {
        const title = service.category;
        if (!uniqueCategories[title]) {
          uniqueCategories[title] = true;
          categoryList.push({
            title,
            image: getUnsplashImageUrl(index), // Use Unsplash or fallback
          });
        }
      });

      setCategories(categoryList);
    } catch (err) {
      console.error("Failed to fetch categories", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryClick = (category: string) => {
    router.push(`/service/?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="pt-6 pb-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-[#1B2431] font-normal text-[18px]">
          Browse all categories
        </h1>
        <button className="text-[12px] text-[#1B2431] font-medium flex items-center gap-2">
          View all
          <Icons.NextIcon className="w-3 h-3 fill-[#1B2431]" />
        </button>
      </div>

      {isLoading ? (
        <div className="w-full flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#145B10]" />
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Scroller
            items={categories}
            visibleItems={5.3}
            renderItem={(item) => (
              <div
                onClick={() => handleCategoryClick(item.title)}
                className="rounded-lg px-2 overflow-hidden flex flex-col items-center justify-center gap-1 w-full cursor-pointer"
              >
                <Image
                  height={500}
                  width={500}
                  src={item.image}
                  alt={item.title}
                  className="w-14 h-14 rounded-full object-cover"
                  loading="lazy"
                />
                <div className="w-full text-center">
                  <h3 className="text-[12px] font-semibold text-gray-800">
                    {item.title}
                  </h3>
                </div>
              </div>
            )}
          />
        </div>
      )}
      {!isLoading  && categories.length === 0 && (
        <div className="text-center text-[#878787]">
          No categories found.
        </div>
      )}
    </div>
  );
}
