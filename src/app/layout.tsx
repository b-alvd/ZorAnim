import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import CookieConsent from "@/components/CookieConsent/CookieConsent";
import RevealOverlay from "@/components/RevealGate/RevealOverlay";
import MaintenanceOverlay from "@/components/RevealGate/MaintenanceOverlay";
import BanGate from "@/components/BanGate/BanGate";
import BanWatcher from "@/components/BanWatcher/BanWatcher";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getLatestBanAppeal, getNotifications, getSiteSettings, getUnreadNotificationCount } from "@/db/queries";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "ZorAnim",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, settings] = await Promise.all([getCurrentUser(), getSiteSettings()]);
  const [notifications, unreadCount] = user
    ? await Promise.all([getNotifications(user.id, 10), getUnreadNotificationCount(user.id)])
    : [[], 0];
  const latestAppeal = user?.banned ? await getLatestBanAppeal(user.id) : null;

  if (user?.banned) {
    return (
      <html lang="fr" className={montserrat.variable}>
        <body>
          <BanGate
            banReason={user.banReason}
            appealStatus={latestAppeal?.status ?? null}
            appealMessage={latestAppeal?.message ?? null}
          />
        </body>
      </html>
    );
  }

  return (
    <html lang="fr" className={montserrat.variable}>
      <body>
        {user && <BanWatcher />}
        <Navbar user={user} notifications={notifications} unreadCount={unreadCount} />
        {children}
        <Footer />
        <CookieConsent />
        <MaintenanceOverlay enabled={settings.maintenanceEnabled} isAdmin={user?.role === "admin"} />
        {!settings.maintenanceEnabled && (
          <RevealOverlay
            initialEnabled={settings.revealEnabled}
            revealAt={settings.revealAt}
            isAdmin={user?.role === "admin"}
          />
        )}
      </body>
    </html>
  );
}
