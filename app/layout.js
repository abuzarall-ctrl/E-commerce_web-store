import "./globals.css";
import Script from "next/script";
import { Nunito } from "next/font/google";
import Toast from "./components/Toast";
import CartSync from "./components/CartSync";
import WishlistSync from "./components/WishlistSync";
import ScrollProgress from "./components/ScrollProgress";
import { SiteSettingsProvider } from "./components/SiteSettingsProvider";
import { AuthStatusProvider } from "./components/AuthStatusProvider";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-nunito",
});

export const metadata = {
  title: {
    default: "AbuzarStore — Plastic, Glass & Melamine Crockery",
    template: "%s | AbuzarStore",
  },
  description:
    "Shop everyday crockery in plastic, glass and melamine. Practical plates, bowls, jugs and drinkware with delivery across Pakistan.",
  keywords: [
    "crockery online Pakistan",
    "plastic crockery",
    "melamine dinner set",
    "glassware set",
    "plastic dinner plates",
    "melamine plates",
    "kitchen and dining",
    "online shopping Pakistan",
    "AbuzarStore",
  ],
  openGraph: {
    title: "AbuzarStore — Plastic, Glass & Melamine Crockery",
    description:
      "Everyday crockery in plastic, glass and melamine. Practical pieces for the table, delivered across Pakistan.",
    type: "website",
    locale: "en_PK",
    siteName: "AbuzarStore",
  },
  twitter: {
    card: "summary",
    title: "AbuzarStore — Plastic, Glass & Melamine Crockery",
    description:
      "Plastic, glass and melamine crockery delivered across Pakistan.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#1C1C1A' },
    { media: '(prefers-color-scheme: light)', color: '#FAF6EF' },
  ],
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <SiteSettingsProvider>
          <AuthStatusProvider>
            <CartSync />
            <WishlistSync />
            <ScrollProgress />
            {children}
            <Toast />
          </AuthStatusProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
