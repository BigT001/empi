import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./components/CartContext";
import { BuyerProvider } from "./context/BuyerContext";
import { AdminProvider } from "./context/AdminContext";
import { ModeProvider } from "./context/ModeContext";
import { HomeModeProvider } from "./context/HomeModeContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { ScrollToTop } from "./components/ScrollToTop";
import { FloatingSupport } from "./components/FloatingSupport";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "EMPI - Premium Costume Rentals & Sales in Lagos | Professional Costume Maker",
  description: "EMPI is Lagos's leading costume maker offering premium adult and kids costumes for rent and sale. High-quality party, event, and themed costumes in Lagos, Nigeria.",
  keywords: ["costume maker Lagos", "costume rental Lagos", "party costumes Nigeria", "themed costumes", "costume shop Lagos", "adult costumes", "kids costumes"],
  robots: "index, follow",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://empi.com.ng",
    siteName: "EMPI - Premium Costumes Lagos",
    title: "EMPI - Premium Costume Rentals & Sales in Lagos",
    description: "Professional costume maker in Lagos offering quality adult and kids costumes for all occasions",
    images: [
      {
        url: "/logo/EMPI-2k24-LOGO-1.PNG",
        width: 1200,
        height: 1200,
        alt: "EMPI Premium Costumes Lagos",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "EMPI - Premium Costume Rentals & Sales in Lagos",
    description: "Professional costume maker in Lagos offering quality adult and kids costumes",
    images: ["/logo/EMPI-2k24-LOGO-1.PNG"]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        {/* Paystack Payment Gateway Script */}
        <script src="https://js.paystack.co/v1/inline.js" async></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ScrollToTop />
        <FloatingSupport />
        <BuyerProvider>
          <CurrencyProvider>
            <HomeModeProvider>
              <ModeProvider>
                <AdminProvider>
                  <CartProvider>
                    {children}
                  </CartProvider>
                </AdminProvider>
              </ModeProvider>
            </HomeModeProvider>
          </CurrencyProvider>
        </BuyerProvider>
      </body>
    </html>
  );
}
