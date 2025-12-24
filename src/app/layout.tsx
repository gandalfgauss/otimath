import "../styles/globals.css";
import type { Metadata } from 'next';
import { Footer } from "@/components/global/Footer";
import { Header } from "@/components/global/Header";

export const metadata: Metadata = {
  title: {
    default: 'Oti-Math | Soluções Matemáticas',
    template: '%s | Oti-Math',
  },
  description: 'Desenvolvemos ferramentas para resolver problemas matemáticos.',
  keywords: [
    'matemática', 
    'ensino de matemática',
    'educação',
    'solução de problemas computacionais', 
    'algoritmos de otimização',
    'modelagem matemática',
    'IA para otimização'
  ],
  openGraph: {
    title: {
      default: 'Oti-Math | Soluções Matemáticas',
      template: '%s | Oti-Math',
    },
    description: 'Desenvolvemos ferramentas para resolver problemas matemáticos.',
    url: 'https://otimath.com',
    siteName: 'Oti-Math',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Logo da Oti-Math',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      default: 'Oti-Math | Soluções Matemáticas',
      template: '%s | Oti-Math',
    },
    description: 'Desenvolvemos ferramentas para resolver problemas matemáticos.',
    images: ['/twitter-card.png'],
    creator: '@otimath_tech',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
  alternates: {
    canonical: 'https://otimath.com',
  },
  metadataBase: new URL('https://otimath.com'),
  category: 'matemática',
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth scroll-pt-[68px]">
      <head>
      </head>
      <body
        className={`antialiased bg-background-otimath text-brand-otimath-pure font-family-base not-italic no-underline`}
      > 
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}