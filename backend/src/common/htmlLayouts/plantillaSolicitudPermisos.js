import dayjs from "dayjs";

/**
 * Plantilla HTML para solicitud de permisos.
 *
 * @param {Object} params - Parámetros del correo.
 * @param {string} params.solicitanteNombre - Nombre del solicitante.
 * @param {string} params.tipo - Nombre del solicitante.
 * @param {string} params.fechaInicio - Fecha de cuando se requieren las extra.
 * @param {string} params.fechaFin - Fecha de cuando se requieren las extra.
 * @returns {string} HTML completo del correo.
 */
export const plantillaSolicitudPermisos = ({
  solicitanteNombre,
  fechaInicio,
  fechaFin,
  tipo,
  cantidadDias,
  cantidadHoras
}) => `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Solicitud de permisos - BioAlquimia</title>
    </head>
    <body style="margin:0; padding:0; background-color:#515151; font-family:Arial, Helvetica, sans-serif; color:#DEDEDE;">
      <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; margin:auto; background-color:#E7E7E7; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); overflow:hidden;">
        <tr>
          <td style="background-color:#319E3F; padding:20px 30px; text-align:center;">
            <h1 style="color:#E7E7E7; font-size:24px; margin:0;">
              Nueva solicitud de permisos
            </h1>
          </td>
        </tr>

        <tr>
          <td style="padding:30px;">
            <p style="font-size:16px; line-height:1.6;">
              Se ha registrado una <strong>nueva solicitud de permiso</strong> ${tipo} que requiere revisión.
            </p>

            <p style="font-size:15px; line-height:1.6;">
              A continuación se muestran los detalles:
            </p>

            <table cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0; border:1px solid #E7E7E7; border-radius:6px;">
              <tr>
                <td style="background-color:#C5C5C5; padding:12px 16px; font-weight:bold; width:35%;">Colaborador</td>
                <td style="padding:12px 16px; color:#105CC7;">${solicitanteNombre}</td>
              </tr>
              <tr>
                <td style="background-color:#C5C5C5; padding:12px 16px; font-weight:bold;">Fecha de inicio</td>
                <td style="padding:12px 16px; color:#105CC7;">${fechaInicio}</td>
              </tr>
              <tr>
                <td style="background-color:#C5C5C5; padding:12px 16px; font-weight:bold;">Fecha de finalización</td>
                <td style="padding:12px 16px; color:#105CC7;">${fechaFin}</td>
              </tr>
              <tr>
                <td style="background-color:#C5C5C5; padding:12px 16px; font-weight:bold;">Cantidad de días</td>
                <td style="padding:12px 16px; color:#105CC7;">${cantidadDias}</td>
              </tr>
              <tr>
                <td style="background-color:#C5C5C5; padding:12px 16px; font-weight:bold;">Cantidad de horas</td>
                <td style="padding:12px 16px; color:#105CC7;">${cantidadHoras}</td>
              </tr>
            </table>

            <p style="font-size:15px; line-height:1.6;">
              Ingrese al sistema para <strong>aprobar o rechazar</strong> la solicitud.
            </p>

            <p style="font-size:14px; color:#E7E7E7;">
              Si necesitas más información, revisa el detalle dentro del módulo correspondiente.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background-color:#C5C5C5; padding:15px 30px; text-align:center; font-size:12px; color:#E7E7E7;">
            © ${dayjs().year()} BioAlquimia S.A. — Sistema de Gestión de Recursos Humanos<br/>
            <span style="color:#aaa;">Este es un mensaje automático, por favor no respondas a este correo.</span>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;
