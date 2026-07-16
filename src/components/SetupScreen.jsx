import { useState } from 'react';
import participantsData from '../data/participants.json';
import { QUESTIONS_PER_PLAYER, SECONDS_PER_QUESTION, buildLineup } from '../data/assignQuestions';

export default function SetupScreen({ onStartGame }) {
    const [order, setOrder] = useState([]);
    const [excluded, setExcluded] = useState(() => new Set());

    const loadParticipants = () => setOrder(buildLineup(participantsData));

    const toggle = (id) => {
        setExcluded((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const roster = order.filter((p) => !excluded.has(p.id));
    const turnOf = new Map(roster.map((person, index) => [person.id, index + 1]));

    const handleStart = () => {
        if (roster.length === 0) {
            alert('Selecciona al menos una persona para jugar.');
            return;
        }
        onStartGame(roster);
    };

    return (
        <div className="game-container setup-screen">
            <h1 className="text-gradient">Evaluación semestral 2026</h1>
            <p className="setup-intro">
                Juega una persona a la vez, en el orden de la lista. Cada participante responde{' '}
                <strong>{QUESTIONS_PER_PLAYER} preguntas</strong> y cuenta con{' '}
                <strong>{SECONDS_PER_QUESTION} segundos</strong> por cada una.
            </p>

            {order.length === 0 ? (
                <div className="empty-roster">
                    <p>Carga los participantes para definir el orden de juego.</p>
                </div>
            ) : (
                <div className="roster-grid">
                    {order.map((person) => (
                        <label
                            key={person.id}
                            className={`roster-card ${excluded.has(person.id) ? 'excluded' : ''}`}
                        >
                            <input
                                type="checkbox"
                                checked={!excluded.has(person.id)}
                                onChange={() => toggle(person.id)}
                            />
                            <span className="roster-turn">{turnOf.get(person.id) ?? '–'}</span>
                            <span className="roster-name">{person.name}</span>
                        </label>
                    ))}
                </div>
            )}

            <div className="setup-actions">
                {order.length > 0 && (
                    <p className="roster-count">
                        Participan <strong>{roster.length}</strong> de {participantsData.length} personas
                    </p>
                )}
                <button
                    className="btn-secondary"
                    onClick={loadParticipants}
                    style={{ marginRight: '10px' }}
                >
                    {order.length === 0 ? 'Cargar Participantes' : '🔀 Reordenar'}
                </button>
                <button className="btn-primary" onClick={handleStart} disabled={roster.length === 0}>
                    Comenzar Juego
                </button>
            </div>

            <style>{`
                .setup-screen {
                    max-width: 1000px;
                    overflow-y: auto;
                    max-height: 95vh;
                    padding-bottom: 50px;
                }
                .setup-intro {
                    text-align: center;
                    max-width: 720px;
                    margin: 0 auto 25px auto;
                    line-height: 1.6;
                    color: #ddd;
                }
                .empty-roster {
                    text-align: center;
                    color: #888;
                    font-style: italic;
                    padding: 40px 20px;
                    border: 1px dashed rgba(255, 255, 255, 0.2);
                    border-radius: 10px;
                }
                .roster-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 8px;
                }
                .roster-card {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    padding: 10px 12px;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: opacity 0.15s ease;
                }
                .roster-card.excluded {
                    opacity: 0.4;
                }
                .roster-card.excluded .roster-name {
                    text-decoration: line-through;
                }
                .roster-card input {
                    accent-color: #ffd700;
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                    flex-shrink: 0;
                }
                .roster-turn {
                    color: #ffd700;
                    font-weight: bold;
                    min-width: 22px;
                    text-align: right;
                    flex-shrink: 0;
                }
                .roster-name {
                    color: #fff;
                    flex: 1;
                }
                .setup-actions {
                    text-align: center;
                    margin-top: 20px;
                }
                .roster-count {
                    color: #aaa;
                    margin-bottom: 12px;
                }
            `}</style>
        </div>
    );
}
