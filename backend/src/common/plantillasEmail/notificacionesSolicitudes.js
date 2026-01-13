import dayjs from "dayjs";

/**
 * Plantilla HTML para notificaciones de solicitudes.
 *
 * @param {Object} params
 * @param {string} params.titulo - Título del correo
 * @param {"info"|"success"|"warning"|"danger"} [params.variante="info"] 
 * @param {string} params.subtitulo - Subtitulo
 * @param {string} [params.mensaje] - Mensaje adicional
 * @param {Array<{ etiqueta: string, valor: string }>} [params.detalles=[]]
 * @param {{ texto: string, url: string }} [params.cta] - Botón para redireccion
 * @param {string} [params.pie] - Footer
 * @returns {string}
 */
export const plantillaNotificacionSolicitud = ({
  titulo,
  variante = "info",
  subtitulo,
  mensaje = "",
  detalles = [],
  cta,
  pie = "Este es un mensaje automático, por favor no respondas a este correo.",
}) => {
  const colores = {
    info: { header: "#105CC7", badge: "#105CC7" },
    success: { header: "#319E3F", badge: "#319E3F" },
    warning: { header: "#C98A00", badge: "#C98A00" },
    danger: { header: "#C0392B", badge: "#C0392B" },
  };

  const theme = colores[variante] ?? colores.info;

  const filas = (detalles ?? [])
    .filter((d) => d && String(d.etiqueta ?? "").trim() !== "")
    .map(
      (d) => `
      <tr>
        <td style="background-color:#C5C5C5; padding:12px 16px; font-weight:bold; width:35%; color:#515151;">
          ${String(d.etiqueta ?? "")}
        </td>
        <td style="padding:12px 16px; color:#105CC7;">
          ${String(d.valor ?? "")}
        </td>
      </tr>
    `
    )
    .join("");

  const ctaHtml = cta?.url
    ? `
      <div style="margin:22px 0; text-align:center;">
        <a href="${cta.url}"
           style="display:inline-block; background:${theme.badge}; color:#FFFFFF; text-decoration:none; padding:12px 18px; border-radius:8px; font-weight:bold;">
          ${cta.texto ?? "Ver en el sistema"}
        </a>
      </div>
    `
    : "";

  return `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${titulo}</title>
    </head>
    <body style="margin:0; padding:0; background-color:#515151; font-family:Arial, Helvetica, sans-serif; color:#515151;">
      <table align="center" cellpadding="0" cellspacing="0" width="100%"
             style="max-width:600px; margin:auto; background-color:#E7E7E7; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); overflow:hidden;">
        <tr>
          <td style="background-color:${theme.header}; padding:20px 30px; text-align:center;">
            <h1 style="color:#E7E7E7; font-size:22px; margin:0;">
              ${titulo}
            </h1>
          </td>
        </tr>

        <tr>
          <td style="padding:26px 30px;">
            <p style="font-size:16px; line-height:1.6; margin:0 0 12px 0;">
              ${subtitulo}
            </p>

            ${
              mensaje
                ? `<div style="font-size:15px; line-height:1.6; margin:10px 0 16px 0;">${mensaje}</div>`
                : ""
            }

            ${
              filas
                ? `
                <table cellpadding="0" cellspacing="0" width="100%"
                       style="margin:16px 0; border:1px solid #E7E7E7; border-radius:6px;">
                  ${filas}
                </table>
              `
                : ""
            }

            ${ctaHtml}
          </td>
        </tr>

        <tr>
          <td style="background-color:#C5C5C5; padding:15px 30px; text-align:center; font-size:12px; color:#515151;">
            © ${dayjs().year()} BioAlquimia S.A. — Sistema de Gestión de Recursos Humanos<br/>
            <span style="color:#666;">${pie}</span>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};
