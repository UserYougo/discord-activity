import React from 'react';
import { GameState } from '../App';

interface Props {
  gameState: GameState;
}

const ROLE_COLORS: Record<string, string> = {
  civilian: '#57f287',
  undercover: '#ed4245',
  mrwhite: '#fee75c',
};

const ROLE_LABELS: Record<string, string> = {
  civilian: 'Civilian',
  undercover: 'Undercover',
  mrwhite: 'Mr. White',
};

export default function Elimination({ gameState }: Props) {
  const eliminated = gameState.players[gameState.lastEliminatedId];
  if (!eliminated) return null;

  const color = ROLE_COLORS[eliminated.role] ?? '#fff';
  const label = ROLE_LABELS[eliminated.role] ?? eliminated.role;

  return (
    <div className="screen center">
      <div className="card" style={{ textAlign: 'center', maxWidth: 360 }}>
        <p style={{ fontSize: 48, margin: 0 }}>🗳️</p>
        <h2 style={{ margin: '12px 0 4px' }}>{eliminated.username}</h2>
        <p className="muted" style={{ marginBottom: 16 }}>has been eliminated</p>
        <div className="word-box" style={{ color, borderColor: color }}>
          {label}
        </div>
        <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
          Next phase starting...
        </p>
      </div>
    </div>
  );
}
