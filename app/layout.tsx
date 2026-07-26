import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Nest · by Hotel Wren",
  description: "A calmer way to spend the day at Hotel Wren in Twentynine Palms.",
  icons: { icon: "/favicon.svg" },
  openGraph: { title: "The Nest · by Hotel Wren", description: "A calmer way to spend the day.", images: [{ url: "/og.png", width: 1731, height: 909 }] },
  twitter: { card: "summary_large_image", title: "The Nest · by Hotel Wren", description: "A calmer way to spend the day.", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
