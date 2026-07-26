import type { Metadata } from "next";
import "./globals.css";

const siteHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteHost ? `https://${siteHost}` : "http://localhost:3000"),
  title: "The Nest · by Hotel Wren",
  description: "A calmer way to spend the day at Hotel Wren in Twentynine Palms.",
  icons: { icon: "/favicon.svg" },
  openGraph: { title: "The Nest · by Hotel Wren", description: "A calmer way to spend the day.", images: [{ url: "/og.png", width: 1731, height: 909 }] },
  twitter: { card: "summary_large_image", title: "The Nest · by Hotel Wren", description: "A calmer way to spend the day.", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
