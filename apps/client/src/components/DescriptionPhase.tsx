import React, { useState } from 'react';
import { GameState } from '../App';

interface Props {
  gameState: GameState;
  mySessionId: string;
  onDescribe: (description: string) => void;
}

export default function DescriptionPhase({ gameState, mySessionId, onDescribe }: Props) {
  const [input, setInput] = useState('');
  const isMyTurn = gameState.currentPlayerId === mySessionId;
  const currentPlayer = gameState.players[gameState.currentPlayerId];
  const me = gameState.players[mySessionId];
  const players = Object.entries(gameState.players).filter(([, p]) => !p.isEliminated);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    onDescribe(input.trim());
    setInput('');
  }

  return (
    <div className="screen">
      <div className="header">
        <span className="label">Round {gameState.round} — Description Phase</span>
        <span className="muted" style={{ fontSize: 12 }}>
          {players.filter(([, p]) => p.hasDescribed).length}/{players.length} described
        </span>
      </div>

      <div className="descriptions-list">
        {players.map(([id, player]) => (
          <div key={id} className={`description-row ${id === mySessionId ? 'mine' : ''}`}>
            <span className="player-name">
              {player.username}
              {id === mySessionId && <span className="badge">You</span>}
            </span>
            {player.hasDescribed ? (
              <span className="description-text">"{player.description}"</span>
            ) : id === gameState.currentPlayerId ? (
              <span className="muted typing">typing...</span>
            ) : (
              <span className="muted">—</span>
            )}
          </div>
        ))}
      </div>

      <div className="input-area">
        {isMyTurn && !me?.hasDescribed ? (
          <form onSubmit={handleSubmit} className="describe-form">
            <p className="label" style={{ marginBottom: 8 }}>Your turn! Give one description:</p>
            <div className="input-row">
              <input
                className="text-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="One word or short phrase..."
                maxLength={80}
                autoFocus
              />
              <button className="btn-primary" type="submit" disabled={!input.trim()}>
                Send
              </button>
            </div>
          </form>
        ) : (
          <p className="muted center-text">
            {me?.hasDescribed
              ? 'Waiting for others...'
              : `Waiting for ${currentPlayer?.username ?? ''}...`}
          </p>
        )}
      </div>
    </div>
  );
}
