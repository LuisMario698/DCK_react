/**
 * Noticias y artículos de la página /[locale]/noticias (y del adelanto en la landing 3D).
 *
 * Hay dos clases:
 *  - noticias: lo que pasó, con su fecha (las más recientes van en la portada de la página);
 *  - artículos que explican (`explica: true`): el contexto del problema, que no caduca. Van en
 *    «La problemática» (TEMAS) y en la lista de todas.
 *
 * Para agregar una: copia un objeto y cambia el `slug` (será la dirección); el orden lo da la
 * fecha. Todo dato lleva su fuente: si cambias una cifra, cambia también la fuente (y el `dato`,
 * que repite la cifra principal del texto en grande). No se inventan fotos: sin foto, la portada
 * es un dibujo (components/noticias/ilustraciones.tsx).
 */

export type CategoriaNoticia = 'SiMAR' | 'Mar de Cortés' | 'Océanos' | 'Normativa' | 'Conciencia';

/** Los dibujos de portada (components/noticias/ilustraciones.tsx) */
export type Ilustracion = 'mapa' | 'altogolfo' | 'carta' | 'gota' | 'hojas' | 'simbolo' | 'red' | 'globo' | 'costa' | 'botella' | 'horizonte';

export const CATEGORIAS: CategoriaNoticia[] = ['SiMAR', 'Mar de Cortés', 'Océanos', 'Normativa', 'Conciencia'];

/** Sin foto, cada tema tiene su dibujo (se puede cambiar con `ilustracion`) */
export const ILUSTRACION_DE: Record<CategoriaNoticia, Ilustracion> = {
    SiMAR: 'simbolo',
    'Mar de Cortés': 'mapa',
    Océanos: 'globo',
    Normativa: 'hojas',
    Conciencia: 'gota',
};

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
    /** Foto de portada (de /public). Sin foto, la portada es un dibujo del tema */
    imagen?: { src: string; alt: string; posicion?: string };
    /** El dibujo de la portada cuando no hay foto (si no, el de su tema) */
    ilustracion?: Ilustracion;
    /** La cifra principal del artículo, en grande (debe salir del texto y de sus fuentes) */
    dato?: { cifra: string; texto: string };
    /** Fotos dentro del artículo, después del texto */
    galeria?: { src: string; alt: string; pie: string; ancho: number; alto: number }[];
    fuentes?: { texto: string; url?: string }[];
    /** Artículo que explica el problema (no caduca): va en «La problemática» y no en la portada */
    explica?: boolean;
}

