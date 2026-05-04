import React, { useState } from 'react';
import { GameState } from '../App';

interface Props {
  gameState: GameState;
  mySessionId: string;
  onVote: (targetId: string) => void;
}

export default function VotingPhase({ gameState, mySessionId, onVote }: Props) {
  const [voted, setVoted] = useState('');
  const me = gameState.players[mySessionId];
  const players = Object.entries(gameState.players).filter(([, p]) => !p.isEliminated);

  function handleVote(targetId: string) {
    if (voted || me?.isEliminated) return;
    setVoted(targetId);
    onVote(targetId);
  }

  return (
    <div className="screen">
      <div className="header">
        <span className="label">Round {gameState.round} — Vote to Eliminate</span>
        <span className="muted" style={{ fontSize: 12 }}>
          Vote for who you think is the Undercover!
        </span>
      </div>

      <div className="vote-list">
        {players.map(([id, player]) => (
          <div key={id} className="vote-card" style={{ borderLeft: `3px solid ${player.color}` }}>
            <div className="vote-info">
              <span className="player-name">
                {player.username}
                {id === mySessionId && <span className="badge">You</span>}
              </span>
              <span className="description-text">"{player.description}"</span>
            </div>
            {id !== mySessionId && (
              <button
                className={`btn-vote ${voted === id ? 'selected' : ''}`}
                onClick={() => handleVote(id)}
                disabled={!!voted}
              >
                {voted === id ? '✓ Voted' : 'Vote'}
              </button>
            )}
          </div>
        ))}
      </div>

      {voted && (
        <p className="muted center-text" style={{ padding: 16 }}>
          Waiting for others to vote...
        </p>
      )}
    </div>
  );
}
