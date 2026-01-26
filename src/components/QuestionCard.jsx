import { useState, useEffect } from 'react';

export default function QuestionCard({ question, onAnswer, timeLimit = 60, lifelines, onUseLifeline }) {
    const [selectedOption, setSelectedOption] = useState(null);
    const [revealed, setRevealed] = useState(false);
    const [timeLeft, setTimeLeft] = useState(timeLimit);

    // Lifeline States
    const [hiddenOptions, setHiddenOptions] = useState([]); // indices to hide
    const [isPaused, setIsPaused] = useState(false);
    const [activeModal, setActiveModal] = useState(null); // 'audience', 'friend', null

    // Reset state when question changes
    useEffect(() => {
        setSelectedOption(null);
        setRevealed(false);
        setTimeLeft(timeLimit);
        setHiddenOptions([]);
        setIsPaused(false);
        setActiveModal(null);
    }, [question, timeLimit]);

    // Timer Logic
    useEffect(() => {
        if (revealed || timeLeft === 0 || isPaused) return;

        const timerId = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerId);
                    handleTimeOut();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, [revealed, timeLeft, isPaused]);

    const handleTimeOut = () => {
        setRevealed(true);
        onAnswer(null, true); // null index, true for timeout
    };

    const handleOptionClick = (index) => {
        if (revealed || hiddenOptions.includes(index) || isPaused) return; // Prevent clicking if hidden or paused

        setSelectedOption(index);
        setRevealed(true);
        onAnswer(index, false);
    };

    // Lifeline Handlers
    const handleUse5050 = () => {
        if (!lifelines.fiftyFifty || revealed) return;

        // Find wrong answers
        const wrongIndices = question.options
            .map((_, idx) => idx)
            .filter(idx => idx !== question.answer);

        // Shuffle and pick 2 to hide
        const shuffled = wrongIndices.sort(() => 0.5 - Math.random());
        const toHide = shuffled.slice(0, 2);

        setHiddenOptions(toHide);
        onUseLifeline('fiftyFifty');
    };

    const handleAudience = () => {
        if (!lifelines.audience || revealed) return;
        setIsPaused(true);
        setActiveModal('audience');
        onUseLifeline('audience');
    };

    const handleFriend = () => {
        if (!lifelines.friend || revealed) return;
        setIsPaused(true);
        setActiveModal('friend');
        onUseLifeline('friend');
    };

    const resumeGame = () => {
        setIsPaused(false);
        setActiveModal(null);
    };

    const getOptionClass = (index) => {
        let baseClass = "answer-option-shape";

        // Logic for hidden options
        if (hiddenOptions.includes(index)) {
            return `${baseClass} hidden-option`; // You might need to add CSS for this
        }

        if (!revealed) {
            if (selectedOption === index) return `${baseClass} selected`;
            return baseClass;
        }

        // Revealed state
        if (index === question.answer) {
            return `${baseClass} correct`; // Always show correct answer green
        }

        if (selectedOption === index && index !== question.answer) {
            return `${baseClass} wrong`; // Show selected wrong answer red
        }

        return baseClass;
    };

    // Letters A, B, C, D
    const letters = ['A', 'B', 'C', 'D'];

    // Timer Color
    const getTimerColor = () => {
        if (timeLeft > 30) return '#4caf50'; // Green
        if (timeLeft > 10) return '#ff9d00'; // Orange
        return '#f00'; // Red
    };

    const progressPercentage = (timeLeft / timeLimit) * 100;

    return (
        <div className="question-area">
            {/* Lifelines Bar */}
            <div className="lifelines-container" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', justifyContent: 'center' }}>
                <button
                    className={`btn-lifeline ${!lifelines?.fiftyFifty ? 'used' : ''}`}
                    onClick={handleUse5050}
                    disabled={!lifelines?.fiftyFifty || revealed}
                    title="50/50: Elimina 2 respuestas incorrectas"
                >
                    50:50
                </button>
                <button
                    className={`btn-lifeline ${!lifelines?.audience ? 'used' : ''}`}
                    onClick={handleAudience}
                    disabled={!lifelines?.audience || revealed}
                    title="Ayuda del Público: Pausa el juego"
                >
                    👥 Público
                </button>
                <button
                    className={`btn-lifeline ${!lifelines?.friend ? 'used' : ''}`}
                    onClick={handleFriend}
                    disabled={!lifelines?.friend || revealed}
                    title="Llamada a un Amigo: Pausa el juego"
                >
                    📞 Amigo
                </button>
            </div>

            <div className="timer-container">
                <div className="timer-display" style={{
                    color: getTimerColor(),
                    textAlign: 'center',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    textShadow: '0 0 10px rgba(0,0,0,0.8)'
                }}>
                    ⏱ {timeLeft}s {isPaused && <span style={{ color: '#ffdd00', fontSize: '1rem' }}>(PAUSADO)</span>}
                </div>
                <div className="timer-progress-bar">
                    <div
                        className="timer-progress-fill"
                        style={{
                            width: `${progressPercentage}%`,
                            backgroundColor: getTimerColor()
                        }}
                    ></div>
                </div>
            </div>

            <div className="question-box-shape">
                <h2 className="question-text">{question.question}</h2>
            </div>

            <div className="options-grid">
                {question.options.map((option, index) => (
                    <button
                        key={index}
                        className={getOptionClass(index)}
                        onClick={() => handleOptionClick(index)}
                        disabled={revealed || hiddenOptions.includes(index) || isPaused}
                        style={{ visibility: hiddenOptions.includes(index) ? 'hidden' : 'visible' }}
                    >
                        <span className="option-letter">{letters[index]}:</span>
                        <span className="option-text">{option}</span>
                    </button>
                ))}
            </div>

            {/* Modals */}
            {activeModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000
                }}>
                    <div className="modal-content" style={{
                        background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
                        padding: '2rem',
                        borderRadius: '20px',
                        border: '2px solid #00bcd4',
                        textAlign: 'center',
                        maxWidth: '500px',
                        color: 'white',
                        boxShadow: '0 0 30px rgba(0, 188, 212, 0.5)'
                    }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#ffeb3b' }}>
                            {activeModal === 'audience' ? '👥 Ayuda del Público' : '📞 Llamada a un Amigo'}
                        </h2>
                        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
                            {activeModal === 'audience'
                                ? 'El público está votando... (Simulado). Puedes usar este tiempo para consultar con la audiencia.'
                                : 'Tienes tiempo para llamar a tu amigo y pedir ayuda.'}
                        </p>
                        <div style={{ fontSize: '3rem', marginBottom: '2rem' }}>
                            {activeModal === 'audience' ? '📊' : '📱'}
                        </div>
                        <button
                            className="btn-primary"
                            onClick={resumeGame}
                            style={{ fontSize: '1.2rem', padding: '10px 30px' }}
                        >
                            Continuar Juego
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
