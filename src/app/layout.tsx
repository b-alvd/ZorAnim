import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import CookieConsent from "@/components/CookieConsent/CookieConsent";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getNotifications, getUnreadNotificationCount } from "@/db/queries";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "ZorAnim",
  description: "ZorAnim est la plateforme de streaming dédiée aux courts-métrages d'animation 2D d'artistes indépendants.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const [notifications, unreadCount] = user
    ? await Promise.all([getNotifications(user.id, 10), getUnreadNotificationCount(user.id)])
    : [[], 0];

  return (
    <html lang="fr" className={montserrat.variable}>
      <body>
        <Navbar user={user} notifications={notifications} unreadCount={unreadCount} />
        {children}
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
