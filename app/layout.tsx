import type React from "react";
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { AppWrapper } from "@/components/app-wrapper";
import { AppProvider } from "@/lib/app-state";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Made with App Studio",
  description: "Chat with an AI editor to make 3D photo and short video edits.",
    generator: 'v0.app'
};

export const viewport: Viewport = {
  themeColor: "#fbfcfd",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-background">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <AppWrapper>
          <AppProvider>{children}</AppProvider>
        </AppWrapper>
        <Toaster theme="light" position="top-center" />
      </body>
    </html>
  );
}
