/**
 * Admin Panel Configuration
 * Centralized configuration for admin app-wide constants
 */

const APP_NAME = "Huza";

export const APP_CONFIG = {
  name: APP_NAME,
  tagline: "Admin Dashboard",
  description: "Huza Marketplace Administration",

  // Branding
  brand: {
    primaryColor: "#145B10",
    logo: "/brand/akazek-logo-dark.png",
  },

  // Contact & Support
  contact: {
    email: "admin@huza.app",
    phone: "+250788000000",
    website: "https://www.huza.app",
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
