import React, { useState } from 'react';
import { GameState } from '../App';

interface Props {
  gameState: GameState;
  mySessionId: string;
  myRole: string;
  myWord: string;
  onVote: (targetId: string) => void;
}

export default function VotingPhase({ gameState, mySessionId, myRole, myWord, onVote }: Props) {
  const [voted, setVoted] = useState('');
  const [peeking, setPeeking] = useState(false);

  const me = gameState.players[mySessionId];
  const players = Object.entries(gameState.players).filter(([, p]) => !p.isEliminated);

  function handleVote(targetId: string) {
    if (voted || me?.isEliminated) return;
    setVoted(targetId);
    onVote(targetId);
  }

  return (
    <div className="screen">
      <button className="peek-btn" onClick={() => setPeeking(true)}>👁 Peek</button>

      {peeking && (
        <div className="peek-overlay" onClick={() => setPeeking(false)}>
          <div className="peek-card" onClick={e => e.stopPropagation()}>
            {myRole === 'mrwhite' ? (
              <>
                <span className="peek-word-label">Your role</span>
                <span className="peek-word">🃏 Mr. White</span>
              </>
            ) : (
              <>
                <span className="peek-word-label">Your word</span>
                <span className="peek-word">{myWord}</span>
              </>
            )}
            <button className="peek-close" onClick={() => setPeeking(false)}>Got it</button>
          </div>
        </div>
      )}

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
