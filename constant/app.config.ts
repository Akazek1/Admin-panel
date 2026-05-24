/**
 * Admin Panel Configuration
 * Centralized configuration for admin app-wide constants
 */

const APP_NAME = "Akazek";

export const APP_CONFIG = {
  name: APP_NAME,
  tagline: "Admin Dashboard",
  description: "Akazek Marketplace Administration",

  // Branding
  brand: {
    primaryColor: "#145B10",
    logo: "/logo.png",
  },

  // Contact & Support
  contact: {
    email: "admin@akazek.rw",
    phone: "+250788000000",
    website: "https://akazek.rw",
  },

  // Admin Portal
  admin: {
    title: `${APP_NAME} Admin Portal`,
    defaultTheme: "light",
  },

  // Feature Flags
  features: {
    userManagement: true,
    serviceManagement: true,
    bookingManagement: true,
    reporting: true,
    analytics: false, // Coming soon
  },
};

export default APP_CONFIG;
