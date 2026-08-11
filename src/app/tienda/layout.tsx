import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import SedeAutoSelector from "@/components/layout/SedeAutoSelector";
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
      <SedeAutoSelector />
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
    </SWRProvider>
  );
}