export const NOTICIAS: Noticia[] = [
    {
        slug: 'redes-fantasma-la-pesca-que-nadie-ve',
        explica: true,
        titulo: 'Redes fantasma: la pesca que nadie ve',
        categoria: 'Conciencia',
        fecha: '2026-11-03',
        resumen: 'Las redes que se pierden o se abandonan en el mar siguen pescando durante meses o años. En el Alto Golfo de California son la mayor amenaza para la vaquita marina.',
        dato: { cifra: '10 %', texto: 'de la basura marina son artes de pesca abandonadas, perdidas o desechadas: unas 640,000 toneladas, según la FAO y el PNUMA (2009).' },
        ilustracion: 'red',
        cuerpo: [
            'Una red que se pierde en una tormenta, se atora en el fondo o se deja en el agua no deja de pescar. Peces, tortugas, aves y mamíferos marinos siguen quedando atrapados en ella durante meses, a veces años. Por eso se les llama redes fantasma.',
            'Un informe de la Organización de las Naciones Unidas para la Alimentación y la Agricultura (FAO) y del Programa de las Naciones Unidas para el Medio Ambiente (PNUMA) estimó en 2009 que las artes de pesca abandonadas, perdidas o desechadas son alrededor del 10 % de toda la basura marina: unas 640,000 toneladas.',
            'El mismo informe recomienda marcar las redes para saber de quién son, dar incentivos para reportar o devolver las que se pierden y tener en los puertos dónde dejar las que ya no sirven.',
            'En el Alto Golfo de California, las redes de enmalle son la principal amenaza para la vaquita marina. Desde hace años, autoridades, pescadores y organizaciones sacan redes perdidas de la zona: en 2017, la Semarnat informó que se habían retirado 451 redes, unas 50 toneladas.',
            'MARPOL Anexo V prohíbe tirar al mar las redes y los cabos sintéticos. Cuando una red ya no sirve, su lugar es en tierra.',
        ],
        fuentes: [
            { texto: 'FAO. Las redes fantasma dañan el medio marino (2009).', url: 'https://www.fao.org/newsroom/detail/Ghost-nets-hurting-marine-environment/es' },
            { texto: 'El Universal. Retiran 451 redes de pesca en Alto Golfo de California: Semarnat (2017).', url: 'https://www.eluniversal.com.mx/nacion/retiran-451-redes-de-pesca-en-alto-golfo-de-california-semarnat/' },
        ],
    },
    {
        slug: 'el-aceite-usado-es-un-residuo-peligroso',
        explica: true,
        titulo: 'El aceite usado es un residuo peligroso: qué dice la ley',
        categoria: 'Normativa',
        fecha: '2026-11-03',
        resumen: 'En México, el aceite lubricante usado no se tira: la ley lo trata como residuo peligroso y pide manejarlo con un plan, de quien lo genera a quien lo recicla.',
        dato: { cifra: 'Art. 31', texto: 'de la Ley General para la Prevención y Gestión Integral de los Residuos: los aceites lubricantes usados se manejan con un plan de manejo.' },
        cuerpo: [
            'La Ley General para la Prevención y Gestión Integral de los Residuos (LGPGIR) ordena los residuos según el riesgo que representan. El aceite lubricante usado de los motores está entre los residuos peligrosos que, según su artículo 31, deben manejarse con un plan de manejo.',
            'En la práctica, quien genera aceite usado no debe tirarlo al drenaje, al suelo ni al agua: lo entrega a empresas autorizadas para recolectarlo, transportarlo, reciclarlo o disponer de él.',
            'Los filtros de aceite y de diésel también se quedan con aceite adentro. Por eso el manifiesto del centro de acopio los cuenta aparte, pieza por pieza.',
            'El manifiesto es la constancia de que una embarcación entregó su aceite usado en el puerto. En SiMAR queda firmado y guardado, y de ahí sale la cuenta de cuántos litros se han recibido.',
        ],
        fuentes: [{ texto: 'Cámara de Diputados. Ley General para la Prevención y Gestión Integral de los Residuos (texto vigente).', url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LGPGIR.pdf' }],
    },
    {
        slug: 'se-reduce-la-zona-sin-redes-de-enmalle-en-el-alto-golfo',
        titulo: 'Se reduce la zona sin redes de enmalle en el Alto Golfo',
        categoria: 'Normativa',
        fecha: '2026-10-15',
        resumen: 'Un acuerdo publicado en octubre de 2026 achica en cerca de 86 % el área donde se prohíben las redes de enmalle en el norte del Golfo de California. La Zona de Tolerancia Cero, refugio de la vaquita marina, se mantiene.',
        dato: { cifra: '1,562 km²', texto: 'mide ahora el área donde se prohíben las redes de enmalle en el norte del Golfo de California. Antes eran unos 11,000.' },
        ilustracion: 'carta',
        cuerpo: [
            'El 14 de octubre de 2026, la Secretaría de Medio Ambiente y Recursos Naturales (Semarnat) publicó en el Diario Oficial de la Federación un acuerdo que actualiza las reglas de pesca en el norte del Golfo de California. Entró en vigor al día siguiente.',
            'El cambio más grande está en el área donde no se pueden usar redes de enmalle: pasa de unos 11,000 kilómetros cuadrados, la que fijó el acuerdo de 2020, a 1,562. Es una reducción de alrededor de 86 %.',
            'La Zona de Tolerancia Cero, donde se ha visto a las últimas vaquitas marinas, se mantiene con sus propias restricciones. El acuerdo abre además un canal sólo de paso, para que las embarcaciones no tengan que rodearla (ahí tampoco se puede pescar con redes de enmalle), y pide monitoreo satelital para las embarcaciones que trabajan en el Alto Golfo.',
            'La Semarnat dijo que siguió recomendaciones internacionales. Organizaciones ambientalistas criticaron el cambio: con tan pocas vaquitas, advierten, todavía no se puede saber si la población va en aumento.',
            'Las redes de enmalle son la mayor amenaza para la vaquita. Cuando se pierden o se abandonan siguen atrapando animales durante años; por eso importa que las redes viejas lleguen a tierra y no se queden en el agua.',
        ],
        fuentes: [
            {
                texto: 'El Heraldo de México. Semarnat actualiza el polígono de restricción y la Zona de Tolerancia Cero para salvar a la vaquita marina (15 de octubre de 2026).',
                url: 'https://heraldodemexico.com.mx/nacional/2026/10/15/semarnat-actualiza-el-poligono-de-restriccion-la-zona-de-tolerancia-cero-para-salvar-la-vaquita-marina-909027.html',
            },
            { texto: 'Milenio. Semarnat reduce zona de restricción pesquera para la protección de la vaquita marina (octubre de 2026).', url: 'https://www.milenio.com/estados/semarnat-reduce-zona-restriccion-pesquera-proteccion-vaquita-marina' },
            {
                texto: 'El Imparcial. Reducen 86 % la zona de protección de la vaquita marina en el Alto Golfo de California (15 de octubre de 2026).',
                url: 'https://www.elimparcial.com/mxl/mexicali/2026/10/15/reducen-86-la-zona-de-proteccion-de-la-vaquita-marina-en-el-alto-golfo-de-california/',
            },
        ],
    },
    {
        slug: 'jovenes-de-san-felipe-buscan-a-la-vaquita',
        titulo: 'Jóvenes de San Felipe se suman a la búsqueda de la vaquita',
        categoria: 'Mar de Cortés',
        fecha: '2026-07-18',
        resumen: 'Ocho jóvenes de la comunidad se formaron como observadores de la vaquita marina y, en sus primeras prácticas en el Alto Golfo, registraron tres avistamientos.',
        dato: { cifra: '3', texto: 'avistamientos de vaquita marina registraron los nuevos observadores en sus primeras prácticas, en julio de 2026.' },
        ilustracion: 'horizonte',
        cuerpo: [
            'En 2026, la Comisión Nacional de Áreas Naturales Protegidas (CONANP) encabezó una campaña para formar observadores de la vaquita marina entre la gente del Alto Golfo, con el apoyo de la organización Sea Shepherd.',
            'Ocho jóvenes de San Felipe, Baja California, tomaron 22 horas de formación antes de salir al mar y dos días de entrenamiento para tomar muestras de ADN ambiental, una técnica que encuentra rastros de la especie en el agua.',
            'En sus primeras prácticas, en julio, registraron tres avistamientos. La campaña también registró detecciones acústicas: micrófonos bajo el agua captan los sonidos que la vaquita usa para orientarse.',
            'La vaquita sólo vive en el Alto Golfo de California, el mar que comparten San Felipe y Puerto Peñasco. Se estima que quedan entre 7 y 10.',
        ],
        fuentes: [
            { texto: 'Sea Shepherd. 2026 vaquita marina observer training campaign begins (19 de mayo de 2026).', url: 'https://seashepherd.org/2026/05/19/2026-vaquita-marina-observer-training-campaign-begins/' },
            { texto: 'Sea Shepherd. The next watch: training San Felipe to save the world’s rarest porpoise (10 de julio de 2026).', url: 'https://seashepherd.org/2026/07/10/the-next-watch-training-san-felipe-to-save-the-worlds-rarest-porpoise/' },
            {
                texto: 'El Imparcial. Jóvenes de San Felipe logran tres avistamientos de vaquita marina durante monitoreo en el Alto Golfo de California (18 de julio de 2026).',
                url: 'https://www.elimparcial.com/mxl/mexicali/2026/07/18/jovenes-de-san-felipe-logran-tres-avistamientos-de-vaquita-marina-durante-monitoreo-en-el-alto-golfo-de-california/',
            },
        ],
    },
    {
        slug: 'mas-de-60-toneladas-fuera-de-las-playas-de-sonora-y-sinaloa',
        titulo: 'Más de 60 toneladas de basura, fuera de las playas de Sonora y Sinaloa',
        categoria: 'Mar de Cortés',
        fecha: '2026-07-13',
        resumen: 'Es lo que se ha retirado desde 2025 en la región Noroeste y Alto Golfo de California con la Estrategia Nacional de Limpieza de Playas: llantas, redes, PET y bolsas.',
        dato: { cifra: '60 t', texto: 'de residuos sólidos se retiraron de playas de Sonora y Sinaloa desde 2025, según la CONANP.' },
        ilustracion: 'costa',
        cuerpo: [
            'Desde 2025, la Estrategia Nacional de Limpieza y Conservación de Playas y Costas ha retirado poco más de 60 toneladas de residuos sólidos de playas de Sonora y Sinaloa, informó la CONANP en julio de 2026.',
            'Se recorrieron unos 536 kilómetros de litoral, con alrededor de 5,920 personas. Entre lo que se juntó hay llantas, redes, envases de PET y bolsas de plástico.',
            'La meta de la estrategia, de la Semarnat, es que en 2030 todas las playas y costas del país estén libres de residuos plásticos.',
            'Lo que se recoge en la playa ya llegó al mar. El centro de acopio del puerto trabaja un paso antes: que la basura de las embarcaciones se entregue en tierra y no llegue al agua.',
        ],
        fuentes: [
            {
                texto: 'CONANP. Avances en la Estrategia Nacional de Limpieza y Conservación de Playas en la Regional Noroeste y Alto Golfo de California.',
                url: 'https://www.gob.mx/conanp/prensa/avances-en-la-estrategia-nacional-de-limpieza-y-conservacion-de-playas-en-la-regional-noroeste-y-alto-golfo-de-california',
            },
            { texto: 'La Razón. Limpian playas de Sonora y Sinaloa; recolectan más de 60 toneladas de residuos (13 de julio de 2026).', url: 'https://www.razon.com.mx/mexico/2026/07/13/limpian-playas-de-sonora-y-sinaloa-recolectan-mas-de-60-toneladas-de-residuos/' },
        ],
    },
    {
        slug: 'el-tratado-mundial-contra-el-plastico-sigue-sin-acuerdo',
        titulo: 'El tratado mundial contra el plástico sigue sin acuerdo',
        categoria: 'Océanos',
        fecha: '2026-02-07',
        resumen: 'Tras el fracaso de las negociaciones de Ginebra en 2025, los países eligieron en febrero de 2026 a un nuevo presidente para retomarlas.',
        dato: { cifra: '11 millones', texto: 'de toneladas de plástico llegan al océano cada año, según el Programa de las Naciones Unidas para el Medio Ambiente (2021).' },
        ilustracion: 'botella',
        cuerpo: [
            'Desde 2022, los países de la ONU negocian un tratado para acabar con la contaminación por plásticos, también la del mar. La ronda de Ginebra, en agosto de 2025, terminó sin acuerdo, y su presidente renunció en octubre de ese año.',
            'El 7 de febrero de 2026, en una sesión de un solo día en Ginebra, el comité eligió como nuevo presidente al chileno Julio Cordano, con 92 votos contra 53. La fecha de la siguiente ronda quedó por definirse.',
            'Lo que sigue abierto es de fondo: si el tratado debe limitar cuánto plástico se produce, qué hacer con las sustancias químicas que lleva y cómo se va a pagar.',
            'Según el Programa de las Naciones Unidas para el Medio Ambiente (PNUMA), unos 11 millones de toneladas de plástico llegan al océano cada año, y la cifra podría casi triplicarse para 2040 si nada cambia.',
            'Para los barcos ya hay una regla clara: el Anexo V de MARPOL prohíbe tirar plásticos por la borda, redes y cabos incluidos.',
        ],
        fuentes: [
            { texto: 'PNUMA. New chair elected to lead negotiations on global plastic pollution treaty (febrero de 2026).', url: 'https://www.unep.org/news-and-stories/press-release/new-chair-elected-lead-negotiations-global-plastic-pollution-treaty' },
            { texto: 'IISD, Earth Negotiations Bulletin. INC-5.3 (7 de febrero de 2026).', url: 'https://enb.iisd.org/plastic-pollution-marine-environment-negotiating-committee-inc5.3-07Feb2026' },
            { texto: 'Noticias ONU. Plastic pollution on course to double by 2030 (octubre de 2021).', url: 'https://news.un.org/en/node/1103692' },
        ],
    },
    {
        slug: 'entra-en-vigor-el-tratado-de-alta-mar',
        titulo: 'Entra en vigor el tratado de alta mar, y México es parte',
        categoria: 'Océanos',
        fecha: '2026-01-17',
        resumen: 'El acuerdo para proteger la vida marina en las aguas que no son de ningún país entró en vigor el 17 de enero de 2026. México lo ratificó en septiembre de 2025.',
        dato: { cifra: '60', texto: 'ratificaciones necesitaba el tratado para entrar en vigor. Las alcanzó el 19 de septiembre de 2025.' },
        cuerpo: [
            'La alta mar son las aguas que quedan fuera de la jurisdicción de cualquier país: casi dos terceras partes del océano. Hasta ahora no había un acuerdo mundial para proteger su vida marina.',
            'El Acuerdo sobre la Biodiversidad Marina de las Zonas Situadas Fuera de la Jurisdicción Nacional, conocido como BBNJ o tratado de alta mar, permite crear áreas marinas protegidas en esas aguas y pide evaluar el impacto ambiental de lo que se haga ahí.',
            'Necesitaba 60 ratificaciones. Llegó a ellas el 19 de septiembre de 2025 y entró en vigor 120 días después, el 17 de enero de 2026. México entregó su ratificación en la ONU el 23 de septiembre de 2025.',
            'La primera reunión de los países que forman parte del tratado debe hacerse antes del 17 de enero de 2027.',
        ],
        fuentes: [
            { texto: 'Comisión Europea. High Seas Treaty enters into force (16 de enero de 2026).', url: 'https://oceans-and-fisheries.ec.europa.eu/news/high-seas-treaty-enters-force-milestone-ocean-conservation-2026-01-16_en' },
            { texto: 'Prensa Latina. México ratifica en ONU tratado sobre biodiversidad marina (23 de septiembre de 2025).', url: 'https://www.prensa-latina.cu/2025/09/23/mexico-ratifica-en-onu-tratado-sobre-biodiversidad-marina/' },
        ],
    },
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
        imagen: { src: '/assets/images/img3.jpeg', alt: 'Entrega de reconocimientos en el módulo de la CONANP, en Puerto Peñasco', posicion: '50% 40%' },
        dato: { cifra: '25 años', texto: 'al frente del centro de acopio de residuos del recinto portuario de Puerto Peñasco.' },
        galeria: [
            {
                src: '/assets/images/img4.jpeg',
                alt: 'Francisco Javier Bojórquez Ochoa con su reconocimiento en Puerto Peñasco',
                pie: 'Francisco Javier Bojórquez Ochoa con su reconocimiento.',
                ancho: 1080,
                alto: 1440,
            },
            {
                src: '/assets/images/img6.jpeg',
                alt: 'Reconocimiento de la CONANP a Francisco Javier Bojórquez Ochoa',
                pie: 'El reconocimiento, firmado en Puerto Peñasco el 10 de junio de 2025.',
                ancho: 1080,
                alto: 1440,
            },
        ],
        fuentes: [{ texto: 'Reconocimiento original de la Dirección de la Reserva de la Biosfera Alto Golfo de California y Delta del Río Colorado (CONANP).' }],
    },
    {
        slug: 'un-litro-de-aceite-un-millon-de-litros-de-agua',
        explica: true,
        titulo: 'Un litro de aceite, un millón de litros de agua',
        categoria: 'Conciencia',
        fecha: '2026-10-31',
        resumen: 'De dónde sale la cifra que más repetimos, qué tan exacta es y por qué el aceite usado vale más en el centro de acopio que en el mar.',
        dato: { cifra: '1,000,000', texto: 'de litros de agua puede contaminar un litro de aceite usado, según la estimación de la EPA.' },
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
        explica: true,
        titulo: 'La vaquita marina sigue aquí: entre 7 y 10 en 2025',
        categoria: 'Mar de Cortés',
        fecha: '2026-10-31',
        resumen: 'El conteo de 2025 confirmó crías nuevas de la marsopa más pequeña del mundo, que sólo vive en el Alto Golfo de California.',
        dato: { cifra: '7 a 10', texto: 'vaquitas marinas confirmadas en 2025. En 1997, en el primer conteo, se estimaban unas 567.' },
        ilustracion: 'altogolfo',
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
        explica: true,
        titulo: 'MARPOL Anexo V: lo que un barco no puede tirar al mar',
        categoria: 'Normativa',
        fecha: '2026-10-31',
        resumen: 'La regla internacional sobre la basura de los barcos, en corto: qué dice, desde cuándo aplica en México y por qué existe el centro de acopio.',
        dato: { cifra: '1998', texto: 'año en que México se adhirió al Anexo V de MARPOL, sobre la basura de los barcos.' },
        cuerpo: [
            'El Convenio Internacional para Prevenir la Contaminación por los Buques, conocido como MARPOL, tiene seis anexos. El Anexo V trata de la basura que se genera a bordo: restos de comida, plásticos, cabos, redes, latas, vidrio y más.',
            'Desde el 1 de enero de 2013 rige una versión revisada del anexo. La regla general es que no se descarga basura al mar, salvo excepciones muy limitadas. Los plásticos, incluidas las redes y los cabos sintéticos, no se pueden tirar nunca.',
            'México se adhirió al Anexo V en 1998: el decreto de promulgación se publicó en el Diario Oficial de la Federación el 29 de octubre de ese año.',
            'Por eso importa el centro de acopio del puerto: es donde las embarcaciones dejan su basura en lugar de tirarla, y el manifiesto es la constancia de esa entrega.',
        ],
        imagen: { src: '/assets/images/img1.jpeg', alt: 'Fotos de la recolección de desechos en la zona del muelle de Puerto Peñasco', posicion: '50% 40%' },
        galeria: [
            {
                src: '/assets/images/img2.jpeg',
                alt: 'Más fotos de la recolección de desechos en el muelle de Puerto Peñasco',
                pie: 'Fotos de la recolección de desechos en el muelle de Puerto Peñasco.',
                ancho: 1440,
                alto: 1080,
            },
        ],
        fuentes: [
            { texto: 'Organización Marítima Internacional (OMI). Prevention of pollution by garbage from ships.', url: 'https://www.imo.org/en/OurWork/Environment/Pages/Garbage-Default.aspx' },
            { texto: 'Gobierno de México. Convenio MARPOL (documento informativo).', url: 'https://www.gob.mx/cms/uploads/attachment/file/902460/3_MARPOL.pdf' },
        ],
    },
    {
        slug: 'el-mar-de-cortes-el-acuario-del-mundo',
        explica: true,
        titulo: 'El Mar de Cortés, «el acuario del mundo»',
        categoria: 'Mar de Cortés',
        fecha: '2026-10-31',
        resumen: 'Jacques Cousteau lo llamó así, y las cifras de la UNESCO le dan la razón. Puerto Peñasco está en su orilla norte.',
        dato: { cifra: '39 %', texto: 'de las especies de mamíferos marinos del planeta viven en el Golfo de California, según la UNESCO.' },
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

/** De la más nueva a la más vieja (las del mismo día, en el orden de arriba) */
export const POR_FECHA: Noticia[] = [...NOTICIAS].sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));

export function noticiaPorSlug(slug: string) {
    return NOTICIAS.find((n) => n.slug === slug) ?? null;
}

/** Las noticias más recientes (sin los artículos que explican, que no caducan) */
export function recientes(cuantas: number) {
    return POR_FECHA.filter((n) => !n.explica).slice(0, cuantas);
}

/** Otras para leer después: primero las del mismo tema, de la más nueva a la más vieja */
export function relacionadas(n: Noticia, cuantas = 3) {
    const otras = POR_FECHA.filter((o) => o.slug !== n.slug);
    return [...otras.filter((o) => o.categoria === n.categoria), ...otras.filter((o) => o.categoria !== n.categoria)].slice(0, cuantas);
}

/** La anterior (más vieja) y la siguiente (más nueva), para ir de una a otra */
export function vecinas(n: Noticia) {
    const i = POR_FECHA.findIndex((o) => o.slug === n.slug);
    return { anterior: POR_FECHA[i + 1] ?? null, siguiente: POR_FECHA[i - 1] ?? null };
}

/* ── La página de Noticias: lo que no es un artículo ────────────────────────────────────── */

/**
 * «La problemática», en cuatro temas. Cada uno con su cifra (que sale de un artículo y de sus
 * fuentes) y los artículos que lo explican.
 */
export const TEMAS: { id: string; tema: string; titulo: string; texto: string; cifra: string; nota: string; articulos: string[] }[] = [
    {
        id: 'aceite',
        tema: 'El aceite usado',
        titulo: 'Poco aceite, mucho daño.',
        texto: 'El aceite que sale del motor forma una capa en el agua que no deja pasar la luz ni el oxígeno. Bien entregado, se vuelve a refinar.',
        cifra: '1,000,000 L',
        nota: 'de agua puede contaminar un litro de aceite usado (EPA)',
        articulos: ['un-litro-de-aceite-un-millon-de-litros-de-agua', 'el-aceite-usado-es-un-residuo-peligroso'],
    },
    {
        id: 'basura',
        tema: 'La basura de los barcos',
        titulo: 'Lo que se tira, vuelve.',
        texto: 'Plásticos, cabos y redes que caen al agua terminan en las playas o en el fondo. Desde 2013, MARPOL prohíbe tirar plásticos al mar.',
        cifra: '11 millones t',
        nota: 'de plástico llegan al océano cada año (PNUMA, 2021)',
        articulos: ['marpol-anexo-v-lo-que-un-barco-no-puede-tirar-al-mar', 'mas-de-60-toneladas-fuera-de-las-playas-de-sonora-y-sinaloa', 'el-tratado-mundial-contra-el-plastico-sigue-sin-acuerdo'],
    },
    {
        id: 'redes',
        tema: 'Las redes fantasma',
        titulo: 'Redes que siguen pescando.',
        texto: 'Una red perdida atrapa animales durante años. En el Alto Golfo, las redes de enmalle son la mayor amenaza para la vaquita marina.',
        cifra: '10 %',
        nota: 'de la basura marina son artes de pesca perdidas o abandonadas (FAO y PNUMA, 2009)',
        articulos: ['redes-fantasma-la-pesca-que-nadie-ve', 'se-reduce-la-zona-sin-redes-de-enmalle-en-el-alto-golfo'],
    },
    {
        id: 'mar',
        tema: 'El mar que cuidamos',
        titulo: 'El acuario del mundo.',
        texto: 'Puerto Peñasco está en el Alto Golfo de California, uno de los mares con más vida del planeta y el único hogar de la vaquita marina.',
        cifra: '7 a 10',
        nota: 'vaquitas marinas quedan, según el conteo de 2025',
        articulos: ['el-mar-de-cortes-el-acuario-del-mundo', 'vaquita-marina-2025', 'jovenes-de-san-felipe-buscan-a-la-vaquita', 'entra-en-vigor-el-tratado-de-alta-mar'],
    },
];

/** La historia del proyecto (de README.md y de los artículos de SiMAR) */
export const HITOS: { fecha: string; titulo: string; texto: string; articulo?: string }[] = [
    {
        fecha: '2000',
        titulo: 'Empieza una tarea de 25 años',
        texto: 'Francisco Javier Bojórquez Ochoa se hace cargo del centro de acopio de residuos del recinto portuario de Puerto Peñasco.',
    },
    {
        fecha: '2014',
        titulo: 'Miles de hojas a mano',
        texto: 'Desde ese año se llenan a mano más de 5,000 manifiestos. El papel se mancha y se borra, y con él se pierde la cuenta.',
    },
    {
        fecha: 'Octubre de 2015',
        titulo: 'Mención honorífica',
        texto: 'La SEMARNAT y la CONANP lo distinguen en el Reconocimiento a la Conservación de la Naturaleza.',
        articulo: 'mencion-honorifica-conservacion-de-la-naturaleza-2015',
    },
    {
        fecha: 'Junio de 2025',
        titulo: '25 años, reconocidos',
        texto: 'La CONANP reconoce sus 25 años al frente del centro de acopio.',
        articulo: 'conanp-reconoce-25-anios-del-centro-de-acopio',
    },
    {
        fecha: '2026',
        titulo: 'Nace SiMAR',
        texto: 'Estudiantes del ITSPP, con DCK Conciencia y Cultura, llevan los manifiestos a la pantalla: registrados, firmados y en PDF.',
    },
    {
        fecha: 'Septiembre de 2026',
        titulo: 'Llegan las empresas recolectoras',
        texto: 'Un portal para que quienes reciclan vean lo que hay en el centro de acopio y pidan la recolección desde el celular.',
        articulo: 'simar-suma-a-las-empresas-recolectoras',
    },
];

/** Las palabras que más se repiten en las noticias */
export const GLOSARIO: { termino: string; definicion: string }[] = [
    { termino: 'Manifiesto', definicion: 'El documento que registra que una embarcación entregó sus residuos en el centro de acopio: qué, cuánto y quién firma.' },
    { termino: 'Centro de acopio', definicion: 'El lugar del recinto portuario donde las embarcaciones entregan su basura, su aceite usado y sus filtros.' },
    { termino: 'Basurón', definicion: 'El recibo del relleno sanitario: lo que el camión del centro de acopio lleva al relleno municipal. Es la misma basura de los manifiestos.' },
    { termino: 'Aceite usado', definicion: 'El aceite lubricante que sale del motor al cambiarlo. Es un residuo peligroso y se puede volver a refinar.' },
    { termino: 'MARPOL Anexo V', definicion: 'La regla internacional sobre la basura de los barcos. Prohíbe tirar plásticos al mar, redes y cabos incluidos.' },
    { termino: 'Empresa recolectora', definicion: 'La empresa autorizada que recoge y recicla lo que se junta en el centro de acopio.' },
    { termino: 'Red de enmalle', definicion: 'Una red que se tiende como una pared en el agua: los peces quedan atorados por las agallas.' },
    { termino: 'Red fantasma', definicion: 'Una red perdida o abandonada en el mar que sigue atrapando animales.' },
    { termino: 'Zona de Tolerancia Cero', definicion: 'El área del Alto Golfo donde vive la vaquita marina, con las reglas de pesca más estrictas.' },
    { termino: 'Alta mar', definicion: 'Las aguas que no son de ningún país: casi dos terceras partes del océano.' },
];

/** Todas las fuentes con dirección, sin repetir, con el artículo que las cita */
export function todasLasFuentes() {
    const vistas = new Map<string, { texto: string; url: string; articulo: Pick<Noticia, 'slug' | 'titulo'> }>();
    for (const n of POR_FECHA) {
        for (const f of n.fuentes ?? []) {
            if (f.url && !vistas.has(f.url)) vistas.set(f.url, { texto: f.texto, url: f.url, articulo: { slug: n.slug, titulo: n.titulo } });
        }
    }
    return [...vistas.values()];
}

/** Lo que necesita una tarjeta (sin el cuerpo: así la lista no baja los artículos enteros) */
export type ResumenNoticia = Omit<Noticia, 'cuerpo' | 'galeria' | 'fuentes'> & { minutos: number };

export function resumenDe(n: Noticia): ResumenNoticia {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { cuerpo, galeria, fuentes, ...resto } = n;
    return { ...resto, minutos: minutosDeLectura(n) };
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
