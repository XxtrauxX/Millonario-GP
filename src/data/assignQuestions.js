import questionsData from './questions.json';
import participantsData from './participants.json';

export const QUESTIONS_PER_PLAYER = 7;
export const MONEY_PER_QUESTION = 5000;
export const MAX_MONEY = QUESTIONS_PER_PLAYER * MONEY_PER_QUESTION;
export const SECONDS_PER_QUESTION = 60;

export const CARGO_LABELS = {
    CONSULTOR_OP: 'Consultor OP',
    LIDER_CONTABLE: 'Líder Contable',
    LIDER_SENIOR: 'Líder Senior',
    REVISORIA: 'Revisoría'
};

export const BANK_LABELS = {
    tributario: 'Tributaria',
    financiera: 'Financiera',
    revisoria: 'Revisoría Fiscal'
};

export const NIVEL_LABELS = {
    basico: 'Básico',
    medio: 'Medio',
    complejo: 'Complejo',
    intermedio: 'Intermedio',
    avanzado: 'Avanzado'
};

// Composición que debe cumplir el kit de cada cargo.
export const CARGO_RULES = {
    CONSULTOR_OP: [
        { bank: 'financiera', niveles: ['basico'], count: 2 },
        { bank: 'tributario', niveles: ['basico'], count: 5 }
    ],
    LIDER_CONTABLE: [
        { bank: 'financiera', niveles: ['medio', 'complejo'], count: 3 },
        { bank: 'tributario', niveles: ['medio', 'complejo'], count: 4 }
    ],
    LIDER_SENIOR: [
        { bank: 'financiera', niveles: ['basico'], count: 2 },
        { bank: 'tributario', niveles: ['basico', 'medio'], count: 5 }
    ],
    REVISORIA: [
        { bank: 'financiera', niveles: ['medio', 'complejo'], count: 2 },
        { bank: 'tributario', niveles: ['basico', 'medio'], count: 2 },
        { bank: 'revisoria', niveles: ['intermedio'], count: 2 },
        { bank: 'revisoria', niveles: ['avanzado'], count: 1 }
    ]
};

// Kits fijos, en orden de aplicación. Ningún cargo juega dos turnos seguidos.
//
// Lo único fijo de cada kit son sus 2 repetidas. Las otras 5 se sortean en cada
// partida (ver buildLineup): se arma el kit 1, se descarta lo usado, se arma el 2,
// y así. El resultado siempre son 5 exclusivas que nadie más tiene.
//
// El banco no alcanza para 119 preguntas distintas: obliga a 23 usos extra.
// Concentrar esos 23 en 11 repetibles usadas de 2 a 4 veces —en vez de repartirlos
// en 23 usadas dos veces— deja 85 exclusivas, que es exactamente 17 × 5. Es la
// cota máxima: cada persona admite 2 compartidas (7 − 5), o sea 34 cupos, y
// 34 − 11 = 23.
//
// TRIB-01 y TRIB-02 salen en los 4 kits OP y no hay alternativa: Consultor OP
// necesita 20 tributarias básicas, existen 14, y su cargo no le permite subir de
// nivel. Quedan repartidas cada 5 turnos, la máxima distancia posible.
export const KITS = [
    { kit: 'OP-A', cargo: 'CONSULTOR_OP',   repetidas: ['TRIB-01', 'TRIB-02'] },
    { kit: 'LC-A', cargo: 'LIDER_CONTABLE', repetidas: ['FIN-05', 'TRIB-05'] },
    { kit: 'RF-A', cargo: 'REVISORIA',      repetidas: ['TRIB-04', 'TRIB-06'] },
    { kit: 'SR-A', cargo: 'LIDER_SENIOR',   repetidas: ['FIN-01', 'FIN-02'] },
    { kit: 'LC-B', cargo: 'LIDER_CONTABLE', repetidas: ['TRIB-15', 'TRIB-14'] },
    { kit: 'OP-B', cargo: 'CONSULTOR_OP',   repetidas: ['TRIB-01', 'TRIB-02'] },
    { kit: 'LC-C', cargo: 'LIDER_CONTABLE', repetidas: ['FIN-06', 'TRIB-05'] },
    { kit: 'RF-B', cargo: 'REVISORIA',      repetidas: ['TRIB-06', 'TRIB-04'] },
    { kit: 'LC-D', cargo: 'LIDER_CONTABLE', repetidas: ['TRIB-14', 'TRIB-15'] },
    { kit: 'SR-B', cargo: 'LIDER_SENIOR',   repetidas: ['FIN-01', 'TRIB-05'] },
    { kit: 'LC-E', cargo: 'LIDER_CONTABLE', repetidas: ['FIN-05', 'TRIB-04'] },
    { kit: 'OP-C', cargo: 'CONSULTOR_OP',   repetidas: ['TRIB-01', 'TRIB-02'] },
    { kit: 'LC-F', cargo: 'LIDER_CONTABLE', repetidas: ['TRIB-14', 'TRIB-06'] },
    { kit: 'SR-C', cargo: 'LIDER_SENIOR',   repetidas: ['FIN-02', 'TRIB-15'] },
    { kit: 'RF-C', cargo: 'REVISORIA',      repetidas: ['TRIB-05', 'TRIB-04'] },
    { kit: 'LC-G', cargo: 'LIDER_CONTABLE', repetidas: ['FIN-06', 'TRIB-06'] },
    { kit: 'OP-D', cargo: 'CONSULTOR_OP',   repetidas: ['TRIB-01', 'TRIB-02'] }
];

