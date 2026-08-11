import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import Toast from "./components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "AbuzarStore — Pakistani Clothing",
    template: "%s | AbuzarStore",
  },
  description:
    "Real quality at honest prices. T-Shirts, Shalwar Kameez, Kurta, Shorts & Trousers. Shop online across Pakistan.",
  keywords: [
    "Pakistani clothing",
    "shalwar kameez",
    "kurta",
    "t-shirts",
    "online shopping Pakistan",
    "AbuzarStore",
  ],
  openGraph: {
    title: "AbuzarStore — Pakistani Clothing",
    description:
      "Real quality at honest prices. T-Shirts, Shalwar Kameez, Kurta, Shorts & Trousers. Shop online across Pakistan.",
    type: "website",
    locale: "en_PK",
    siteName: "AbuzarStore",
  },
  twitter: {
    card: "summary",
    title: "AbuzarStore — Pakistani Clothing",
    description:
      "Real quality at honest prices. T-Shirts, Shalwar Kameez, Kurta, Shorts & Trousers.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
        {children}
        <Toast />
      </body>
    </html>
  );
}
