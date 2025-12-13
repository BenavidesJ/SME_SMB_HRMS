import dayjs from "dayjs";
/**
 * Plantilla HTML para envio de contraseñas temporales.
 *
 * @param {Object} params - Parámetros del correo.
 * @param {string} params.nombre - Nombre del colaborador.
 * @param {string} params.primer_apellido - Primer apellido.
 * @param {string} params.segundo_apellido - Segundo apellido.
 * @param {string} params.username - Usuario asignado.
 * @param {string} params.temporalPass - Contraseña temporal.
 * @returns {string} HTML completo del correo.
 */
export const plantillaEmailResetContrasena = ({
  nombre,
  primer_apellido,
  segundo_apellido,
  username,
  temporalPass,
}) => `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Contraseña Temporal</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f5f7fa; font-family:Arial, Helvetica, sans-serif; color:#333;">
      <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; margin:auto; background-color:#ffffff; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); overflow:hidden;">
        <tr>
          <td style="background-color:#0b5d5b; padding:20px 30px; text-align:center;">
            <h1 style="color:#ffffff; font-size:24px; margin:0;">Contraseña temporal para ingreso al sistema de <span style="color:#cdeac0;">BioAlquimia</span></h1>
          </td>
        </tr>

        <tr>
          <td style="padding:30px;">
            <p style="font-size:16px; line-height:1.6;">Hola <strong>${nombre} ${primer_apellido} ${segundo_apellido}</strong>,</p>

            <p style="font-size:15px; line-height:1.6;">
              Ya puedes acceder al sistema con las siguientes credenciales:
            </p>

            <table cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0; border:1px solid #e2e8f0; border-radius:6px;">
              <tr>
                <td style="background-color:#f8fafc; padding:12px 16px; font-weight:bold; width:35%;">Usuario</td>
                <td style="padding:12px 16px; color:#0b5d5b;">${username}</td>
              </tr>
              <tr>
                <td style="background-color:#f8fafc; padding:12px 16px; font-weight:bold;">Contraseña temporal</td>
                <td style="padding:12px 16px; color:#0b5d5b;">${temporalPass}</td>
              </tr>
            </table>

            <p style="font-size:15px; line-height:1.6;">
              Por razones de seguridad, te recomendamos <strong>cambiar tu contraseña al ingresar al sistema</strong>.
            </p>

            <p style="font-size:14px; color:#555;">
              Si tienes algún problema con el acceso, por favor contacta al departamento de Recursos Humanos.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background-color:#f8fafc; padding:15px 30px; text-align:center; font-size:12px; color:#777;">
            © ${dayjs().year()} BioAlquimia S.A. — Sistema de Gestión de Recursos Humanos<br/>
            <span style="color:#aaa;">Este es un mensaje automático, por favor no respondas a este correo.</span>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;
