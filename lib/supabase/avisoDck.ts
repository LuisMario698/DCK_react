import { toast } from 'sonner';

/** Aviso cuando algo intenta guardar en la base de DCK (uno solo aunque sean varios intentos) */
export function avisarSoloConsulta() {
    toast.info('La base de DCK es sólo de consulta', {
        id: 'base-dck',
        description: 'Aquí no se guardan cambios. Para capturar, vuelve a SiMAR en Superadmin → Sistema.',
        duration: 6000,
    });
}
