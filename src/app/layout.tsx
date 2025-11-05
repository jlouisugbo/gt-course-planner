import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers/AppProviders";
import AppLayout from "@/components/layout/AppLayout";

// const inter = Inter({
//     subsets: ["latin"],
//     variable: '--font-inter',
//     display: 'swap',
// });

export const metadata: Metadata = {
    title: "GT 4-Year Planner",
    description: "Plan your Georgia Tech academic journey",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="font-sans">
                <AppProviders>
                    <AppLayout>{children}</AppLayout>
                </AppProviders>
            </body>
        </html>
    );
}
