import { useMemo, useState } from 'react';
import { CARGO_LABELS, BANK_LABELS, NIVEL_LABELS } from '../data/assignQuestions';

// Preguntas falladas por al menos una persona, de la más fallada a la menos.
// Es el insumo de la retroalimentación grupal del final.
function buildFailedRanking(players) {
    const byQuestion = new Map();

    for (const player of players) {
        for (const answer of player.answers) {
            if (answer.isCorrect) continue;
            if (!byQuestion.has(answer.questionId)) {
                byQuestion.set(answer.questionId, { ...answer, whoFailed: [] });
            }
            byQuestion.get(answer.questionId).whoFailed.push(player.name);
        }
    }

    return [...byQuestion.values()].sort((a, b) => b.whoFailed.length - a.whoFailed.length);
}

function buildTopicStats(players) {
    const byTopic = new Map();

    for (const player of players) {
        for (const answer of player.answers) {
            const key = `${BANK_LABELS[answer.bank]} · ${answer.tema}`;
            if (!byTopic.has(key)) byTopic.set(key, { key, hits: 0, total: 0 });
            const row = byTopic.get(key);
            row.total += 1;
            if (answer.isCorrect) row.hits += 1;
        }
    }

    return [...byTopic.values()].sort((a, b) => a.hits / a.total - b.hits / b.total);
}

function toCsv(players) {
    const header = [
        'Cedula',
        'Nombre',
        'Cargo',
        'Kit',
        'No. pregunta',
        'ID pregunta',
        'Banco',
        'Tema',
        'Nivel',
        'Pregunta',
        'Respondio',
        'Respuesta correcta',
        'Resultado',
        'Base legal / referencia'
    ];

    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

    const rows = players.flatMap((player) =>
        player.answers.map((answer, idx) =>
            [
                player.cedula,
                player.name,
                CARGO_LABELS[player.cargo],
                player.kit,
                idx + 1,
                answer.questionId,
                BANK_LABELS[answer.bank],
                answer.tema,
                NIVEL_LABELS[answer.nivel],
                answer.question,
                answer.userAnswer,
                answer.correctAnswer,
                answer.isCorrect ? 'Acierto' : answer.timedOut ? 'Tiempo agotado' : 'Fallo',
                answer.reference
            ].map(escape).join(';')
        )
    );

    // BOM para que Excel abra las tildes correctamente.
    return '﻿' + [header.map(escape).join(';'), ...rows].join('\r\n');
}

