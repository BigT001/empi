import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./components/CartContext";
import { BuyerProvider } from "./context/BuyerContext";
import { AdminProvider } from "./context/AdminContext";
import { ModeProvider } from "./context/ModeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EMPI - Premium Costume Rentals & Sales in Lagos | Professional Costume Maker",
  description: "EMPI is Lagos's leading costume maker offering premium adult and kids costumes for rent and sale. High-quality party, event, and themed costumes in Lagos, Nigeria.",
  keywords: ["costume maker Lagos", "costume rental Lagos", "party costumes Nigeria", "themed costumes", "costume shop Lagos", "adult costumes", "kids costumes"],
  robots: "index, follow",
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
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  icons: {
    icon: "/logo/EMPI-2k24-LOGO-1.PNG",
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
        {/* Paystack Payment Gateway Script */}
        <script src="https://js.paystack.co/v1/inline.js" defer></script>
        {/* Ensure Paystack loads even if script fails */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (!window.PaystackPop) {
                const script = document.createElement('script');
                script.src = 'https://js.paystack.co/v1/inline.js';
                script.async = true;
                document.head.appendChild(script);
              }
            `
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ModeProvider>
          <AdminProvider>
            <BuyerProvider>
              <CartProvider>
                {children}
              </CartProvider>
            </BuyerProvider>
          </AdminProvider>
        </ModeProvider>
      </body>
    </html>
  );
}
