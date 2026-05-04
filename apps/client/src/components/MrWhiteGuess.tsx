import React, { useState } from 'react';
import { GameState } from '../App';

interface Props {
  gameState: GameState;
  mySessionId: string;
  isMrWhite: boolean;
  onGuess: (guess: string) => void;
}

export default function MrWhiteGuess({ gameState, isMrWhite, onGuess }: Props) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const eliminated = gameState.players[gameState.lastEliminatedId];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setSubmitted(true);
    onGuess(input.trim());
  }

  return (
    <div className="screen center">
      <div className="card" style={{ textAlign: 'center', maxWidth: 380 }}>
        <h2 style={{ margin: '12px 0 4px' }}>Mr. White's Last Chance</h2>
        <p className="muted" style={{ marginBottom: 20 }}>
          {eliminated?.username} was eliminated as Mr. White.
          {isMrWhite ? " Guess the civilians' word to win!" : ' They get one guess...'}
        </p>

        {isMrWhite && !submitted ? (
          <form onSubmit={handleSubmit}>
            <input
              className="text-input"
              style={{ marginBottom: 12 }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What is the civilian word?"
              autoFocus
            />
            <button className="btn-primary" type="submit" disabled={!input.trim()}>
              Submit Guess
            </button>
          </form>
        ) : isMrWhite && submitted ? (
          <p className="muted">Guess submitted...</p>
        ) : (
          <p className="muted">Waiting for Mr. White's guess...</p>
        )}
      </div>
    </div>
  );
}
