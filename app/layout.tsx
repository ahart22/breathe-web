import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Breathe",
  description: "Take a break and take a breath.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#06080d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Browser extensions (Grammarly and friends) inject attributes onto
          <body> before React loads, which React then reports as a hydration
          mismatch. This suppresses that one element's own attributes only —
          it does not extend to any child, so real mismatches inside the app
          still surface. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
