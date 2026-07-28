import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { getCurrentUser } from "@/lib/auth/current-user";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZorAnim",
  description: "ZorAnim est la plateforme de streaming dédiée aux courts-métrages d'animation 2D d'artistes indépendants.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="fr" className={montserrat.variable}>
      <body>
        <Navbar user={user} />
        {children}
        <Footer />
      </body>
    </html>
  );
}
