import Image from "next/image";

function Chip({
  children,
  label,
  compact = false,
  tight = false,
  className = "",
}: {
  children: React.ReactNode;
  label: string;
  compact?: boolean;
  tight?: boolean;
  className?: string;
}) {
  const px = tight ? "px-1" : compact ? "px-2" : "px-3.5";
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-lg bg-white shadow-sm ${px} ${className}`}
      aria-label={label}
      title={label}
    >
      {children}
    </div>
  );
}

export default function PaymentMethods() {
  return (
    <div className="border-t border-stone-800 pt-4 mt-2">
      <h5 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-stone-500">
        Métodos de pago
      </h5>

      <div className="flex flex-wrap gap-2.5">
        {/* ── Billeteras / Transferencia ── */}
        <Chip label="Nequi">
          <Image
            src="/payments/nequi.svg"
            alt="Nequi"
            width={80}
            height={22}
            className="h-6 w-auto object-contain"
          />
        </Chip>

        <Chip label="DaviPlata" tight className="flex-1 min-w-[140px]">
          <Image
            src="/payments/daviplata.svg"
            alt="DaviPlata"
            width={120}
            height={28}
            className="h-7 w-auto object-contain"
          />
        </Chip>

        <Chip label="SU+ Pay" compact>
          <Image
            src="/payments/su-pay.png"
            alt="SU+ Pay"
            width={72}
            height={20}
            className="h-7 w-auto object-contain"
          />
        </Chip>

        <Chip label="Bancolombia">
          <Image
            src="/payments/bancolombia.svg"
            alt="Bancolombia"
            width={110}
            height={20}
            className="h-5 w-auto object-contain"
          />
        </Chip>

        {/* ── Tarjetas ── */}
        <Chip label="Visa" compact>
          <Image
            src="/payments/visa.png"
            alt="Visa"
            width={64}
            height={20}
            className="h-7 w-auto object-contain"
          />
        </Chip>

        <Chip label="Mastercard">
          <Image
            src="/payments/mastercard.svg"
            alt="Mastercard"
            width={46}
            height={28}
            className="h-7 w-auto object-contain"
          />
        </Chip>

        <Chip label="American Express" tight>
          <Image
            src="/payments/amex.jpg"
            alt="American Express"
            width={68}
            height={20}
            className="h-8 w-auto object-contain"
          />
        </Chip>

        <Chip label="PSE - Pagos Seguros en Línea" tight>
          <Image
            src="/payments/pse.png"
            alt="PSE - Pagos Seguros en Línea"
            width={78}
            height={22}
            className="h-8 w-auto object-contain"
          />
        </Chip>
      </div>
    </div>
  );
}
