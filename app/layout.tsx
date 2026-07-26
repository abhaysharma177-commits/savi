import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Savi — a second opinion on your health, from the world's best doctors",
  description:
    "Tell us what's going on. Real, verified doctors from around the world review your case, and you get one clear answer. Free to start.",
  applicationName: "Savi",
  openGraph: {
    title: "Savi",
    description:
      "A second opinion on your health, from the world's best doctors. Free to start.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FBFAF7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} font-sans`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
