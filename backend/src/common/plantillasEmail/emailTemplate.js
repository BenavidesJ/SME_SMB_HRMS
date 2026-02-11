import dayjs from "dayjs";

// ─── Color themes ────────────────────────────────────────────────────────────
const THEMES = {
  info:    { header: "#105CC7", accent: "#105CC7" },
  success: { header: "#319E3F", accent: "#319E3F" },
  warning: { header: "#C98A00", accent: "#C98A00" },
  danger:  { header: "#C0392B", accent: "#C0392B" },
};

const FONT_STACK = "Inter, -apple-system, 'system-ui', 'Segoe UI', Arial, Helvetica, sans-serif";

// ─── Base template ───────────────────────────────────────────────────────────
/**
 * Plantilla base reutilizable para todos los correos electrónicos de BioAlquimia.
 * El logo se embebe como adjunto CID desde mail.js (cid:bioalquimia-logo).
 *
 * @param {Object} params
 * @param {string} params.titulo - Título principal del correo (aparece en el header).
 * @param {"info"|"success"|"warning"|"danger"} [params.variante="info"] - Tema de color.
 * @param {string} params.contenido - HTML del cuerpo del correo.
 * @param {{ texto: string, url: string }} [params.cta] - Botón call-to-action opcional.
 * @param {string} [params.pie] - Texto del footer.
 * @returns {string} HTML completo listo para enviar.
 */
