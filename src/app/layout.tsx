import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/components/theme/ThemeProvider";
import { LastLocationTracker } from "~/components/LastLocationTracker";
import { Toaster } from "~/components/ui/sonner";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Faça um teste",
  description: "Crie, aplique ou resolva um teste",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <Suspense fallback={null}>
          <LastLocationTracker />
        </Suspense>
        <TRPCReactProvider>
          <ThemeProvider>
            {children}
            <Toaster richColors closeButton />
          </ThemeProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}

