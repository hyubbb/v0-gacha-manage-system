import type React from "react";
import { Inter } from "next/font/google";
import ClientLayout from "./client-layout";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='ko' suppressHydrationWarning={true}>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