// Los pozos que se sortean quedan al ras: las 43 tributarias que hacen falta son
// exactamente las 43 que quedan libres. Por eso el sorteo va por cargo y en este
// orden. Consultor OP solo puede usar básicas, así que escoge primero; si Senior
// —que alcanza básicas y medias— entrara antes, le robaría las básicas. Y Contable
// va después de Senior porque le vaciaría las medias.
const DRAW_ORDER = ['CONSULTOR_OP', 'LIDER_SENIOR', 'LIDER_CONTABLE', 'REVISORIA'];

// Dentro del turno las preguntas suben de dificultad, como en el programa.
const NIVEL_RANK = { basico: 0, intermedio: 1, medio: 1, complejo: 2, avanzado: 2 };

const questionById = new Map(questionsData.map((q) => [q.id, q]));
const REPETIBLES = new Set(KITS.flatMap((k) => k.repetidas));

const matches = (q, rule) => q.bank === rule.bank && rule.niveles.includes(q.nivel);

const shuffle = (array) => {
    const out = [...array];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
};

// Sortea las 5 exclusivas de cada kit. Lo que necesita un kit sale de restarle a
// la regla de su cargo lo que ya cubren sus 2 repetidas. Lo usado se descarta, así
// que ninguna exclusiva puede caer en dos kits.
function drawExclusivas() {
    const used = new Set(REPETIBLES); // las repetibles nunca se sortean como exclusivas
    const byKit = new Map();

    for (const cargo of DRAW_ORDER) {
        for (const { kit, repetidas } of KITS.filter((k) => k.cargo === cargo)) {
            const picked = [];

            for (const rule of CARGO_RULES[cargo]) {
                const yaCubiertas = repetidas.filter((id) => matches(questionById.get(id), rule)).length;
                const faltan = rule.count - yaCubiertas;
                if (faltan <= 0) continue;

                const pool = questionsData.filter((q) => matches(q, rule) && !used.has(q.id));
                if (pool.length < faltan) {
                    throw new Error(
                        `El kit ${kit} necesita ${faltan} de ${rule.bank}/${rule.niveles.join('+')} y solo quedan ${pool.length}.`
                    );
                }

                for (const q of shuffle(pool).slice(0, faltan)) {
                    used.add(q.id);
                    picked.push(q);
                }
            }

            byKit.set(kit, picked);
        }
    }

    return byKit;
}

// Los kits son anónimos: se sortean entre la gente de su cargo. El turno manda,
// el nombre da igual. Si falta alguien, su kit simplemente no se aplica.
export function buildLineup(participants = participantsData) {
    const exclusivas = drawExclusivas();

    const pending = {};
    for (const cargo of Object.keys(CARGO_RULES)) {
        pending[cargo] = shuffle(participants.filter((p) => p.cargo === cargo));
    }

    const lineup = [];
    for (const { kit, cargo, repetidas } of KITS) {
        const person = pending[cargo]?.shift();
        if (!person) continue;

        const questions = [
            ...exclusivas.get(kit),
            ...repetidas.map((id) => questionById.get(id))
        ].sort((a, b) => NIVEL_RANK[a.nivel] - NIVEL_RANK[b.nivel]);

        if (questions.length !== QUESTIONS_PER_PLAYER) {
            throw new Error(`El kit ${kit} quedó con ${questions.length} preguntas.`);
        }

        lineup.push({ ...person, kit, questions });
    }

    return lineup;
}
