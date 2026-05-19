'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartSheet } from "@/components/cart/CartSheet";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { Toaster } from "@/components/ui/sonner";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isEmbed = pathname?.startsWith('/embed') || false;

    if (isEmbed) {
        return (
            <main className="flex-1 w-full h-full bg-transparent">
                {children}
            </main>
        );
    }

    return (
        <>
            <Navbar />
            <main className="flex-1">
                {children}
            </main>
            <Footer />
            <CartSheet />
            <ChatWidget />
            <Toaster />
        </>
    );
}
