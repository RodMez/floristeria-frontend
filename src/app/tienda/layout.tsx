import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SessionExpiredListener from "@/components/auth/SessionExpiredListener";

export default function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <SessionExpiredListener />
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
