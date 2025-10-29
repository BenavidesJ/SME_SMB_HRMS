/* Status Codes */
export const HTTP_CODES = {
    ERROR: {
        CLIENT: {
            BAD_REQUEST: 400,
            UNAUTHORIZED: 401,
            FORBIDDEN: 403,
            NOT_FOUND: 404
        },
        SERVER: {
            INTERNAL_ERROR: 500,
            SERVICE_UNAVAILABLE: 503,
            TIMEOUT: 504
        }
    },
    SUCCESS: {
        OK: 200,
        CREATED: 201,
        ACCEPTED: 202,
        OK_NO_CONTENT: 204,

    },
    INFORMATION: {
        CONTINUE: 100,
        PROCESSING: 102,
    }
};

/* Error messages */
export const CAMPOS_OBLIGATORIOS = (campos) => `El campo ${campos} es obligatorio`;

/* Validation Helpers */
export const validPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@#!\.]).+$/;


/* Email */
export const otpEmailSubject = "Verificación de Cuenta - Departamento de Recursos Humanos BioAlquimia";
export const otpEmailBody = (codigo) => `Tu codigo de verificación es ${codigo}. Expira en 10 minutos`;