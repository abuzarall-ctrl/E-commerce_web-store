import "./globals.css";
import Script from "next/script";
import Toast from "./components/Toast";

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
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
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
