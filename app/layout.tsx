import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HJ Financial Operation",
  description: "Private lending operations and loan management platform",
  icons: {
    icon: "/loan-manager-logo.png",
    shortcut: "/loan-manager-logo.png",
    apple: "/loan-manager-logo.png",
  },
  openGraph: {
    title: "HJ Financial Operation",
    description: "Private lending operations and loan management platform",
    images: ["/loan-manager-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ClerkProvider>
        <body className={`${inter.variable} ${jetBrainsMono.variable} antialiased`}>
          {children}
          <Toaster richColors position="top-right" />
        </body>
      </ClerkProvider>
    </html>
  );
}
