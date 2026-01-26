import { useState, useEffect } from 'react';
import questionsData from '../data/questions.json';
import QuestionCard from './QuestionCard';
import SetupScreen from './SetupScreen';
import ReportScreen from './ReportScreen';

const QUESTIONS_PER_TEAM = 5;
const WIN_AMOUNT = 2000;
const MAX_MONEY = 10000;

export default function Game() {
    // Game States: 'setup', 'playing', 'report'
    const [gameState, setGameState] = useState('setup');
    const [teams, setTeams] = useState([]);
    const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
    const [teamQuestionIndex, setTeamQuestionIndex] = useState(0);
    const [questionsPool, setQuestionsPool] = useState([]);
    const [questionKey, setQuestionKey] = useState(0); // Force re-render of QuestionCard

    // Shuffle questions on mount (not strictly necessary here as we do it on start, but good practice)
    useEffect(() => {
        // ...
    }, []);

    const shuffleArray = (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    const handleStartGame = (registeredTeams) => {
        // Initialize teams with score 0, failed questions, and available lifelines
        const initializedTeams = registeredTeams.map(t => ({
            ...t,
            money: 0,
            failedQuestions: [],
            lifelines: {
                fiftyFifty: true,
                audience: true,
                friend: true
            }
        }));

        setTeams(initializedTeams);

        // We need 10 teams * 5 questions = 50 questions minimum.
        // Disable shuffling to ensure specific questions for specific teams (e.g. Q1-5 for Team 1)
        const questions = [...questionsData];
        setQuestionsPool(questions);

        setGameState('playing');
        setCurrentTeamIndex(0);
        setTeamQuestionIndex(0);
    };

    const handleNextTeam = () => {
        setCurrentTeamIndex(prev => prev + 1);
        setTeamQuestionIndex(0);
        setQuestionKey(prev => prev + 1);
        setGameState('playing');
    };

    const handleUseLifeline = (lifelineType) => {
        const updatedTeams = [...teams];
        updatedTeams[currentTeamIndex].lifelines[lifelineType] = false;
        setTeams(updatedTeams);
    };

    const handleAnswer = (selectedIndex, isTimeOut = false) => {
        const currentTeam = teams[currentTeamIndex];
        // Calculate global question index: (currentTeamIndex * 5) + teamQuestionIndex
        const globalQuestionIndex = (currentTeamIndex * QUESTIONS_PER_TEAM) + teamQuestionIndex;
        const currentQuestion = questionsPool[globalQuestionIndex];

        let isCorrect = false;

        // Logic
        if (!isTimeOut && selectedIndex === currentQuestion.answer) {
            isCorrect = true;
        }

        const updatedTeams = [...teams];
        if (isCorrect) {
            // Add money, capped at MAX_MONEY (though 5 * 2000 = 10000 exactly)
            updatedTeams[currentTeamIndex].money = Math.min(updatedTeams[currentTeamIndex].money + WIN_AMOUNT, MAX_MONEY);
            playSound('correct');
        } else {
            // Track failure
            updatedTeams[currentTeamIndex].failedQuestions.push({
                question: currentQuestion.question,
                correctAnswer: currentQuestion.options[currentQuestion.answer],
                userAnswer: isTimeOut ? 'Tiempo Agotado' : currentQuestion.options[selectedIndex]
            });
            playSound('wrong');
        }

        setTeams(updatedTeams);

        // Delay for visual feedback before moving on
        setTimeout(() => {
            if (teamQuestionIndex < QUESTIONS_PER_TEAM - 1) {
                // Next question for same team
                setTeamQuestionIndex(prev => prev + 1);
                setQuestionKey(prev => prev + 1);
            } else {
                // Team finished their turn
                if (currentTeamIndex < teams.length - 1) {
                    // Go to intermission before next team
                    setGameState('intermission');
                } else {
                    // All teams finished
                    setGameState('report');
                }
            }
        }, 1500);
    };

    // Audio State
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);

    // Audio System
    const playSound = (type, loop = false) => {
        if (!isAudioEnabled) return;

        const sounds = {
            'intro': '/sounds/main_theme.mp3',
            'thinking': '/sounds/thinking.mp3',
            'correct': '/sounds/correct.mp3',
            'wrong': '/sounds/wrong.mp3',
            'win': '/sounds/win.mp3',
            'intermission': '/sounds/intermission.mp3'
        };

        const path = sounds[type];
        if (!path) return;

        const audio = new Audio(path);
        audio.loop = loop;

        // Volume adjustments
        // Volume adjustments
        // if (type === 'thinking') audio.volume = 0.5;

        // Store reference to bgm if looping (basic implementation)
        // Note: For a robust system we'd track active audio instances, but this fits the current scope

        audio.play().catch(e => console.log("Audio play failed:", e));
        return audio;
    };

    // Toggle Audio
    const toggleAudio = () => {
        setIsAudioEnabled(prev => !prev);
    };

    // Background Music State
    useEffect(() => {
        let bgm = null;

        if (isAudioEnabled) {
            if (gameState === 'setup') {
                bgm = playSound('intro', true);
            } else if (gameState === 'playing') {
                bgm = playSound('thinking', true); // Use tension music for questions
            }
        }

        return () => {
            if (bgm) {
                bgm.pause();
                bgm.currentTime = 0;
            }
        };
    }, [gameState, isAudioEnabled]);

    // UI for Audio Toggle
    const AudioToggle = () => (
        <button
            onClick={toggleAudio}
            style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 1000,
                background: isAudioEnabled ? '#0f0' : '#f00',
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
            title={isAudioEnabled ? "Desactivar Audio" : "Activar Audio"}
        >
            {isAudioEnabled ? '🎵' : '🔇'}
        </button>
    );

    // Renders
    if (gameState === 'setup') {
        return (
            <>
                <AudioToggle />
                <SetupScreen onStartGame={handleStartGame} />
            </>
        );
    }

    if (gameState === 'report') {
        return (
            <>
                <AudioToggle />
                <ReportScreen teams={teams} />
            </>
        );
    }

    if (gameState === 'intermission') {
        const finishedTeam = teams[currentTeamIndex];
        const nextTeam = teams[currentTeamIndex + 1];

        return (
            <div className="game-container">
                <AudioToggle />
                <div className="main-stage">
                    <div className="question-box-shape summary-screen">
                        <h2 className="text-gradient">¡Turno Finalizado!</h2>
                        <div style={{ margin: '2rem 0' }}>
                            <p style={{ fontSize: '1.5rem' }}>
                                Equipo {finishedTeam.id + 1}: <span style={{ color: '#ffd700' }}>{finishedTeam.name1} & {finishedTeam.name2}</span>
                            </p>
                            <p style={{ fontSize: '1.2rem', marginTop: '1rem' }}>
                                Dinero Acumulado: <span style={{ color: '#0f0' }}>${finishedTeam.money.toLocaleString()}</span>
                            </p>
                        </div>

                        <div style={{ borderTop: '1px solid #555', padding: '2rem 0', marginTop: '2rem' }}>
                            <p style={{ marginBottom: '1rem', color: '#aaa' }}>Siguiente en participar:</p>
                            <h3 style={{ fontSize: '2rem', margin: '0 0 2rem 0' }}>
                                Equipo {nextTeam.id + 1}: {nextTeam.name1} & {nextTeam.name2}
                            </h3>
                            <button className="btn-primary" onClick={handleNextTeam}>
                                Iniciar Turno del Siguiente Equipo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Playing State
    const currentTeam = teams[currentTeamIndex];
    const globalQIdx = (currentTeamIndex * QUESTIONS_PER_TEAM) + teamQuestionIndex;
    const currentQuestion = questionsPool[globalQIdx];

    // Safety check if we run out of questions (though we shouldn't with 50+)
    if (!currentQuestion) {
        return <div className="game-container"><h1>Error: No hay suficientes preguntas para todos los equipos.</h1></div>;
    }

    return (
        <div className="game-container">
            <AudioToggle />
            <div className="header-info">
                <div className="logo-small">Torneo Millonario</div>
                <div className="team-info-display">
                    <span className="team-label">Equipo {currentTeam.id + 1}:</span>
                    <span className="team-names">{currentTeam.name1} & {currentTeam.name2}</span>
                </div>
                <div className="money-display current-money">
                    ${currentTeam.money.toLocaleString()}
                </div>
            </div>

            <div className="main-stage">
                <div className="question-counter">
                    Pregunta {teamQuestionIndex + 1} de {QUESTIONS_PER_TEAM}
                </div>
            </div>

            <QuestionCard
                key={questionKey} // Force reset on new question
                question={currentQuestion}
                onAnswer={handleAnswer}
                timeLimit={60} // 60 seconds per question
                lifelines={currentTeam.lifelines}
                onUseLifeline={handleUseLifeline}
            />
        </div>
    );
}
