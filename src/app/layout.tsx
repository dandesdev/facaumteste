import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { LastLocationTracker } from "~/components/LastLocationTracker";
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
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
