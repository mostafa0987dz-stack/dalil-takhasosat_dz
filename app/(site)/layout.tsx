import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileTabBar from "@/components/MobileTabBar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
      <Header />
      <main>{children}</main>
      <Footer />
      <MobileTabBar />
    </div>
  );
}
