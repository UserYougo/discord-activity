import React from 'react';
import { GameState } from '../App';

interface Props {
  gameState: GameState;
  mySessionId: string;
  onStart: () => void;
}

export default function Lobby({ gameState, mySessionId, onStart }: Props) {
  const players = Object.entries(gameState.players);
  const me = gameState.players[mySessionId];
  const isHost = me?.isHost;
  const canStart = players.length >= 1;

  return (
    <div className="screen center">
      <div className="card" style={{ width: '100%', maxWidth: 400 }}>
        <h1 className="title">🕵️ Undercover</h1>
        <p className="muted" style={{ marginBottom: 24 }}>
          A social deduction word game
        </p>

        <div className="player-list">
          <p className="label">Players ({players.length}/10)</p>
          {players.map(([id, player]) => (
            <div key={id} className="player-row">
              <span className="player-name">
                {player.username}
                {id === mySessionId && <span className="badge">You</span>}
                {player.isHost && <span className="badge host">Host</span>}
              </span>
            </div>
          ))}
        </div>

        {isHost ? (
          <div style={{ marginTop: 24 }}>
            <button className="btn-primary" onClick={onStart}>
              Start Game
            </button>
          </div>
        ) : (
          <p className="muted" style={{ marginTop: 24 }}>
            Waiting for host to start...
          </p>
        )}
      </div>
    </div>
  );
}
