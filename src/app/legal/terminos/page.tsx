import Link from "next/link";
import { ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { LegalSection, LegalToc } from "@/components/legal/LegalSections";

export const metadata = {
  title: "Términos y Condiciones",
  description:
    "Términos y Condiciones de uso del sitio TAO Boutique Floral conforme al Estatuto del Consumidor colombiano (Ley 1480 de 2011).",
};

const contenido = [
  { id: "identificacion-del-prestador-de-servicios", label: "Identificación del prestador de servicios" },
  { id: "objeto-y-aceptacion", label: "Objeto y aceptación" },
  { id: "capacidad-y-edad-minima", label: "Capacidad y edad mínima" },
  { id: "registro-de-usuario", label: "Registro de usuario" },
  { id: "productos-imagenes-y-disponibilidad", label: "Productos, imágenes y disponibilidad" },
  { id: "personalizacion-de-pedidos", label: "Personalización de pedidos" },
  { id: "precios-y-medios-de-pago", label: "Precios y medios de pago" },
  { id: "cobertura-zonas-y-franjas-de-entrega", label: "Cobertura, zonas y franjas de entrega" },
  { id: "derecho-de-retracto", label: "Derecho de retracto" },
  { id: "garantia-legal-y-devoluciones", label: "Garantía legal y devoluciones" },
  { id: "reversion-de-pagos", label: "Reversión de pagos" },
  { id: "datos-de-terceros-pedidos-destinados-a-otra-persona", label: "Datos de terceros — pedidos destinados a otra persona" },
  { id: "propiedad-intelectual", label: "Propiedad intelectual" },
  { id: "limitacion-de-responsabilidad", label: "Limitación de responsabilidad" },
  { id: "modificaciones", label: "Modificaciones" },
  { id: "ley-aplicable-y-resolucion-de-conflictos", label: "Ley aplicable y resolución de conflictos" },
];

const EMAIL = "taoboutiquefloral@gmail.com";
const WHATSAPP = "https://wa.me/573126439938";

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[var(--color-brand-rose-light)]/30">
      <section className="py-16">
        <div className="container mx-auto max-w-3xl px-4">
          <Link
            href="/tienda"
            className="mb-6 inline-flex items-center gap-1 font-medium text-brand-mustard transition-colors hover:text-brand-mustard-dark"
          >
            <ChevronLeft className="size-4" /> Volver a la tienda
          </Link>
          <h1 className="mb-2 text-3xl font-bold text-stone-800 md:text-4xl">
            Términos y Condiciones de Uso
          </h1>
          <p className="mb-8 text-sm text-stone-500">
            TAO Boutique Floral — versión del documento:{" "}
            <code className="rounded bg-stone-100 px-2 py-0.5">v1.0</code>
          </p>

          <LegalToc items={contenido} />

          <div className="rounded-xl border-2 border-brand-rose bg-white/70 p-8 md:p-10">
            <div className="space-y-10">
              <LegalSection id="identificacion-del-prestador-de-servicios" title="Identificación del prestador de servicios">
                <p className="leading-relaxed text-stone-700">
                  El presente sitio web es operado por{" "}
                  <strong>TAO Boutique Floral</strong>, persona natural
                  identificada con NIT 1010193646-2, con domicilio en Sabaneta,
                  Antioquia, Colombia. <strong>Canal oficial de contacto</strong>{" "}
                  para atención al cliente y notificaciones legales: correo
                  electrónico{" "}
                  <a
                    href={`mailto:${EMAIL}`}
                    className="font-medium text-brand-mustard hover:text-brand-mustard-dark transition-colors"
                  >
                    {EMAIL}
                  </a>{" "}
                  y WhatsApp{" "}
                  <a
                    href={WHATSAPP}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand-mustard hover:text-brand-mustard-dark transition-colors"
                  >
                    +57 312 6439938
                  </a>
                  .
                </p>
              </LegalSection>

              <LegalSection id="objeto-y-aceptacion" title="Objeto y aceptación">
                <p className="leading-relaxed text-stone-700">
                  Estos Términos y Condiciones regulan el acceso, uso y las
                  compras realizadas a través de la plataforma de comercio
                  electrónico de TAO Boutique Floral (en adelante,
                  &ldquo;la Plataforma&rdquo;), disponible en{" "}
                  <a
                    href="https://taoboutiquefloral.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand-mustard hover:text-brand-mustard-dark transition-colors"
                  >
                    taoboutiquefloral.com
                  </a>
                  . La creación de una cuenta o la realización de una compra
                  implica la{" "}
                  <strong>aceptación íntegra y sin reservas</strong> de estos
                  Términos.
                </p>
              </LegalSection>

              <LegalSection id="capacidad-y-edad-minima" title="Capacidad y edad mínima">
                <p className="leading-relaxed text-stone-700">
                  La Plataforma está dirigida exclusivamente a{" "}
                  <strong>personas mayores de edad</strong>. Al registrarse, el
                  usuario declara bajo la gravedad de juramento ser mayor de 18
                  años.
                </p>
              </LegalSection>

              <LegalSection id="registro-de-usuario" title="Registro de usuario">
                <p className="leading-relaxed text-stone-700">
                  La compra de productos requiere la creación previa de una
                  cuenta de usuario; la Plataforma{" "}
                  <strong>no ofrece la modalidad de compra como invitado</strong>
                  . El usuario es responsable de la veracidad de los datos
                  suministrados y de mantener la confidencialidad de sus
                  credenciales de acceso.
                </p>
              </LegalSection>

              <LegalSection id="productos-imagenes-y-disponibilidad" title="Productos, imágenes y disponibilidad">
                <p className="leading-relaxed text-stone-700">
                  Las imágenes de los productos publicados en la Plataforma son
                  de <strong>carácter ilustrativo</strong>. Dado que los arreglos
                  florales son productos artesanales y elaborados con flores
                  naturales de disponibilidad estacional, el producto final
                  entregado puede presentar <strong>variaciones razonables</strong>{" "}
                  respecto a la imagen de referencia.
                </p>
                <p className="leading-relaxed text-stone-700">
                  En caso de no disponibilidad de una flor o insumo específico al
                  momento de preparar el pedido, TAO Boutique Floral podrá{" "}
                  <strong>
                    sustituirlo por uno de características similares y de igual o
                    mayor valor
                  </strong>
                  , notificando previamente al cliente sobre dicha sustitución.
                </p>
              </LegalSection>

              <LegalSection id="personalizacion-de-pedidos" title="Personalización de pedidos">
                <p className="leading-relaxed text-stone-700">
                  La Plataforma{" "}
                  <strong>
                    no ofrece actualmente un flujo de diseño de arreglos a medida
                  </strong>{" "}
                  dentro del proceso de compra en línea. Los clientes interesados
                  en solicitar personalizaciones pueden contactar directamente a
                  la sede correspondiente a través del{" "}
                  <strong>botón de WhatsApp</strong> habilitado en el sitio,
                  acordando alcance, precio y disponibilidad de forma directa con
                  el equipo administrativo.
                </p>
                <p className="leading-relaxed text-stone-700">
                  Los mensajes de dedicatoria que el cliente incluya para
                  acompañar un pedido se tratan de forma{" "}
                  <strong>confidencial</strong>, conforme a lo dispuesto en la{" "}
                  <Link
                    href="/legal/datos"
                    className="font-medium text-brand-mustard hover:text-brand-mustard-dark transition-colors"
                  >
                    Política de Privacidad
                  </Link>
                  .
                </p>
              </LegalSection>

              <LegalSection id="precios-y-medios-de-pago" title="Precios y medios de pago">
                <p className="leading-relaxed text-stone-700">
                  Los precios publicados en la Plataforma están expresados en{" "}
                  <strong>pesos colombianos (COP)</strong> e incluyen los
                  impuestos aplicables conforme a la legislación vigente. El pago
                  se procesa a través de la pasarela <strong>Wompi</strong>,
                  mediante los medios de pago que esta habilite (tarjetas de
                  crédito, débito y demás disponibles). El procesamiento del pago
                  está sujeto adicionalmente a los términos y políticas de
                  seguridad de Wompi.
                </p>
              </LegalSection>

              <LegalSection id="cobertura-zonas-y-franjas-de-entrega" title="Cobertura, zonas y franjas de entrega">
                <p className="leading-relaxed text-stone-700">
                  La cobertura de entrega actual se concentra en el{" "}
                  <strong>Valle de Aburrá</strong>, con expansión planeada a
                  Bogotá. Las zonas específicas de cobertura y sus costos
                  asociados son administrados y actualizados directamente por
                  cada sede a través de un sistema de zonas configurables; el
                  costo de envío correspondiente se calcula automáticamente según
                  la zona seleccionada al momento de la compra.
                </p>
                <p className="leading-relaxed text-stone-700">
                  El <strong>horario de entrega</strong> es de{" "}
                  <strong>7:00 a.m. a 4:00 p.m.</strong> Los pedidos realizados
                  en horas de la mañana se entregan en la tarde del mismo día; los
                  pedidos realizados a partir de las 4:00 p.m. quedan programados
                  para el día hábil siguiente.
                </p>
                <p className="leading-relaxed text-stone-700">
                  Las entregas son realizadas principalmente por{" "}
                  <strong>personal propio</strong> de TAO Boutique Floral. En
                  picos de demanda, la entrega podrá coordinarse a través de
                  plataformas de mensajería de terceros, como Didi.
                </p>
              </LegalSection>

              <LegalSection id="derecho-de-retracto" title="Derecho de retracto">
                <p className="leading-relaxed text-stone-700">
                  De conformidad con el{" "}
                  <strong>
                    artículo 47 de la Ley 1480 de 2011 (Estatuto del Consumidor)
                  </strong>
                  , el derecho de retracto no aplica a bienes perecederos o que
                  por su naturaleza no puedan ser devueltos. Dado que los
                  productos ofrecidos por TAO Boutique Floral son flores y
                  arreglos florales de carácter perecedero, las compras
                  realizadas en la Plataforma{" "}
                  <strong>no están sujetas al derecho de retracto</strong>.
                </p>
              </LegalSection>

              <LegalSection id="garantia-legal-y-devoluciones" title="Garantía legal y devoluciones">
                <p className="leading-relaxed text-stone-700">
                  Sin perjuicio de lo anterior, aplica la{" "}
                  <strong>garantía legal de calidad e idoneidad</strong> prevista
                  en la Ley 1480 de 2011. Si el pedido llega en mal estado,
                  incompleto o no corresponde a lo solicitado, el cliente puede
                  reportarlo dentro de las{" "}
                  <strong>2 horas siguientes a la entrega</strong>, contactando a
                  TAO Boutique Floral a través de los canales oficiales, para su
                  reposición o el reembolso que corresponda.
                </p>
              </LegalSection>

              <LegalSection id="reversion-de-pagos" title="Reversión de pagos">
                <p className="leading-relaxed text-stone-700">
                  Wompi cuenta con mecanismos propios para tramitar reversiones de
                  pago en casos como fraude o producto no recibido, conforme al{" "}
                  <strong>Decreto 587 de 2016</strong>. Las solicitudes de
                  reversión se tramitan de acuerdo con las políticas, plazos y
                  condiciones establecidos directamente por Wompi.
                </p>
              </LegalSection>

              <LegalSection id="datos-de-terceros-pedidos-destinados-a-otra-persona" title="Datos de terceros — pedidos destinados a otra persona">
                <p className="leading-relaxed text-stone-700">
                  Cuando el comprador ingrese en la Plataforma datos de una
                  persona distinta a él (nombre, dirección, teléfono) como
                  destinatario de un pedido, declara y garantiza{" "}
                  <strong>contar con la autorización de dicha persona</strong>{" "}
                  para suministrar sus datos, los cuales serán usados por TAO
                  Boutique Floral exclusivamente para coordinar la entrega,
                  conforme a la{" "}
                  <Link
                    href="/legal/datos"
                    className="font-medium text-brand-mustard hover:text-brand-mustard-dark transition-colors"
                  >
                    Política de Privacidad
                  </Link>
                  .
                </p>
              </LegalSection>

              <LegalSection id="propiedad-intelectual" title="Propiedad intelectual">
                <p className="leading-relaxed text-stone-700">
                  La marca, el logotipo, los contenidos, las fotografías y el
                  diseño de la Plataforma son{" "}
                  <strong>propiedad de TAO Boutique Floral</strong> o de sus
                  licenciantes. Queda prohibido su uso, reproducción o
                  distribución no autorizada.
                </p>
              </LegalSection>

              <LegalSection id="limitacion-de-responsabilidad" title="Limitación de responsabilidad">
                <p className="leading-relaxed text-stone-700">
                  TAO Boutique Floral no será responsable por retrasos o
                  incumplimientos derivados de causas de <strong>fuerza mayor</strong>,
                  caso fortuito, hechos de terceros (incluidos los servicios de
                  mensajería) o de información incorrecta o incompleta
                  suministrada por el cliente al momento de la compra.
                </p>
              </LegalSection>

              <LegalSection id="modificaciones" title="Modificaciones">
                <p className="leading-relaxed text-stone-700">
                  TAO Boutique Floral podrá modificar estos Términos y
                  Condiciones en cualquier momento. Los cambios se publicarán en
                  esta misma página junto con su fecha de actualización.
                </p>
              </LegalSection>

              <LegalSection id="ley-aplicable-y-resolucion-de-conflictos" title="Ley aplicable y resolución de conflictos">
                <p className="leading-relaxed text-stone-700">
                  Estos Términos y Condiciones se rigen e interpretan bajo las
                  leyes de la <strong>República de Colombia</strong>. Ante
                  cualquier inconformidad, petición, queja o reclamo (PQR), el
                  usuario se compromete a realizar una{" "}
                  <strong>reclamación directa previa</strong> escribiendo al
                  correo electrónico{" "}
                  <a
                    href={`mailto:${EMAIL}`}
                    className="font-medium text-brand-mustard hover:text-brand-mustard-dark transition-colors"
                  >
                    {EMAIL}
                  </a>{" "}
                  para buscar una solución de mutuo acuerdo. En caso de no llegar
                  a una solución en los términos legales, el consumidor podrá
                  acudir ante la{" "}
                  <strong>
                    Superintendencia de Industria y Comercio (SIC)
                  </strong>{" "}
                  o ante la jurisdicción ordinaria civil, conforme a lo
                  establecido en el Estatuto del Consumidor (Ley 1480 de 2011).
                </p>
              </LegalSection>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/tienda"
              className="inline-flex items-center gap-1 font-medium text-brand-mustard transition-colors hover:text-brand-mustard-dark"
            >
              Volver a la tienda <ChevronRight className="size-4" />
            </Link>
            <a
              href="#"
              className="inline-flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-brand-mustard-dark"
            >
              <ArrowUp className="size-4" /> Volver al inicio
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
