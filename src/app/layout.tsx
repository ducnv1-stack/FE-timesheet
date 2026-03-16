import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Superb AI - Timesheet",
  description: "Timesheet",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(
        inter.className,
        outfit.variable,
        "bg-[#f8fafc] text-slate-900 antialiased min-h-screen"
      )}>
        {/* Decorative Background */}
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_50%,rgba(36,50,71,0.05)_0%,rgba(255,255,255)_100%)]" />
        <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />

        <ToastProvider>
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </ToastProvider>
      </body>
    </html>
  );
}
