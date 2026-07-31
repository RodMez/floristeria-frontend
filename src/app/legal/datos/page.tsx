import Link from "next/link";
import { ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { LegalSection, LegalToc } from "@/components/legal/LegalSections";

export const metadata = {
  title: "Política de Privacidad y Tratamiento de Datos Personales",
  description:
    "Política de Tratamiento de Datos Personales de TAO Boutique Floral conforme a la Ley 1581 de 2012 de Colombia.",
};

const contenido = [
  { id: "responsable-del-tratamiento", label: "Responsable del tratamiento" },
  { id: "marco-normativo", label: "Marco normativo" },
  { id: "datos-personales-recolectados", label: "Datos personales recolectados" },
  { id: "finalidades-del-tratamiento", label: "Finalidades del tratamiento" },
  { id: "encargados-del-tratamiento-y-terceros", label: "Encargados del tratamiento y terceros que reciben datos" },
  { id: "transferencia-internacional-de-datos", label: "Transferencia internacional de datos" },
  { id: "derechos-de-los-titulares", label: "Derechos de los Titulares" },
  { id: "procedimiento-para-ejercer-los-derechos", label: "Procedimiento para ejercer los derechos" },
  { id: "seguridad-de-la-informacion", label: "Seguridad de la información" },
  { id: "datos-de-terceros-beneficiarios", label: "Datos de terceros beneficiarios de un pedido" },
  { id: "mensajes-personalizados-y-confidencialidad", label: "Mensajes personalizados y confidencialidad" },
  { id: "cookies", label: "Cookies" },
  { id: "menores-de-edad", label: "Menores de edad" },
  { id: "vigencia", label: "Vigencia" },
  { id: "autoridad-de-control", label: "Autoridad de control" },
];

const EMAIL = "taoboutiquefloral@gmail.com";
const WHATSAPP = "https://wa.me/573126439938";

export default function PoliticaDatosPage() {
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
            Política de Privacidad y Tratamiento de Datos Personales
          </h1>
          <p className="mb-8 text-sm text-stone-500">
            TAO Boutique Floral — versión del documento:{" "}
            <code className="rounded bg-stone-100 px-2 py-0.5">v1.0</code>
          </p>

          <LegalToc items={contenido} />

          <div className="rounded-xl border-2 border-brand-rose bg-white/70 p-8 md:p-10">
            <div className="space-y-10">
              <LegalSection id="responsable-del-tratamiento" title="Responsable del tratamiento">
                <p className="leading-relaxed text-stone-700">
                  TAO Boutique Floral, persona natural identificada con NIT
                  1010193646-2, con domicilio en Sabaneta, Antioquia, Colombia,
                  es el responsable del Tratamiento de los datos personales
                  recolectados a través de la Plataforma.{" "}
                  <strong>Contacto:</strong>{" "}
                  <a
                    href={`mailto:${EMAIL}`}
                    className="font-medium text-brand-mustard hover:text-brand-mustard-dark transition-colors"
                  >
                    {EMAIL}
                  </a>{" "}
                  — WhatsApp{" "}
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

              <LegalSection id="marco-normativo" title="Marco normativo">
                <p className="leading-relaxed text-stone-700">
                  Esta Política se expide en cumplimiento de la{" "}
                  <strong>Ley 1581 de 2012</strong>, el{" "}
                  <strong>Decreto 1074 de 2015</strong> (que compiló el Decreto
                  1377 de 2013) y demás normas colombianas concordantes en
                  materia de protección de datos personales.
                </p>
              </LegalSection>

              <LegalSection id="datos-personales-recolectados" title="Datos personales recolectados">
                <ul className="list-disc space-y-2 pl-5 marker:text-brand-rose-dark">
                  <li className="leading-relaxed text-stone-700">
                    <strong>Datos de identificación y contacto:</strong> nombre,
                    correo electrónico, teléfono y contraseña (almacenada de
                    forma cifrada).
                  </li>
                  <li className="leading-relaxed text-stone-700">
                    <strong>Datos de entrega:</strong> direcciones registradas
                    (alias, dirección, ciudad, detalles adicionales, zona de
                    domicilio) y notas de entrega.
                  </li>
                  <li className="leading-relaxed text-stone-700">
                    <strong>Datos de terceros destinatarios</strong> de un
                    pedido, cuando el comprador los suministre, bajo los
                    términos de la sección{" "}
                    <Link
                      href="/legal/terminos#datos-de-terceros-pedidos-destinados-a-otra-persona"
                      className="font-medium text-brand-mustard hover:text-brand-mustard-dark transition-colors"
                    >
                      &ldquo;Datos de terceros&rdquo;
                    </Link>{" "}
                    de los Términos y Condiciones.
                  </li>
                  <li className="leading-relaxed text-stone-700">
                    <strong>Datos de la transacción:</strong> referencia de pago,
                    método de pago, estado e historial del pedido.
                  </li>
                  <li className="leading-relaxed text-stone-700">
                    <strong>Mensajes de dedicatoria</strong> o personalización
                    asociados a un pedido.
                  </li>
                  <li className="leading-relaxed text-stone-700">
                    <strong>Reseñas y calificaciones</strong> de productos.
                  </li>
                </ul>
                <p className="leading-relaxed text-stone-700">
                  TAO Boutique Floral no solicita de forma proactiva datos
                  sensibles (salud, orientación sexual, creencias religiosas o
                  políticas, datos biométricos, entre otros). Se recomienda al
                  Titular abstenerse de incluir este tipo de información en los
                  campos de texto libre, como los mensajes de dedicatoria.
                </p>
              </LegalSection>

              <LegalSection id="finalidades-del-tratamiento" title="Finalidades del tratamiento">
                <p className="leading-relaxed text-stone-700">
                  Los datos personales se utilizan para:
                </p>
                <ul className="list-disc space-y-2 pl-5 marker:text-brand-rose-dark">
                  <li className="leading-relaxed text-stone-700">
                    (i) gestionar el registro y la autenticación del usuario;
                  </li>
                  <li className="leading-relaxed text-stone-700">
                    (ii) procesar, confirmar y notificar pedidos;
                  </li>
                  <li className="leading-relaxed text-stone-700">
                    (iii) coordinar la entrega de los pedidos, incluyendo con
                    personal propio o con terceros de mensajería cuando aplique;
                  </li>
                  <li className="leading-relaxed text-stone-700">
                    (iv) procesar pagos a través de Wompi;
                  </li>
                  <li className="leading-relaxed text-stone-700">
                    (v) atender solicitudes, reclamos y garantías; y
                  </li>
                  <li className="leading-relaxed text-stone-700">
                    (vi) mejorar la Plataforma a partir de reseñas de productos.
                  </li>
                </ul>
                <p className="leading-relaxed text-stone-700">
                  Actualmente{" "}
                  <strong>no se envían comunicaciones comerciales o de marketing</strong>
                  . En caso de activarse este tipo de campañas en el futuro, se
                  solicitará al Titular una autorización expresa y separada antes
                  de incluirlo en dichos envíos.
                </p>
              </LegalSection>

              <LegalSection id="encargados-del-tratamiento-y-terceros" title="Encargados del tratamiento y terceros que reciben datos">
                <ul className="list-disc space-y-2 pl-5 marker:text-brand-rose-dark">
                  <li className="leading-relaxed text-stone-700">
                    <strong>Wompi (pasarela de pago):</strong> recibe los datos
                    necesarios para procesar la transacción, bajo sus propias
                    políticas de seguridad.
                  </li>
                  <li className="leading-relaxed text-stone-700">
                    <strong>
                      Brevo (proveedor de correo transaccional, con sede en
                      Francia):
                    </strong>{" "}
                    recibe nombre, correo y teléfono del cliente para el envío de
                    confirmaciones de pedido y, eventualmente y previa
                    autorización adicional, campañas de marketing.
                  </li>
                  <li className="leading-relaxed text-stone-700">
                    <strong>ImageKit:</strong> utilizado únicamente para alojar y
                    entregar imágenes de productos; no recibe datos personales de
                    clientes.
                  </li>
                </ul>
              </LegalSection>

              <LegalSection id="transferencia-internacional-de-datos" title="Transferencia internacional de datos">
                <p className="leading-relaxed text-stone-700">
                  La infraestructura tecnológica (servidor y base de datos) que
                  soporta la Plataforma se encuentra alojada en{" "}
                  <strong>Estados Unidos</strong>, y uno de los proveedores
                  tecnológicos (<strong>Brevo</strong>, para el envío de correos
                  transaccionales) tiene sede en <strong>Francia</strong>. De
                  acuerdo con el numeral 3.2 del Capítulo 3, Título V, de la
                  Circular Única de la Superintendencia de Industria y Comercio,
                  tanto Estados Unidos de América como Francia se encuentran
                  incluidos en el listado de países que garantizan un nivel
                  adecuado de protección de datos personales para efectos del
                  artículo 26 de la Ley 1581 de 2012.
                </p>
                <p className="leading-relaxed text-stone-700">
                  En consecuencia, la transferencia y/o transmisión internacional
                  de datos hacia estos países no requiere de las salvaguardas
                  adicionales previstas para países sin nivel adecuado (como las
                  Cláusulas Contractuales Modelo). No obstante, al aceptar esta
                  Política, el Titular es informado de dicha transferencia y
                  autoriza el tratamiento de sus datos para las finalidades aquí
                  descritas.
                </p>
              </LegalSection>

              <LegalSection id="derechos-de-los-titulares" title="Derechos de los Titulares">
                <p className="leading-relaxed text-stone-700">
                  El Titular de los datos personales tiene derecho a:
                </p>
                <ul className="list-disc space-y-2 pl-5 marker:text-brand-rose-dark">
                  <li className="leading-relaxed text-stone-700">
                    conocer, actualizar y rectificar sus datos;
                  </li>
                  <li className="leading-relaxed text-stone-700">
                    solicitar prueba de la autorización otorgada;
                  </li>
                  <li className="leading-relaxed text-stone-700">
                    ser informado del uso dado a sus datos;
                  </li>
                  <li className="leading-relaxed text-stone-700">
                    presentar quejas ante la SIC;
                  </li>
                  <li className="leading-relaxed text-stone-700">
                    revocar la autorización y/o solicitar la supresión de sus
                    datos cuando no exista un deber legal o contractual que lo
                    impida; y
                  </li>
                  <li className="leading-relaxed text-stone-700">
                    acceder de forma gratuita a sus datos personales.
                  </li>
                </ul>
              </LegalSection>

              <LegalSection id="procedimiento-para-ejercer-los-derechos" title="Procedimiento para ejercer los derechos">
                <p className="leading-relaxed text-stone-700">
                  Las solicitudes pueden radicarse al correo{" "}
                  <a
                    href={`mailto:${EMAIL}`}
                    className="font-medium text-brand-mustard hover:text-brand-mustard-dark transition-colors"
                  >
                    {EMAIL}
                  </a>
                  , indicando nombre completo, documento de identidad y una
                  descripción clara de la solicitud. TAO Boutique Floral dará
                  respuesta dentro de los plazos legales:
                </p>
                <ul className="list-disc space-y-2 pl-5 marker:text-brand-rose-dark">
                  <li className="leading-relaxed text-stone-700">
                    Las <strong>consultas</strong> serán atendidas dentro de los
                    diez (10) días hábiles siguientes a su recibo, prorrogables
                    por cinco (5) días hábiles adicionales cuando no sea posible
                    atenderlas en dicho plazo, conforme al artículo 14 de la Ley
                    1581 de 2012.
                  </li>
                  <li className="leading-relaxed text-stone-700">
                    Los <strong>reclamos</strong> serán atendidos dentro de los
                    quince (15) días hábiles siguientes a su recibo, prorrogables
                    por ocho (8) días hábiles adicionales, conforme al artículo 15
                    de la Ley 1581 de 2012.
                  </li>
                </ul>
              </LegalSection>

              <LegalSection id="seguridad-de-la-informacion" title="Seguridad de la información">
                <p className="leading-relaxed text-stone-700">
                  TAO Boutique Floral implementa medidas técnicas y
                  administrativas razonables para proteger los datos personales
                  frente a acceso no autorizado, pérdida, alteración o uso
                  indebido, tales como el almacenamiento cifrado de contraseñas y
                  el uso de conexiones seguras.
                </p>
              </LegalSection>

              <LegalSection id="datos-de-terceros-beneficiarios" title="Datos de terceros beneficiarios de un pedido">
                <p className="leading-relaxed text-stone-700">
                  Cuando el Titular ingrese datos de un tercero como destinatario
                  de un pedido, dichos datos se tratarán exclusivamente para
                  coordinar la entrega, conforme a la sección{" "}
                  <Link
                    href="/legal/terminos#datos-de-terceros-pedidos-destinados-a-otra-persona"
                    className="font-medium text-brand-mustard hover:text-brand-mustard-dark transition-colors"
                  >
                    &ldquo;Datos de terceros&rdquo;
                  </Link>{" "}
                  de los Términos y Condiciones.
                </p>
              </LegalSection>

              <LegalSection id="mensajes-personalizados-y-confidencialidad" title="Mensajes personalizados y confidencialidad">
                <p className="leading-relaxed text-stone-700">
                  Los mensajes de dedicatoria ingresados para acompañar un pedido
                  se tratan de forma <strong>confidencial</strong>: solo son
                  visibles para el personal de la sede encargado de la
                  preparación y entrega del pedido, no se utilizan para ninguna
                  otra finalidad, y se conservan únicamente durante el tiempo
                  necesario para el cumplimiento del pedido y las obligaciones
                  legales de conservación de información transaccional.
                </p>
              </LegalSection>

              <LegalSection id="cookies" title="Cookies">
                <p className="leading-relaxed text-stone-700">
                  La Plataforma utiliza únicamente una{" "}
                  <strong>cookie técnica de sesión</strong>, necesaria para
                  mantener la autenticación del usuario mientras navega. Esta
                  cookie{" "}
                  <strong>
                    no se utiliza con fines publicitarios, de rastreo o de
                    análisis de comportamiento
                  </strong>
                  , ni se comparte con terceros de publicidad. Actualmente no se
                  utilizan herramientas de analítica como Google Analytics o Meta
                  Pixel.
                </p>
              </LegalSection>

              <LegalSection id="menores-de-edad" title="Menores de edad">
                <p className="leading-relaxed text-stone-700">
                  La Plataforma está dirigida exclusivamente a{" "}
                  <strong>personas mayores de 18 años</strong>. TAO Boutique
                  Floral no recolecta intencionalmente datos personales de
                  menores de edad.
                </p>
              </LegalSection>

              <LegalSection id="vigencia" title="Vigencia">
                <p className="leading-relaxed text-stone-700">
                  Esta Política rige desde su fecha de publicación y permanecerá
                  vigente mientras subsista la base de datos, sujeta a las
                  modificaciones que sean publicadas oportunamente en la
                  Plataforma.
                </p>
              </LegalSection>

              <LegalSection id="autoridad-de-control" title="Autoridad de control">
                <p className="leading-relaxed text-stone-700">
                  <strong>Superintendencia de Industria y Comercio (SIC)</strong>{" "}
                  —{" "}
                  <a
                    href="https://www.sic.gov.co"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-brand-mustard hover:text-brand-mustard-dark transition-colors"
                  >
                    www.sic.gov.co
                  </a>
                  .
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
