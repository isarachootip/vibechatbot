import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fastauto Service - Auto1",
  description: "ศูนย์บริการรถยนต์ครบวงจร Fastauto Service",
};
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ClientLayoutWrapper } from "@/components/layout/ClientLayoutWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <AuthProvider>
          <CartProvider>
            <ClientLayoutWrapper>
              {children}
            </ClientLayoutWrapper>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
