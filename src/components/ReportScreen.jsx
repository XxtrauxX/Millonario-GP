import React from 'react';

export default function ReportScreen({ teams }) {
    // Sort teams by money (descending)
    const sortedTeams = [...teams].sort((a, b) => b.money - a.money);

    return (
        <div className="game-container report-screen">
            <h1 className="text-gradient">Reporte Final</h1>

            <div className="report-section">
                <h2>🏆 Ranking de Ganadores</h2>
                <table className="report-table">
                    <thead>
                        <tr>
                            <th>Posición</th>
                            <th>Equipo</th>
                            <th>Integrantes</th>
                            <th>Dinero Ganado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTeams.map((team, index) => (
                            <tr key={team.id}>
                                <td>{index + 1}</td>
                                <td>Grupo {team.id + 1}</td>
                                <td>{team.name1} & {team.name2}</td>
                                <td className="money-cell">${team.money.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="report-section">
                <h2>❌ Preguntas Falladas</h2>
                <div className="failed-questions-list">
                    {teams.map((team) => (
                        <div key={team.id} className="team-failures">
                            <h3>Grupo {team.id + 1}: {team.name1} & {team.name2}</h3>
                            {team.failedQuestions && team.failedQuestions.length > 0 ? (
                                <ul>
                                    {team.failedQuestions.map((fq, idx) => (
                                        <li key={idx}>
                                            <span className="failed-q-text">"{fq.question}"</span>
                                            <br />
                                            <span className="correct-answer">Respuesta correcta: {fq.correctAnswer}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="perfect-score">¡Juego Perfecto! Ninguna pregunta fallada.</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <button className="btn-primary" onClick={() => window.location.reload()} style={{ marginTop: '20px' }}>
                Nuevo Torneo
            </button>

            <style>{`
                .report-screen {
                    max-width: 1000px;
                    overflow-y: auto;
                    max-height: 90vh;
                    padding-bottom: 50px;
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
                .money-cell {
                    color: #4caf50;
                    font-weight: bold;
                }
                .failed-questions-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 15px;
                }
                .team-failures {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 10px;
                    border-radius: 8px;
                }
                .team-failures h3 {
                    margin-top: 0;
                    font-size: 1.1em;
                    color: #ff6b6b;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    padding-bottom: 5px;
                }
                .team-failures ul {
                    list-style-type: none;
                    padding-left: 0;
                }
                .team-failures li {
                    margin-bottom: 10px;
                    font-size: 0.9em;
                    border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
                    padding-bottom: 5px;
                }
                .correct-answer {
                    color: #88ff88;
                    font-size: 0.85em;
                }
                .perfect-score {
                    color: #4caf50;
                    font-style: italic;
                }
            `}</style>
        </div>
    );
}
