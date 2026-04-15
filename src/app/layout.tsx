import type { Metadata } from "next";
import "./globals.css";

const title = "Cortex — Brain Pattern Recognition for Neuroscience Research";
const description = "Cortex identifies autism-associated connectivity patterns in brain scans. Three research tools: cohort stratification, atypicality flagging, and biomarker discovery.";
const url = "https://cortex.mind.new";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title,
  description,
  keywords: ["cortex", "neurodiversity", "autism research", "connectivity", "brain stratification", "biomarker discovery", "fMRI QC", "neuroscience AI"],
  authors: [{ name: "Ibrahim Raza" }, { name: "Meraj Faheem" }],
  creator: "Leeza Care Research & Development Foundation",
  publisher: "Leeza Care",
  openGraph: {
    title,
    description,
    url,
    siteName: "cortex",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
