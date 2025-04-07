// utils/unsplash.ts
export function getUnsplashImageUrl(index: number): string {
  // Sample list of Unsplash photo IDs (you can expand this)
  const photoIds = [
    "photo-1507003211169-0a1dd7228f2d", // Your original
    "photo-1517841905240-472988babdf9",
    "photo-1532074205216-d0e1f4b87368",
    "photo-1529626455594-4ff0802cfb7e",
    "photo-1494790108377-be9c29b29330",
  ];

  // Use index to select a photo ID (loop around if index exceeds length)
  const selectedId = photoIds[index % photoIds.length];

  // Construct the URL with consistent query params
  return `https://images.unsplash.com/${selectedId}?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80`;
}
