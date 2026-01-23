import { useState, useEffect } from 'react';

export default function QuestionCard({ question, onAnswer, timeLimit = 60 }) {
    const [selectedOption, setSelectedOption] = useState(null);
    const [revealed, setRevealed] = useState(false);
    const [timeLeft, setTimeLeft] = useState(timeLimit);

    // Reset state when question changes
    useEffect(() => {
        setSelectedOption(null);
        setRevealed(false);
        setTimeLeft(timeLimit);
    }, [question, timeLimit]);

    // Timer Logic
    useEffect(() => {
        if (revealed || timeLeft === 0) return;

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
    }, [revealed, timeLeft]);

    const handleTimeOut = () => {
        setRevealed(true);
        onAnswer(null, true); // null index, true for timeout
    };

    const handleOptionClick = (index) => {
        if (revealed) return; // Prevent clicking after answered

        setSelectedOption(index);
        setRevealed(true);
        onAnswer(index, false);
    };

    const getOptionClass = (index) => {
        let baseClass = "answer-option-shape";

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
            <div className="timer-container">
                <div className="timer-display" style={{
                    color: getTimerColor(),
                    textAlign: 'center',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    textShadow: '0 0 10px rgba(0,0,0,0.8)'
                }}>
                    ⏱ {timeLeft}s
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
                        disabled={revealed}
                    >
                        <span className="option-letter">{letters[index]}:</span>
                        <span className="option-text">{option}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
