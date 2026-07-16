import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SessionExpiredListener from "@/components/auth/SessionExpiredListener";
import SWRProvider from "@/components/providers/SWRProvider";

export default function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SWRProvider>
      <div className="min-h-screen flex flex-col">
        <SessionExpiredListener />
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>
    </SWRProvider>
  );
}
