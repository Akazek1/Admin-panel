export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  serviceImage: string;
  category: string;
  serviceType: string;
  serviceAreas: string[];
  isActive: boolean;
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    userType: string;
    profilePicture: string;
    phoneNumber: string;
  };
  worker: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    languages: string[];
  };
  availability: Array<{
    id: string;
    serviceId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  reviews: {
    totalReviews: number;
    averageRating: number;
  };
}
