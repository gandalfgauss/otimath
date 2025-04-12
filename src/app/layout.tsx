import "./globals.css";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Oti-Math | Soluções em Otimização Matemática',
    template: '%s | Oti-Math',
  },
  description: 'Desenvolvemos ferramentas avançadas para resolver problemas complexos de otimização matemática e computacional. Maximize eficiência com nossas soluções personalizadas.',
  keywords: [
    'otimização matemática', 
    'solução de problemas computacionais', 
    'algoritmos de otimização',
    'modelagem matemática',
    'IA para otimização'
  ],
  openGraph: {
    title: 'Oti-Math | Transformando Problemas em Soluções',
    description: 'Ferramentas inteligentes para otimização matemática e computacional. Ideal para empresas, pesquisadores e desenvolvedores.',
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
    title: 'Oti-Math | Otimização Matemática de Alto Desempenho',
    description: 'Conheça nossas ferramentas para resolver problemas complexos com eficiência computacional.',
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
  category: 'tecnologia',
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
