import { useState, useEffect } from 'react';
import QuestionCard from './QuestionCard';
import SetupScreen from './SetupScreen';
import ReportScreen from './ReportScreen';
import { MONEY_PER_QUESTION, SECONDS_PER_QUESTION, CARGO_LABELS } from '../data/assignQuestions';

const FEEDBACK_DELAY = 4000;

function AudioToggle({ enabled, onToggle }) {
    return (
        <button
            onClick={onToggle}
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 1000,
                background: enabled ? '#0f0' : '#f00',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
                fontSize: '20px'
            }}
            title={enabled ? 'Desactivar Audio' : 'Activar Audio'}
        >
            {enabled ? '🎵' : '🔇'}
        </button>
    );
}

export default function Game() {
    // 'setup' | 'playing' | 'intermission' | 'report'
    const [gameState, setGameState] = useState('setup');
    const [players, setPlayers] = useState([]);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [questionKey, setQuestionKey] = useState(0);
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);

    // El roster llega con su kit y sus preguntas ya asignadas.
    const handleStartGame = (roster) => {
        setPlayers(
            roster.map((person) => ({
                ...person,
                money: 0,
                answers: [],
                lifelines: { fiftyFifty: true, audience: true, friend: true }
            }))
        );
        setCurrentPlayerIndex(0);
        setQuestionIndex(0);
        setQuestionKey((k) => k + 1);
        setGameState('playing');
    };

    const handleNextPlayer = () => {
        setCurrentPlayerIndex((prev) => prev + 1);
        setQuestionIndex(0);
        setQuestionKey((k) => k + 1);
        setGameState('playing');
    };

    const handleUseLifeline = (lifelineType) => {
        setPlayers((prev) =>
            prev.map((player, idx) =>
                idx === currentPlayerIndex
                    ? { ...player, lifelines: { ...player.lifelines, [lifelineType]: false } }
                    : player
            )
        );
    };

    const handleAnswer = (selectedIndex, isTimeOut = false) => {
        const question = players[currentPlayerIndex].questions[questionIndex];
        const isCorrect = !isTimeOut && selectedIndex === question.answer;

        const record = {
            questionId: question.id,
            question: question.question,
            bank: question.bank,
            tema: question.tema,
            nivel: question.nivel,
            reference: question.reference,
            correctAnswer: question.options[question.answer],
            userAnswer: isTimeOut ? 'Tiempo agotado' : question.options[selectedIndex],
            isCorrect,
            timedOut: isTimeOut
        };

        setPlayers((prev) =>
            prev.map((player, idx) =>
                idx === currentPlayerIndex
                    ? {
                          ...player,
                          money: player.money + (isCorrect ? MONEY_PER_QUESTION : 0),
                          answers: [...player.answers, record]
                      }
                    : player
            )
        );
        playSound(isCorrect ? 'correct' : 'wrong');

        const isLastQuestion = questionIndex >= players[currentPlayerIndex].questions.length - 1;
        const isLastPlayer = currentPlayerIndex >= players.length - 1;

        setTimeout(() => {
            if (!isLastQuestion) {
                setQuestionIndex((prev) => prev + 1);
                setQuestionKey((k) => k + 1);
            } else {
                setGameState(isLastPlayer ? 'report' : 'intermission');
            }
        }, FEEDBACK_DELAY);
    };

    const playSound = (type, loop = false) => {
        if (!isAudioEnabled) return;

        const sounds = {
            intro: '/sounds/main_theme.mp3',
            thinking: '/sounds/thinking.mp3',
            correct: '/sounds/correct.mp3',
            wrong: '/sounds/wrong.mp3',
            win: '/sounds/win.mp3',
            intermission: '/sounds/intermission.mp3'
        };

        const path = sounds[type];
        if (!path) return;

        const audio = new Audio(path);
        audio.loop = loop;
        audio.play().catch((e) => console.log('Audio play failed:', e));
        return audio;
    };

    const toggleAudio = () => setIsAudioEnabled((prev) => !prev);
    const audioToggle = <AudioToggle enabled={isAudioEnabled} onToggle={toggleAudio} />;

    useEffect(() => {
        let bgm = null;

        if (isAudioEnabled) {
            if (gameState === 'setup') {
                bgm = playSound('intro', true);
            } else if (gameState === 'playing') {
                bgm = playSound('thinking', true);
            }
        }

        return () => {
            if (bgm) {
                bgm.pause();
                bgm.currentTime = 0;
            }
        };
    }, [gameState, isAudioEnabled]);

    if (gameState === 'setup') {
        return (
            <>
                {audioToggle}
                <SetupScreen onStartGame={handleStartGame} />
            </>
        );
    }

    if (gameState === 'report') {
        return (
            <>
                {audioToggle}
                <ReportScreen players={players} />
            </>
        );
    }

    if (gameState === 'intermission') {
        const finished = players[currentPlayerIndex];
        const next = players[currentPlayerIndex + 1];
        const hits = finished.answers.filter((a) => a.isCorrect).length;

        return (
            <div className="game-container">
                {audioToggle}
                <div className="main-stage">
                    <div className="question-box-shape summary-screen">
                        <h2 className="text-gradient">¡Turno finalizado!</h2>
                        <div style={{ margin: '2rem 0' }}>
                            <p style={{ fontSize: '1.5rem' }}>
                                <span style={{ color: '#ffd700' }}>{finished.name}</span>
                            </p>
                            <p style={{ color: '#aaa', marginTop: '0.25rem' }}>
                                {CARGO_LABELS[finished.cargo]}
                            </p>
                            <p style={{ fontSize: '1.2rem', marginTop: '1rem' }}>
                                Acertó <span style={{ color: '#0f0' }}>{hits}</span> de{' '}
                                {finished.answers.length}
                            </p>
                            <p style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>
                                Dinero acumulado:{' '}
                                <span style={{ color: '#0f0' }}>
                                    ${finished.money.toLocaleString('es-CO')}
                                </span>
                            </p>
                        </div>

                        <div style={{ borderTop: '1px solid #555', padding: '2rem 0', marginTop: '2rem' }}>
                            <p style={{ marginBottom: '1rem', color: '#aaa' }}>Siguiente en participar:</p>
                            <h3 style={{ fontSize: '2rem', margin: '0 0 0.25rem 0' }}>{next.name}</h3>
                            <p style={{ color: '#aaa', marginBottom: '2rem' }}>{CARGO_LABELS[next.cargo]}</p>
                            <button className="btn-primary" onClick={handleNextPlayer}>
                                Iniciar turno de {next.name.split(' ')[0]}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentPlayer = players[currentPlayerIndex];
    const currentQuestion = currentPlayer.questions[questionIndex];

    if (!currentQuestion) {
        return (
            <div className="game-container">
                <h1>Error: no se pudo asignar la pregunta {questionIndex + 1} de {currentPlayer.name}.</h1>
            </div>
        );
    }

    return (
        <div className="game-container">
            {audioToggle}
            <div className="header-info">
                <div className="logo-small">Torneo Millonario</div>
                <div className="team-info-display">
                    <span className="team-label">
                        Jugador {currentPlayerIndex + 1}/{players.length}:
                    </span>
                    <span className="team-names">{currentPlayer.name}</span>
                </div>
                <div className="money-display current-money">
                    ${currentPlayer.money.toLocaleString('es-CO')}
                </div>
            </div>

            <div className="main-stage">
                <div className="question-counter">
                    Pregunta {questionIndex + 1} de {currentPlayer.questions.length}
                </div>
            </div>

            <QuestionCard
                key={questionKey}
                question={currentQuestion}
                onAnswer={handleAnswer}
                timeLimit={SECONDS_PER_QUESTION}
                lifelines={currentPlayer.lifelines}
                onUseLifeline={handleUseLifeline}
            />
        </div>
    );
}
