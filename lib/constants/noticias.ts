/**
 * Noticias y artículos de la landing 3D (sección «Noticias» y páginas /[locale]/noticias).
 *
 * Para agregar una: copia un objeto, cambia el `slug` (será la dirección) y ponla arriba si es la
 * más nueva. `destacada: true` la pone en grande en la landing (sólo una). Los datos de los
 * artículos informativos llevan su fuente: si cambias una cifra, cambia también la fuente.
 */

export type CategoriaNoticia = 'SiMAR' | 'Mar de Cortés' | 'Normativa' | 'Conciencia';

export interface Noticia {
    slug: string;
    titulo: string;
    categoria: CategoriaNoticia;
    /** AAAA-MM-DD; con `soloMes` se muestra como «Junio de 2025» */
    fecha: string;
    soloMes?: boolean;
    resumen: string;
    /** Párrafos del artículo */
    cuerpo: string[];
    /** Foto de portada (de /public). Sin foto, la portada es un dibujo con el ícono del tema */
    imagen?: { src: string; alt: string; posicion?: string };
    /** Otra foto dentro del artículo */
    imagenInterior?: { src: string; alt: string; pie: string };
    fuentes?: { texto: string; url?: string }[];
    destacada?: boolean;
}

export const NOTICIAS: Noticia[] = [
    {
        slug: 'conanp-reconoce-25-anios-del-centro-de-acopio',
        titulo: 'CONANP reconoce 25 años del centro de acopio del puerto',
        categoria: 'SiMAR',
        fecha: '2025-06-10',
        resumen:
            'La Reserva de la Biosfera Alto Golfo de California y Delta del Río Colorado reconoció a Francisco Javier Bojórquez Ochoa por 25 años al frente del centro de acopio del recinto portuario.',
        cuerpo: [
            'El 10 de junio de 2025, en Puerto Peñasco, la Comisión Nacional de Áreas Naturales Protegidas (CONANP), a través de la Dirección de la Reserva de la Biosfera Alto Golfo de California y Delta del Río Colorado, entregó un reconocimiento a Francisco Javier Bojórquez Ochoa «por 25 años desarrollando la operación del Centro de Acopio de Residuos Peligrosos en el Recinto Portuario de Puerto Peñasco».',
            'Don Francisco es el responsable del área de residuos del recinto. Durante años llenó a mano, hoja por hoja, los manifiestos de lo que entregaba cada embarcación: basura, aceite usado y filtros. Esas hojas se deterioraban con el tiempo hasta volverse ilegibles.',
            'SiMAR se diseñó con él y para él: con botones grandes, pasos claros y lenguaje sencillo, para que ese trabajo quede guardado y se pueda consultar.',
        ],
        imagen: { src: '/assets/images/img4.jpeg', alt: 'Francisco Javier Bojórquez Ochoa con su reconocimiento en Puerto Peñasco', posicion: '50% 30%' },
        imagenInterior: {
            src: '/assets/images/img6.jpeg',
            alt: 'Reconocimiento de la CONANP a Francisco Javier Bojórquez Ochoa',
            pie: 'El reconocimiento, firmado en Puerto Peñasco el 10 de junio de 2025.',
        },
        fuentes: [{ texto: 'Reconocimiento original de la Dirección de la Reserva de la Biosfera Alto Golfo de California y Delta del Río Colorado (CONANP).' }],
        destacada: true,
    },
    {
        slug: 'un-litro-de-aceite-un-millon-de-litros-de-agua',
        titulo: 'Un litro de aceite, un millón de litros de agua',
        categoria: 'Conciencia',
        fecha: '2026-10-31',
        resumen: 'De dónde sale la cifra que más repetimos, qué tan exacta es y por qué el aceite usado vale más en el centro de acopio que en el mar.',
        cuerpo: [
            'La Agencia de Protección Ambiental de Estados Unidos (EPA) estima que el aceite usado de un solo cambio de aceite puede contaminar un millón de galones de agua dulce: el abasto de un año para 50 personas.',
            'De ahí sale la proporción que usamos en SiMAR, un litro de aceite por cada millón de litros de agua. Es una estimación del daño posible, no una medición: depende de dónde caiga el aceite y de cuánto se diluya. Pero la idea se sostiene: muy poco aceite alcanza para hacer mucho daño.',
            'En el agua, el aceite forma una capa que no deja pasar la luz ni el oxígeno, y trae metales pesados y otras sustancias tóxicas.',
            'El aceite usado, en cambio, se puede volver a refinar. Según la misma EPA, de un galón de aceite usado salen 2.5 cuartos de aceite lubricante, lo mismo que de 42 galones de petróleo crudo.',
            'En SiMAR, cada litro que entrega una embarcación queda en su manifiesto, y de esos registros salen las cifras de la página de inicio.',
        ],
        fuentes: [
            {
                texto: 'EPA. Used Oil Management Program (archivo).',
                url: 'https://archive.epa.gov/wastes/conserve/materials/usedoil/web/html/index.html',
            },
        ],
    },
    {
        slug: 'vaquita-marina-2025',
        titulo: 'La vaquita marina sigue aquí: entre 7 y 10 en 2025',
        categoria: 'Mar de Cortés',
        fecha: '2026-10-31',
        resumen: 'El conteo de 2025 confirmó crías nuevas de la marsopa más pequeña del mundo, que sólo vive en el Alto Golfo de California.',
        cuerpo: [
            'La vaquita marina es la marsopa más pequeña del mundo y sólo vive en el Alto Golfo de California, el mismo mar que baña Puerto Peñasco.',
            'El crucero de observación de 2025, cuyos resultados se dieron a conocer en octubre de 2025, confirmó entre 7 y 10 vaquitas y el nacimiento de crías. Es un poco más que en 2024, el registro más bajo de la historia. En 1997, cuando se hizo el primer conteo, se estimaban unas 567.',
            'Su mayor amenaza son las redes de enmalle, en las que quedan atrapadas. Las redes viejas que se pierden en el mar siguen atrapando animales durante años: por eso también cuenta que lleguen al centro de acopio en lugar de quedarse en el agua.',
        ],
        fuentes: [
            {
                texto: 'Expansión Política. Monitoreo 2025 confirma reaparición de vaquitas marinas y sus crías en el Alto Golfo (28 de octubre de 2025).',
                url: 'https://politica.expansion.mx/mexico/2025/10/28/monitoreo-2025-confirma-reaparicion-de-vaquitas-marinas-y-sus-crias-en-el-alto-golfo',
            },
            {
                texto: 'IUCN SSC Cetacean Specialist Group. Joint visual and acoustic survey finds vaquitas surviving and reproducing.',
                url: 'https://iucn-csg.org/joint-visual-and-acoustic-survey-finds-vaquitas-surviving-and-reproducing-mostly-in-and-near-the-sanctuary/',
            },
        ],
    },
    {
        slug: 'simar-suma-a-las-empresas-recolectoras',
        titulo: 'SiMAR suma a las empresas recolectoras',
        categoria: 'SiMAR',
        fecha: '2026-09-01',
        soloMes: true,
        resumen: 'Además de los manifiestos, SiMAR tiene ahora un portal para las empresas que recogen y reciclan lo que llega al centro de acopio.',
        cuerpo: [
            'SiMAR empezó como un registro digital de los manifiestos del centro de acopio. Ahora también conecta a las empresas recolectoras y de reciclaje con el puerto.',
            'Desde su portal, cada empresa ve los residuos que el centro de acopio tiene disponibles, pide una recolección y sigue su solicitud paso a paso hasta que se completa. También puede escribirle al centro de acopio y recibir avisos.',
            'En «Impacto ambiental», la empresa ve cuánto aceite y cuántos reciclables ha recolectado, mes con mes.',
        ],
        imagen: { src: '/assets/landing/3d/pantalla-portal.webp', alt: 'Inicio del portal de una empresa recolectora en SiMAR', posicion: '50% 0%' },
    },
    {
        slug: 'marpol-anexo-v-lo-que-un-barco-no-puede-tirar-al-mar',
        titulo: 'MARPOL Anexo V: lo que un barco no puede tirar al mar',
        categoria: 'Normativa',
        fecha: '2026-10-31',
        resumen: 'La regla internacional sobre la basura de los barcos, en corto: qué dice, desde cuándo aplica en México y por qué existe el centro de acopio.',
        cuerpo: [
            'El Convenio Internacional para Prevenir la Contaminación por los Buques, conocido como MARPOL, tiene seis anexos. El Anexo V trata de la basura que se genera a bordo: restos de comida, plásticos, cabos, redes, latas, vidrio y más.',
            'Desde el 1 de enero de 2013 rige una versión revisada del anexo. La regla general es que no se descarga basura al mar, salvo excepciones muy limitadas. Los plásticos, incluidas las redes y los cabos sintéticos, no se pueden tirar nunca.',
            'México se adhirió al Anexo V en 1998: el decreto de promulgación se publicó en el Diario Oficial de la Federación el 29 de octubre de ese año.',
            'Por eso importa el centro de acopio del puerto: es donde las embarcaciones dejan su basura en lugar de tirarla, y el manifiesto es la constancia de esa entrega.',
        ],
        imagen: { src: '/assets/images/img1.jpeg', alt: 'Fotos de la recolección de desechos en la zona del muelle de Puerto Peñasco', posicion: '50% 40%' },
        fuentes: [
            { texto: 'Organización Marítima Internacional (OMI). Prevention of pollution by garbage from ships.', url: 'https://www.imo.org/en/OurWork/Environment/Pages/Garbage-Default.aspx' },
            { texto: 'Gobierno de México. Convenio MARPOL (documento informativo).', url: 'https://www.gob.mx/cms/uploads/attachment/file/902460/3_MARPOL.pdf' },
        ],
    },
    {
        slug: 'el-mar-de-cortes-el-acuario-del-mundo',
        titulo: 'El Mar de Cortés, «el acuario del mundo»',
        categoria: 'Mar de Cortés',
        fecha: '2026-10-31',
        resumen: 'Jacques Cousteau lo llamó así, y las cifras de la UNESCO le dan la razón. Puerto Peñasco está en su orilla norte.',
        cuerpo: [
            'Jacques Cousteau llamó al Golfo de California «el acuario del mundo». Las cifras le dan la razón.',
            'En 2005, la UNESCO inscribió las Islas y Áreas Protegidas del Golfo de California en la lista del Patrimonio Mundial. Según la UNESCO, ahí vive el 39 % de las especies de mamíferos marinos del planeta y un tercio de las especies de cetáceos, y se han registrado 891 especies de peces, 90 de ellas endémicas.',
            'Puerto Peñasco está en el Alto Golfo, en la región de la Reserva de la Biosfera Alto Golfo de California y Delta del Río Colorado. Cada residuo que se queda en tierra es uno menos en ese mar.',
        ],
        fuentes: [{ texto: 'UNESCO. Islas y Áreas Protegidas del Golfo de California (Patrimonio Mundial).', url: 'https://whc.unesco.org/es/list/1182' }],
    },
    {
        slug: 'mencion-honorifica-conservacion-de-la-naturaleza-2015',
        titulo: 'Mención honorífica en el Reconocimiento a la Conservación de la Naturaleza 2015',
        categoria: 'SiMAR',
        fecha: '2015-10-01',
        soloMes: true,
        resumen: 'La SEMARNAT y la CONANP distinguieron a Francisco Javier Bojórquez Ochoa en la categoría Individual.',
        cuerpo: [
            'En octubre de 2015, la Secretaría de Medio Ambiente y Recursos Naturales (SEMARNAT), a través de la CONANP, otorgó a Francisco Javier Bojórquez Ochoa una mención honorífica en la categoría Individual del Reconocimiento a la Conservación de la Naturaleza 2015.',
            'Es uno de los reconocimientos al trabajo del centro de acopio de Puerto Peñasco, años antes de que existiera SiMAR.',
        ],
        imagen: { src: '/assets/images/img7.jpeg', alt: 'Reconocimiento a la Conservación de la Naturaleza 2015, mención honorífica', posicion: '50% 45%' },
        fuentes: [{ texto: 'Reconocimiento original de la SEMARNAT y la CONANP (octubre de 2015).' }],
    },
];

export function noticiaPorSlug(slug: string) {
    return NOTICIAS.find((n) => n.slug === slug) ?? null;
}

/** «10 de junio de 2025» o, con `soloMes`, «Junio de 2025» */
export function fechaNoticia(n: Pick<Noticia, 'fecha' | 'soloMes'>) {
    const [a, m, d] = n.fecha.split('-').map(Number);
    const fecha = new Date(Date.UTC(a, m - 1, d, 12));
    if (n.soloMes) {
        const texto = fecha.toLocaleDateString('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' });
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }
    return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Minutos de lectura (≈ 200 palabras por minuto) */
export function minutosDeLectura(n: Pick<Noticia, 'cuerpo'>) {
    const palabras = n.cuerpo.join(' ').split(/\s+/).length;
    return Math.max(1, Math.round(palabras / 200));
}
