import { Icons } from "@/components/icons";

export interface NavItem {
  title: string;
  url: string;
  disabled?: boolean;
  external?: boolean;
  icon?: keyof typeof Icons;
  label?: string;
  description?: string;
  isActive?: boolean;
  items?: NavItem[];
  matchPattern?: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  serviceImage: string;
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    userType: "AGENCY" | "INDIVIDUAL";
  };
  worker?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    languages: string[];
  };
  reviews: {
    averageRating: number;
    totalReviews: number;
  };
  serviceAreas: string[];
}

export interface Provider {
  id: string;
  image: string;
  name: string;
  title: string;
  experience: string;
  languages: string;
  location: string;
  price: string;
  rating: number;
  reviews: number;
  distance: string;
  available: boolean;
  verified: boolean;
  type: string;
  phoneNumber?: string;
}
