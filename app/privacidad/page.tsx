import type { Metadata } from "next";
import Link from "next/link";

import { baseUrl } from "@/lib/utils";

const siteName = process.env.SITE_NAME || "SIE Merchandising Anime";
const controllerName = process.env.COMPANY_NAME || siteName;
const controllerAddress = process.env.PRIVACY_CONTROLLER_ADDRESS;
const controllerTaxId = process.env.PRIVACY_CONTROLLER_TAX_ID;
const privacyEmail = process.env.PRIVACY_EMAIL;
const lastUpdated = "25 de septiembre de 2026";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Información sobre el tratamiento de datos personales en SIE Merchandising Anime.",
  alternates: {
    canonical: `${baseUrl}/privacidad`,
  },
  openGraph: {
    title: "Política de privacidad | SIE Merchandising Anime",
    description:
      "Información sobre el tratamiento de datos personales en SIE Merchandising Anime.",
    url: `${baseUrl}/privacidad`,
    type: "article",
  },
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-slate max-w-none text-slate-700 prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-blue-700 prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-blue-600 dark:prose-invert">
      <header className="mb-10 border-b border-slate-200 pb-8 dark:border-slate-800">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
          Información legal
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl dark:text-white">
          Política de privacidad
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
          Esta política explica cómo tratamos tus datos personales cuando
          utilizas {siteName}.
        </p>
        <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
          Última actualización: {lastUpdated}
        </p>
      </header>

      <section aria-labelledby="responsable" className="scroll-mt-24">
        <h2
          id="responsable"
          className="text-2xl font-bold text-slate-950 dark:text-white"
        >
          1. Responsable del tratamiento
        </h2>
        <p>
          El responsable del tratamiento es <strong>{controllerName}</strong>.
          Puedes contactar con el responsable para cualquier cuestión
          relacionada con esta política o con el ejercicio de tus derechos
          mediante:
        </p>
        {privacyEmail ? (
          <p>
            Email: <a href={`mailto:${privacyEmail}`}>{privacyEmail}</a>
          </p>
        ) : (
          <p>
            Formulario de contacto:{" "}
            <Link href="/contacto">contactar con el ecommerce</Link>.
          </p>
        )}
        {controllerAddress || controllerTaxId ? (
          <dl className="not-prose mt-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm dark:border-slate-800 dark:bg-slate-900">
            {controllerAddress ? (
              <div>
                <dt className="font-semibold text-slate-900 dark:text-slate-100">
                  Dirección
                </dt>
                <dd className="mt-1 text-slate-600 dark:text-slate-300">
                  {controllerAddress}
                </dd>
              </div>
            ) : null}
            {controllerTaxId ? (
              <div>
                <dt className="font-semibold text-slate-900 dark:text-slate-100">
                  Identificación fiscal
                </dt>
                <dd className="mt-1 text-slate-600 dark:text-slate-300">
                  {controllerTaxId}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </section>

      <section aria-labelledby="datos" className="scroll-mt-24">
        <h2
          id="datos"
          className="text-2xl font-bold text-slate-950 dark:text-white"
        >
          2. Datos que tratamos
        </h2>
        <p>Podemos tratar los siguientes datos cuando utilizas el servicio:</p>
        <ul>
          <li>
            <strong>Datos de cuenta:</strong> nombre, dirección de correo
            electrónico y credenciales de acceso. La contraseña se gestiona
            mediante el proveedor de autenticación y no se almacena en esta
            aplicación.
          </li>
          <li>
            <strong>Datos de perfil:</strong> teléfono y dirección postal que
            puedes incorporar y guardar en tu cuenta.
          </li>
          <li>
            <strong>Datos de compra:</strong> productos, cantidades, importes,
            dirección de envío, método de pago, identificador de pago,
            seguimiento del pedido y notas cuando se contrata un pedido.
          </li>
          <li>
            <strong>Preferencias y carrito:</strong> productos guardados en tu
            wishlist, contenidos del carrito e identificadores de sesión.
          </li>
          <li>
            <strong>Datos técnicos:</strong> información necesaria para mantener
            la sesión, prevenir abuso y garantizar la seguridad del servicio.
          </li>
        </ul>
        <p>
          No solicitamos categorías especiales de datos personales. No incluyas
          información de salud, datos sexuales, credo, orientación sexual, datos
          biométricos ni información similar en los campos del servicio.
        </p>
      </section>

      <section aria-labelledby="finalidades" className="scroll-mt-24">
        <h2
          id="finalidades"
          className="text-2xl font-bold text-slate-950 dark:text-white"
        >
          3. Para qué y con qué base legal tratamos tus datos
        </h2>
        <ul>
          <li>
            <strong>
              Crear y gestionar tu cuenta, autenticar tus accesos y permitir el
              uso de la wishlist:
            </strong>{" "}
            ejecución del contrato o de medidas precontractuales cuando
            solicites esos servicios.
          </li>
          <li>
            <strong>
              Procesar pedidos, gestionar pagos, envíos y devoluciones:
            </strong>{" "}
            ejecución del contrato de compra y cumplimiento de obligaciones
            legales aplicables.
          </li>
          <li>
            <strong>
              Atender consultas, solicitudes y comunicaciones relacionadas con
              tu compra:
            </strong>{" "}
            ejecución del contrato, medidas precontractuales o interés legítimo
            en responder y gestionar la relación.
          </li>
          <li>
            <strong>
              Mantener la seguridad, prevenir fraude y proteger el servicio:
            </strong>{" "}
            interés legítimo en proteger la plataforma, prevenir usos indebidos
            y cumplir obligaciones de seguridad.
          </li>
          <li>
            <strong>
              Conservar las comunicaciones y los datos esenciales de la cuenta:
            </strong>{" "}
            interés legítimo y, cuando corresponda, cumplimiento de plazos
            legales de conservación.
          </li>
        </ul>
        <p>
          No utilizamos tus datos para comunicaciones comerciales salvo que
          exista una base legal aplicable y, cuando sea necesario, tu
          consentimiento. Esta versión del sitio no incorpora campañas de
          marketing ni publicidad personalizada.
        </p>
      </section>

      <section aria-labelledby="destinatarios" className="scroll-mt-24">
        <h2
          id="destinatarios"
          className="text-2xl font-bold text-slate-950 dark:text-white"
        >
          4. Destinatarios y proveedores
        </h2>
        <p>
          Podemos compartir datos con proveedores que nos ayudan a prestar el
          servicio, siempre bajo instrucciones y con medidas de protección
          adecuadas. Según las funcionalidades activadas, estos pueden incluir:
        </p>
        <ul>
          <li>
            Supabase, para autenticación, almacenamiento y gestión de la base de
            datos.
          </li>
          <li>
            El proveedor de hosting y despliegue utilizado para operar la web.
          </li>
          <li>
            Proveedores de correo, logística, pago y atención al cliente, cuando
            estén activos.
          </li>
        </ul>
        <p>
          No vendemos tus datos personales. La configuración definitiva de
          proveedores, sus países de almacenamiento y sus posibles subencargados
          debe documentarse antes de la publicación comercial.
        </p>
      </section>

      <section aria-labelledby="conservacion" className="scroll-mt-24">
        <h2
          id="conservacion"
          className="text-2xl font-bold text-slate-950 dark:text-white"
        >
          5. Conservación de tus datos
        </h2>
        <p>
          Conservamos los datos durante el tiempo necesario para cumplir las
          finalidades descritas y las obligaciones legales aplicables:
        </p>
        <ul>
          <li>
            Los datos de la cuenta mientras mantengas una cuenta activa y,
            después, durante el tiempo necesario para atender responsabilidades
            legales.
          </li>
          <li>
            Los datos de pedidos, facturación y envío durante los plazos legales
            y comerciales que resulten aplicables.
          </li>
          <li>
            Las comunicaciones de soporte durante el tiempo necesario para
            resolver la solicitud y defender o ejercer derechos.
          </li>
          <li>
            Los registros técnicos de seguridad durante un periodo limitado y
            proporcionado.
          </li>
          <li>
            Las cookies y tecnologías similares durante el tiempo necesario para
            su finalidad o hasta que retires tu consentimiento cuando sea
            necesario.
          </li>
        </ul>
        <p>
          Cuando ya no sean necesarios, los datos se eliminarán, anonimizarán o
          bloquearán de acuerdo con las obligaciones de conservación que
          resulten aplicables.
        </p>
      </section>

      <section aria-labelledby="cookies" className="scroll-mt-24">
        <h2
          id="cookies"
          className="text-2xl font-bold text-slate-950 dark:text-white"
        >
          6. Cookies y tecnologías similares
        </h2>
        <p>
          El sitio utiliza almacenamiento estrictamente necesario para ofrecer
          sus funcionalidades básicas. Según la interacción con la tienda, puede
          utilizar cookies de sesión de Supabase para mantener la autenticación
          y una cookie de carrito para conservar el identificador de la sesión
          de compra.
        </p>
        <p>
          La versión actual no incorpora herramientas de analítica, publicidad
          ni seguimiento publicitario. Si se incorporan tecnologías no
          esenciales, se actualizarán esta política y se solicitará el
          consentimiento previo correspondiente.
        </p>
        <p>
          Puedes consultar y eliminar las cookies desde la configuración de tu
          navegador. El bloqueo de cookies necesarias puede impedir que algunas
          áreas de la cuenta o del proceso de compra funcionen correctamente.
        </p>
      </section>

      <section aria-labelledby="seguridad" className="scroll-mt-24">
        <h2
          id="seguridad"
          className="text-2xl font-bold text-slate-950 dark:text-white"
        >
          7. Seguridad de la información
        </h2>
        <p>
          Aplicamos medidas técnicas y organizativas razonables para proteger
          tus datos frente a accesos no autorizados, pérdida, alteración o
          divulgación indebida. El acceso a las áreas privadas se protege
          mediante autenticación y el acceso a la base de datos debe estar
          protegido mediante Row Level Security y controles de permisos
          adecuados.
        </p>
        <p>
          Ningún sistema es completamente infalible. Si se produce una brecha de
          seguridad con un impacto relevante, adoptaremos las medidas necesarias
          y comunicaremos la incidencia cuando corresponda legalmente.
        </p>
      </section>

      <section aria-labelledby="derechos" className="scroll-mt-24">
        <h2
          id="derechos"
          className="text-2xl font-bold text-slate-950 dark:text-white"
        >
          8. Tus derechos
        </h2>
        <p>
          Puedes solicitar el acceso, la rectificación, la supresión, la
          limitación, la oposición o la portabilidad de tus datos personales.
          También puedes retirar un consentimiento que hayas concedido
          previamente, sin que ello afecte a la licitud del tratamiento
          realizado antes de esa retirada.
        </p>
        <p>
          Para ejercer tus derechos, utiliza el{" "}
          {privacyEmail ? (
            <a href={`mailto:${privacyEmail}`}>email de privacidad</a>
          ) : (
            <Link href="/contacto">formulario de contacto</Link>
          )}{" "}
          e indica tu solicitud. Podemos solicitar información adicional para
          verificar tu identidad y proteger tus datos.
        </p>
        <p>
          Si consideras que tus derechos no han sido atendidos, puedes presentar
          una reclamación ante la Agencia Española de Protección de Datos.
        </p>
      </section>

      <section aria-labelledby="menores" className="scroll-mt-24">
        <h2
          id="menores"
          className="text-2xl font-bold text-slate-950 dark:text-white"
        >
          9. Menores de edad
        </h2>
        <p>
          El sitio no está dirigido a menores de catorce años. Si crees que un
          menor nos ha proporcionado datos sin autorización, contacta con
          nosotros mediante los canales indicados en esta política para poder
          revisar y eliminar la información cuando corresponda.
        </p>
      </section>

      <section aria-labelledby="transferencias" className="scroll-mt-24">
        <h2
          id="transferencias"
          className="text-2xl font-bold text-slate-950 dark:text-white"
        >
          10. Transferencias internacionales
        </h2>
        <p>
          Algunos proveedores de infraestructura o servicios pueden tratar datos
          fuera del Espacio Económico Europeo. Cuando exista una transferencia
          internacional, se informará del destino y de las garantías aplicadas
          conforme a la normativa aplicable. Puedes solicitar información
          adicional sobre estas garantías contactando con el responsable.
        </p>
      </section>

      <section aria-labelledby="decisiones" className="scroll-mt-24">
        <h2
          id="decisiones"
          className="text-2xl font-bold text-slate-950 dark:text-white"
        >
          11. Decisiones automatizadas
        </h2>
        <p>
          La versión actual del ecommerce no utiliza decisiones automatizadas ni
          elaboración de perfiles que produzcan efectos jurídicos sobre ti. Si
          se incorporan estas funciones, se informará previamente y se
          actualizarán las bases legales y los derechos aplicables.
        </p>
      </section>

      <section aria-labelledby="cambios" className="scroll-mt-24">
        <h2
          id="cambios"
          className="text-2xl font-bold text-slate-950 dark:text-white"
        >
          12. Cambios en esta política
        </h2>
        <p>
          Podemos actualizar esta política para reflejar cambios legales, en el
          servicio o en los proveedores utilizados. La fecha de última
          actualización se mostrará al principio de esta página y procuraremos
          informar de forma visible cuando los cambios sean relevantes.
        </p>
      </section>
    </article>
  );
}
