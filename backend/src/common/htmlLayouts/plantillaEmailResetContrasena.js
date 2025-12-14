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
    <body style="margin:0; padding:0; background-color:#515151; font-family:Arial, Helvetica, sans-serif; color:#DEDEDE;">
      <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; margin:auto; background-color:#E7E7E7; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.05); overflow:hidden;">
        <tr>
          <td style="background-color:#319E3F; padding:20px 30px; text-align:center;">
             <h1 style="color:#E7E7E7; font-size:24px; margin:0;">Contraseña temporal para ingreso al sistema de <span style="color:#57E868;">Bio</span><span style="color:#105CC7;">Alquimia</span></h1>
          </td>
        </tr>

        <tr>
          <td style="padding:30px;">
            <p style="font-size:16px; line-height:1.6;">Hola <strong>${nombre} ${primer_apellido} ${segundo_apellido}</strong>,</p>

            <p style="font-size:15px; line-height:1.6;">
              Ya puedes acceder al sistema con las siguientes credenciales:
            </p>

           <table cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0; border:1px solid #E7E7E7; border-radius:6px;">
              <tr>
                <td style="background-color:#C5C5C5; padding:12px 16px; font-weight:bold; width:35%;">Usuario</td>
                <td style="padding:12px 16px; color:#105CC7;">${username}</td>
              </tr>
              <tr>
                <td style="background-color:#C5C5C5; padding:12px 16px; font-weight:bold;">Contraseña temporal</td>
                <td style="padding:12px 16px; color:#105CC7;">${temporalPass}</td>
              </tr>
            </table>

            <p style="font-size:15px; line-height:1.6;">
              Por razones de seguridad, te recomendamos <strong>cambiar tu contraseña al ingresar al sistema</strong>.
            </p>

            <p style="font-size:14px; color:#E7E7E7;">
              Si tienes algún problema con el acceso, por favor contacta al departamento de Recursos Humanos.
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
