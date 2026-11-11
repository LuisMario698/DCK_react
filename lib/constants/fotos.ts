/**
 * Las fotos de Noticias que no son de SiMAR, con su crédito y su licencia. Todas salen de
 * Wikimedia Commons y son de dominio público (NOAA, NASA, USFWS: obras del gobierno de EE. UU.),
 * CC0 o Creative Commons con atribución. Están en public/assets/noticias/fotos, en WebP y a lo más
 * 2000 px de ancho (reducidas y recortadas en pantalla: con CC BY-SA eso es una adaptación, se dice
 * en el crédito). Para agregar una: bájala de su página en Commons, anota autor y licencia tal como
 * vienen ahí y nunca uses una foto sin licencia libre.
 */

export interface CreditoFoto {
    autor: string;
    /** «Dominio público», «CC0», «CC BY 2.0», «CC BY-SA 4.0»… */
    licencia: string;
    licenciaUrl?: string;
    /** La página del archivo (Wikimedia Commons), donde está todo su historial */
    pagina: string;
}

export interface FotoNoticia {
    /** Qué se ve, para la lista de créditos */
    que: string;
    src: string;
    ancho: number;
    alto: number;
    credito: CreditoFoto;
}

const CC = {
    'CC BY 2.0': 'https://creativecommons.org/licenses/by/2.0/deed.es',
    'CC BY-SA 2.0': 'https://creativecommons.org/licenses/by-sa/2.0/deed.es',
    'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/deed.es',
    CC0: 'https://creativecommons.org/publicdomain/zero/1.0/deed.es',
} as const;

const foto = (que: string, nombre: string, ancho: number, alto: number, autor: string, licencia: string, pagina: string): FotoNoticia => ({
    que,
    src: `/assets/noticias/fotos/${nombre}.webp`,
    ancho,
    alto,
    credito: { autor, licencia, licenciaUrl: CC[licencia as keyof typeof CC], pagina },
});

const COMMONS = 'https://commons.wikimedia.org/wiki/File:';

export const FOTOS = {
    vaquitaYCria: foto('Vaquita marina y su cría', 'vaquita-y-cria', 1252, 580, 'Paula Olson, NOAA', 'Dominio público', `${COMMONS}Vaquita6_Olson_NOAA.jpg`),
    vaquita: foto('Vaquita marina', 'vaquita', 1811, 890, 'Paula Olson, NOAA', 'Dominio público', `${COMMONS}Vaquita4_Olson_NOAA.jpg`),
    tortugaEnRed: foto('Tortuga atrapada en una red fantasma', 'tortuga-en-red-fantasma', 2000, 1324, 'NOAA', 'Dominio público', `${COMMONS}Turtle_entangled_in_marine_debris_(ghost_net).jpg`),
    aceiteDeMotor: foto('Aceite de motor', 'aceite-de-motor', 1688, 1125, 'SIGAUS', 'CC BY-SA 4.0', `${COMMONS}SIGAUS_aceite.jpg`),
    gotaEnElAgua: foto('Gota que cae sobre el agua', 'gota-en-el-agua', 2000, 1333, 'Davide Restivo', 'CC BY-SA 2.0', `${COMMONS}Water_drop_impact_on_a_water-surface.jpg`),
    plasticoEnLaPlaya: foto('Plástico juntado en una playa', 'plastico-en-la-playa', 2000, 1126, 'VariousPhotography', 'CC0', `${COMMONS}Marine_debris_and_plastic_waste_on_beach.jpg`),
    flotaDePuertoPenasco: foto('Flota de Puerto Peñasco al atardecer', 'flota-de-puerto-penasco', 2000, 1335, 'David Noll', 'CC BY-SA 2.0', `${COMMONS}Puerto_Pe%C3%B1asco,_puerto_pesquero_al_atardecer.jpg`),
    puertoDePuertoPenasco: foto('Puerto pesquero de Puerto Peñasco', 'puerto-de-puerto-penasco', 2000, 1500, 'Raxa.Kame', 'CC BY-SA 4.0', `${COMMONS}Puerto_pesquero_de_Puerto_Pe%C3%B1asco,_Sonora,_M%C3%A9xico.jpg`),
    golfoSatelite: foto('Golfo de California desde un satélite', 'golfo-de-california-satelite', 2000, 1365, 'MODIS Land Rapid Response Team, NASA GSFC', 'Dominio público', `${COMMONS}Gulf_of_California_(MODIS_2026-01-31).jpg`),
    islaEspirituSanto: foto('Isla Espíritu Santo', 'isla-espiritu-santo', 2000, 1125, 'Óscar Badillo Pérez', 'CC BY-SA 4.0', `${COMMONS}Isla_Esp%C3%ADritu_Santo.jpg`),
    playaDeSanFelipe: foto('Playa de San Felipe', 'playa-de-san-felipe', 2000, 1500, 'WarrenIC', 'CC BY 2.0', `${COMMONS}San_Felipe_(19844176404).jpg`),
    retiroDeRedes: foto('Retiro de redes abandonadas', 'retiro-de-redes', 2000, 1333, 'USFWS Pacific', 'Dominio público', `${COMMONS}Marine_Debris_Cleanup_on_Midway_Atoll_(33842937892).jpg`),
    olaMarAbierto: foto('Ola en mar abierto', 'ola-mar-abierto', 2000, 1125, 'Austin Schmid', 'CC0', `${COMMONS}Blue_ocean_wave_(Unsplash).jpg`),
} satisfies Record<string, FotoNoticia>;

/** «Foto: Paula Olson, NOAA · Dominio público» (con CC BY-SA, «adaptada»: se recorta en pantalla) */
export function textoCredito(c: CreditoFoto) {
    return `Foto: ${c.autor} · ${c.licencia}${c.licencia.includes('SA') ? ' (adaptada)' : ''}`;
}