function baseEmailTemplate({
  titulo,
  variante = "info",
  contenido,
  cta,
  pie = "Este es un mensaje automático, por favor no respondas a este correo.",
}) {
  const theme = THEMES[variante] ?? THEMES.info;

  const ctaHtml = cta?.url
    ? `
      <div style="margin:24px 0; text-align:center;">
        <a href="${cta.url}"
           style="display:inline-block; background:${theme.accent}; color:#FFFFFF;
                  text-decoration:none; padding:12px 24px; border-radius:8px;
                  font-weight:bold; font-size:14px; font-family:${FONT_STACK};">
          ${cta.texto ?? "Ver en el sistema"}
        </a>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${titulo}</title>
</head>
<body style="margin:0; padding:0; font-family:${FONT_STACK}; color:#1a1a1a; background-color:#ffffff;">

  <!-- Outer wrapper -->
  <table align="center" cellpadding="0" cellspacing="0" width="100%"
         style="max-width:600px; margin:32px auto; background-color:#ffffff;
                border-radius:12px; border:1px solid #e5e7eb; overflow:hidden;">

    <!-- Logo row -->
    <tr>
      <td style="padding:28px 30px 16px; text-align:center;">
        <img src="cid:bioalquimia-logo"
             alt="BioAlquimia" width="54" height="54"
             style="display:inline-block; vertical-align:middle;"/>
        <span style="display:inline-block; vertical-align:middle; margin-left:10px;
                     font-size:20px; font-weight:bold; color:#1a1a1a; font-family:${FONT_STACK};">
          <span style="color:#57E868;">Bio</span><span style="color:#105CC7;">Alquimia</span>
        </span>
      </td>
    </tr>

    <!-- Header -->
    <tr>
      <td style="background-color:${theme.header}; padding:18px 30px; text-align:center;">
        <h1 style="color:#ffffff; font-size:20px; margin:0; font-weight:600; font-family:${FONT_STACK};">
          ${titulo}
        </h1>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:28px 30px; font-family:${FONT_STACK}; color:#1a1a1a;">
        ${contenido}
        ${ctaHtml}
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color:#f9fafb; padding:16px 30px; text-align:center;
                 font-size:12px; color:#6b7280; border-top:1px solid #e5e7eb; font-family:${FONT_STACK};">
        &copy; ${dayjs().year()} BioAlquimia S.A. &mdash; Sistema de Gesti&oacute;n de Recursos Humanos<br/>
        <span style="color:#9ca3af;">${pie}</span>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ─── Detail table helper ─────────────────────────────────────────────────────
/**
 * Genera una tabla de detalles con filas etiqueta-valor.
 *
 * @param {Array<{ etiqueta: string, valor: string }>} detalles
 * @returns {string} HTML de la tabla.
 */
function buildDetailsTable(detalles) {
  const filas = (detalles ?? [])
    .filter((d) => d && String(d.etiqueta ?? "").trim() !== "")
    .map(
      (d) => `
        <tr>
          <td style="background-color:#f9fafb; padding:12px 16px; font-weight:bold;
                     width:38%; color:#374151; border-bottom:1px solid #e5e7eb; font-family:${FONT_STACK};">
            ${String(d.etiqueta ?? "")}
          </td>
          <td style="padding:12px 16px; color:#105CC7; border-bottom:1px solid #e5e7eb; font-family:${FONT_STACK};">
            ${String(d.valor ?? "")}
          </td>
        </tr>`,
    )
    .join("");

  if (!filas) return "";

  return `
    <table cellpadding="0" cellspacing="0" width="100%"
           style="margin:20px 0; border:1px solid #e5e7eb; border-radius:8px;
                  border-collapse:separate; overflow:hidden;">
      ${filas}
    </table>`;
}

// ─── Specific templates ──────────────────────────────────────────────────────

/**
 * Email de bienvenida para nuevos colaboradores.
 *
 * @param {Object} params
 * @param {string} params.nombre
 * @param {string} params.primer_apellido
 * @param {string} params.segundo_apellido
 * @param {string} params.username
 * @param {string} params.temporalPass
 * @returns {string}
 */
export const plantillaEmailBienvenida = ({
  nombre,
  primer_apellido,
  segundo_apellido,
  username,
  temporalPass,
}) =>
  baseEmailTemplate({
    titulo: "¡Bienvenido al equipo!",
    variante: "success",
    contenido: `
      <p style="font-size:16px; line-height:1.6; margin:0 0 16px;">
        Hola <strong>${nombre} ${primer_apellido} ${segundo_apellido}</strong>,
      </p>
      <p style="font-size:15px; line-height:1.6; margin:0 0 8px;">
        ¡Nos alegra darte la bienvenida a <strong>BioAlquimia</strong>!
        Ya puedes acceder al sistema con las siguientes credenciales:
      </p>
      ${buildDetailsTable([
        { etiqueta: "Usuario", valor: username },
        { etiqueta: "Contraseña temporal", valor: temporalPass },
      ])}
      <p style="font-size:15px; line-height:1.6; margin:16px 0 0;">
        Por razones de seguridad, te recomendamos <strong>cambiar tu contraseña al ingresar por primera vez</strong>.
      </p>
      <p style="font-size:14px; color:#666; margin:12px 0 0;">
        Si tienes algún problema con el acceso, por favor contacta al departamento de Recursos Humanos.
      </p>`,
  });

/**
 * Email para envío de contraseña temporal (reset).
 *
 * @param {Object} params
 * @param {string} params.nombre
 * @param {string} params.primer_apellido
 * @param {string} params.segundo_apellido
 * @param {string} params.username
 * @param {string} params.temporalPass
 * @returns {string}
 */
export const plantillaEmailResetContrasena = ({
  nombre,
  primer_apellido,
  segundo_apellido,
  username,
  temporalPass,
}) =>
  baseEmailTemplate({
    titulo: "Contraseña temporal",
    variante: "warning",
    contenido: `
      <p style="font-size:16px; line-height:1.6; margin:0 0 16px;">
        Hola <strong>${nombre} ${primer_apellido} ${segundo_apellido}</strong>,
      </p>
      <p style="font-size:15px; line-height:1.6; margin:0 0 8px;">
        Ya puedes acceder al sistema con las siguientes credenciales:
      </p>
      ${buildDetailsTable([
        { etiqueta: "Usuario", valor: username },
        { etiqueta: "Contraseña temporal", valor: temporalPass },
      ])}
      <p style="font-size:15px; line-height:1.6; margin:16px 0 0;">
        Por razones de seguridad, te recomendamos <strong>cambiar tu contraseña al ingresar al sistema</strong>.
      </p>
      <p style="font-size:14px; color:#666; margin:12px 0 0;">
        Si tienes algún problema con el acceso, por favor contacta al departamento de Recursos Humanos.
      </p>`,
  });

/**
 * Email de solicitud de horas extra (enviado al aprobador).
 *
 * @param {Object} params
 * @param {string} params.solicitanteNombre
 * @param {string} params.fechaTrabajo
 * @param {string} params.horasSolicitadas
 * @returns {string}
 */
export const plantillaSolicitudHorasExtra = ({
  solicitanteNombre,
  fechaTrabajo,
  horasSolicitadas,
}) =>
  baseEmailTemplate({
    titulo: "Nueva solicitud de Horas Extra",
    variante: "info",
    contenido: `
      <p style="font-size:16px; line-height:1.6; margin:0 0 16px;">
        Se ha registrado una <strong>nueva solicitud de horas extra</strong> que requiere revisión.
      </p>
      ${buildDetailsTable([
        { etiqueta: "Colaborador", valor: solicitanteNombre },
        { etiqueta: "Fecha de trabajo", valor: fechaTrabajo },
        { etiqueta: "Horas solicitadas", valor: horasSolicitadas },
      ])}
      <p style="font-size:15px; line-height:1.6; margin:16px 0 0;">
        Ingrese al sistema para <strong>aprobar o rechazar</strong> la solicitud.
      </p>`,
  });

/**
 * Email de solicitud de permisos (enviado al aprobador).
 *
 * @param {Object} params
 * @param {string} params.solicitanteNombre
 * @param {string} params.fechaInicio
 * @param {string} params.fechaFin
 * @param {string} params.tipo
 * @param {string} params.cantidadDias
 * @param {string} params.cantidadHoras
 * @returns {string}
 */
export const plantillaSolicitudPermisos = ({
  solicitanteNombre,
  fechaInicio,
  fechaFin,
  tipo,
  cantidadDias,
  cantidadHoras,
}) =>
  baseEmailTemplate({
    titulo: "Nueva solicitud de permisos",
    variante: "info",
    contenido: `
      <p style="font-size:16px; line-height:1.6; margin:0 0 16px;">
        Se ha registrado una <strong>nueva solicitud de permiso</strong> ${tipo} que requiere revisión.
      </p>
      ${buildDetailsTable([
        { etiqueta: "Colaborador", valor: solicitanteNombre },
        { etiqueta: "Fecha de inicio", valor: fechaInicio },
        { etiqueta: "Fecha de finalización", valor: fechaFin },
        { etiqueta: "Cantidad de días", valor: cantidadDias },
        { etiqueta: "Cantidad de horas", valor: cantidadHoras },
      ])}
      <p style="font-size:15px; line-height:1.6; margin:16px 0 0;">
        Ingrese al sistema para <strong>aprobar o rechazar</strong> la solicitud.
      </p>`,
  });

/**
 * Email de solicitud de vacaciones (enviado al aprobador).
 *
 * @param {Object} params
 * @param {string} params.solicitanteNombre
 * @param {string} params.fechaInicio
 * @param {string} params.fechaFin
 * @param {string} params.diasSolicitados
 * @returns {string}
 */
export const plantillaSolicitudVacaciones = ({
  solicitanteNombre,
  fechaInicio,
  fechaFin,
  diasSolicitados,
}) =>
  baseEmailTemplate({
    titulo: "Nueva solicitud de vacaciones",
    variante: "info",
    contenido: `
      <p style="font-size:16px; line-height:1.6; margin:0 0 16px;">
        Se ha registrado una <strong>nueva solicitud de vacaciones</strong> que requiere revisión.
      </p>
      ${buildDetailsTable([
        { etiqueta: "Colaborador", valor: solicitanteNombre },
        { etiqueta: "Fecha de inicio", valor: fechaInicio },
        { etiqueta: "Fecha de finalización", valor: fechaFin },
        { etiqueta: "Días solicitados", valor: diasSolicitados },
      ])}
      <p style="font-size:15px; line-height:1.6; margin:16px 0 0;">
        Ingrese al sistema para <strong>aprobar o rechazar</strong> la solicitud.
      </p>`,
  });

/**
 * Email genérico de notificación sobre solicitudes (aprobado/rechazado/info).
 * Reemplaza a plantillaNotificacionSolicitud y a los mensajes plain-text.
 *
 * @param {Object} params
 * @param {string} params.titulo - Título del correo.
 * @param {"info"|"success"|"warning"|"danger"} [params.variante="info"]
 * @param {string} params.subtitulo - Línea principal del mensaje.
 * @param {string} [params.mensaje] - Mensaje adicional.
 * @param {Array<{ etiqueta: string, valor: string }>} [params.detalles=[]]
 * @param {{ texto: string, url: string }} [params.cta] - Botón CTA.
 * @param {string} [params.pie] - Footer.
 * @returns {string}
 */
export const plantillaNotificacionSolicitud = ({
  titulo,
  variante = "info",
  subtitulo,
  mensaje = "",
  detalles = [],
  cta,
  pie,
}) =>
  baseEmailTemplate({
    titulo,
    variante,
    cta,
    pie,
    contenido: `
      <p style="font-size:16px; line-height:1.6; margin:0 0 12px;">
        ${subtitulo}
      </p>
      ${mensaje ? `<p style="font-size:15px; line-height:1.6; margin:0 0 8px;">${mensaje}</p>` : ""}
      ${buildDetailsTable(detalles)}`,
  });