export default function ReportScreen({ players }) {
    const [tab, setTab] = useState('personas');

    const ranking = useMemo(() => [...players].sort((a, b) => b.money - a.money), [players]);
    const failedRanking = useMemo(() => buildFailedRanking(players), [players]);
    const topicStats = useMemo(() => buildTopicStats(players), [players]);

    const totalAnswers = players.reduce((sum, p) => sum + p.answers.length, 0);
    const totalHits = players.reduce(
        (sum, p) => sum + p.answers.filter((a) => a.isCorrect).length,
        0
    );

    const downloadCsv = () => {
        const blob = new Blob([toCsv(players)], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'informe_evaluacion_semestral.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="game-container report-screen">
            <h1 className="text-gradient">Informe final</h1>

            <p className="report-summary">
                {players.length} participantes · {totalHits} aciertos de {totalAnswers} preguntas (
                {Math.round((totalHits / totalAnswers) * 100)}%)
            </p>

            <div className="report-toolbar no-print">
                <button
                    className={tab === 'personas' ? 'tab active' : 'tab'}
                    onClick={() => setTab('personas')}
                >
                    Por persona
                </button>
                <button
                    className={tab === 'consolidado' ? 'tab active' : 'tab'}
                    onClick={() => setTab('consolidado')}
                >
                    Consolidado para retro
                </button>
                <button className="btn-secondary" onClick={downloadCsv}>
                    ⬇ Descargar Excel (CSV)
                </button>
                <button className="btn-secondary" onClick={() => window.print()}>
                    🖨 Imprimir / PDF
                </button>
            </div>

            <div className="report-section">
                <h2>🏆 Ranking</h2>
                <table className="report-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Nombre</th>
                            <th>Cargo</th>
                            <th>Aciertos</th>
                            <th>Dinero</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ranking.map((player, index) => (
                            <tr key={player.id}>
                                <td>{index + 1}</td>
                                <td>{player.name}</td>
                                <td className="muted">{CARGO_LABELS[player.cargo]}</td>
                                <td>
                                    {player.answers.filter((a) => a.isCorrect).length} /{' '}
                                    {player.answers.length}
                                </td>
                                <td className="money-cell">${player.money.toLocaleString('es-CO')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {tab === 'personas' && (
                <div className="print-block">
                    {players.map((player) => {
                        const hits = player.answers.filter((a) => a.isCorrect);
                        const misses = player.answers.filter((a) => !a.isCorrect);

                        return (
                            <div key={player.id} className="report-section person-block">
                                <div className="person-header">
                                    <h2>{player.name}</h2>
                                    <span className="muted">
                                        {CARGO_LABELS[player.cargo]} · {hits.length}/
                                        {player.answers.length} aciertos · $
                                        {player.money.toLocaleString('es-CO')}
                                    </span>
                                </div>

                                <h4 className="ok-title">✅ Acertó ({hits.length})</h4>
                                {hits.length > 0 ? (
                                    <ul className="answer-list">
                                        {hits.map((a) => (
                                            <li key={a.questionId}>
                                                <span className="q-meta">
                                                    {BANK_LABELS[a.bank]} · {a.tema} ·{' '}
                                                    {NIVEL_LABELS[a.nivel]}
                                                </span>
                                                <span className="q-text">{a.question}</span>
                                                <span className="ok-answer">{a.correctAnswer}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="muted">Ninguna.</p>
                                )}

                                <h4 className="fail-title">❌ Falló ({misses.length})</h4>
                                {misses.length > 0 ? (
                                    <ul className="answer-list">
                                        {misses.map((a) => (
                                            <li key={a.questionId}>
                                                <span className="q-meta">
                                                    {BANK_LABELS[a.bank]} · {a.tema} ·{' '}
                                                    {NIVEL_LABELS[a.nivel]}
                                                </span>
                                                <span className="q-text">{a.question}</span>
                                                <span className="bad-answer">
                                                    Respondió: {a.userAnswer}
                                                </span>
                                                <span className="ok-answer">
                                                    Correcta: {a.correctAnswer}
                                                </span>
                                                <span className="q-ref">{a.reference}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="perfect-score">¡Turno perfecto!</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {tab === 'consolidado' && (
                <div className="print-block">
                    <div className="report-section">
                        <h2>🔁 Preguntas para repasar entre todos</h2>
                        <p className="muted">
                            Ordenadas por número de personas que las fallaron. Estas son las que dan
                            tema de conversación en la retro.
                        </p>
                        {failedRanking.length === 0 ? (
                            <p className="perfect-score">Nadie falló ninguna pregunta.</p>
                        ) : (
                            <ul className="answer-list">
                                {failedRanking.map((a) => (
                                    <li key={a.questionId}>
                                        <span className="q-meta">
                                            {BANK_LABELS[a.bank]} · {a.tema} · {NIVEL_LABELS[a.nivel]} ·
                                            fallada por {a.whoFailed.length}{' '}
                                            {a.whoFailed.length === 1 ? 'persona' : 'personas'}
                                        </span>
                                        <span className="q-text">{a.question}</span>
                                        <span className="ok-answer">Correcta: {a.correctAnswer}</span>
                                        <span className="q-ref">{a.reference}</span>
                                        <span className="who-failed">{a.whoFailed.join(', ')}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="report-section">
                        <h2>📊 Desempeño por tema</h2>
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Tema</th>
                                    <th>Aciertos</th>
                                    <th>%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topicStats.map((row) => (
                                    <tr key={row.key}>
                                        <td>{row.key}</td>
                                        <td>
                                            {row.hits} / {row.total}
                                        </td>
                                        <td
                                            className={
                                                row.hits / row.total < 0.6 ? 'pct-bad' : 'pct-ok'
                                            }
                                        >
                                            {Math.round((row.hits / row.total) * 100)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <button
                className="btn-primary no-print"
                onClick={() => window.location.reload()}
                style={{ marginTop: '20px' }}
            >
                Nuevo torneo
            </button>

            <style>{`
                .report-screen {
                    max-width: 1000px;
                    overflow-y: auto;
                    max-height: 95vh;
                    padding-bottom: 50px;
                }
                .report-summary {
                    text-align: center;
                    color: #ddd;
                    margin-bottom: 15px;
                }
                .report-toolbar {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    justify-content: center;
                    margin-bottom: 20px;
                }
                .report-toolbar .tab {
                    background: rgba(255, 255, 255, 0.08);
                    color: #fff;
                    border: 1px solid rgba(255, 255, 255, 0.25);
                    border-radius: 20px;
                    padding: 8px 18px;
                    cursor: pointer;
                }
                .report-toolbar .tab.active {
                    background: #ffd700;
                    color: #111;
                    font-weight: bold;
                }
                .report-section {
                    background: rgba(0, 0, 0, 0.6);
                    padding: 20px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                }
                .report-table {
                    width: 100%;
                    border-collapse: collapse;
                    color: white;
                }
                .report-table th, .report-table td {
                    padding: 10px;
                    text-align: left;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                }
                .report-table th {
                    background-color: rgba(255, 255, 255, 0.1);
                    color: #ffd700;
                }
                .money-cell { color: #4caf50; font-weight: bold; }
                .muted { color: #aaa; font-size: 0.9em; }
                .person-header {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: baseline;
                    justify-content: space-between;
                    gap: 8px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                    padding-bottom: 8px;
                    margin-bottom: 10px;
                }
                .person-header h2 { margin: 0; color: #ffd700; }
                .ok-title { color: #4caf50; margin-bottom: 6px; }
                .fail-title { color: #ff6b6b; margin-bottom: 6px; }
                .answer-list { list-style: none; padding-left: 0; margin: 0; }
                .answer-list li {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    padding: 8px 0;
                    border-bottom: 1px dashed rgba(255, 255, 255, 0.15);
                }
                .q-meta { color: #9fd8ff; font-size: 0.78em; text-transform: uppercase; letter-spacing: 0.03em; }
                .q-text { color: #fff; }
                .ok-answer { color: #88ff88; font-size: 0.9em; }
                .bad-answer { color: #ff9c9c; font-size: 0.9em; }
                .q-ref { color: #999; font-size: 0.8em; font-style: italic; }
                .who-failed { color: #ffd700; font-size: 0.82em; }
                .perfect-score { color: #4caf50; font-style: italic; }
                .pct-bad { color: #ff6b6b; font-weight: bold; }
                .pct-ok { color: #4caf50; }

                @media print {
                    .no-print { display: none !important; }
                    .report-screen { max-height: none; overflow: visible; color: #000; }
                    .report-section { background: #fff; color: #000; }
                    .q-text, .report-table { color: #000; }
                }
            `}</style>
        </div>
    );
}
