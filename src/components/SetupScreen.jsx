import { useState } from 'react';

export default function SetupScreen({ onStartGame }) {
    // Initial state for 10 teams, each with 2 members
    const [teams, setTeams] = useState(
        Array.from({ length: 10 }, (_, i) => ({
            id: i,
            name1: '',
            name2: '',
        }))
    );

    const handleInputChange = (index, field, value) => {
        const newTeams = [...teams];
        newTeams[index][field] = value;
        setTeams(newTeams);
    };

    const handleStart = () => {
        // Validate all fields are filled
        const allFilled = teams.every(team => team.name1.trim() !== '' && team.name2.trim() !== '');

        if (allFilled) {
            onStartGame(teams);
        } else {
            alert('Por favor, ingresa los nombres de todos los integrantes de los 10 equipos.');
        }
    };

    // Helper to auto-fill for testing/demo purposes
    const fillDummyData = () => {
        const newTeams = teams.map((t, i) => ({
            ...t,
            name1: `Jugador ${i * 2 + 1}`,
            name2: `Jugador ${i * 2 + 2}`
        }));
        setTeams(newTeams);
    };

    return (
        <div className="game-container setup-screen">
            <h1 className="text-gradient">Registro de Equipos</h1>
            <p style={{ textAlign: 'center', marginBottom: '20px' }}>
                Ingresa los nombres de los 2 integrantes por cada grupo.
            </p>

            <div className="teams-grid">
                {teams.map((team, index) => (
                    <div key={team.id} className="team-input-card">
                        <h3>Grupo {index + 1}</h3>
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Integrante 1"
                                value={team.name1}
                                onChange={(e) => handleInputChange(index, 'name1', e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Integrante 2"
                                value={team.name2}
                                onChange={(e) => handleInputChange(index, 'name2', e.target.value)}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="setup-actions">
                <button className="btn-secondary" onClick={fillDummyData} style={{ marginRight: '10px' }}>
                    (Demo) Llenar Auto
                </button>
                <button className="btn-primary" onClick={handleStart}>
                    Comenzar Juego
                </button>
            </div>

            <style>{`
                .setup-screen {
                    max-width: 1000px;
                    overflow-y: auto;
                    max-height: 90vh;
                    padding-bottom: 50px;
                }
                .teams-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }
                .team-input-card {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                .team-input-card h3 {
                    margin-top: 5px;
                    margin-bottom: 10px;
                    color: #ffd700;
                }
                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .input-group input {
                    padding: 8px;
                    border-radius: 5px;
                    border: none;
                    background: rgba(0, 0, 0, 0.5);
                    color: white;
                }
                .setup-actions {
                    text-align: center;
                    margin-top: 20px;
                }
            `}</style>
        </div>
    );
}
