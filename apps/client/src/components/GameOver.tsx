import React from 'react';
import { GameState, PlayerData } from '../App';

interface Props {
  gameState: GameState;
  mySessionId: string;
  me: PlayerData | undefined;
  onPlayAgain: () => void;
}

const WINNER_INFO: Record<string, { emoji: string; label: string; color: string }> = {
  civilian: { emoji: '🎉', label: 'Civilians Win!', color: '#57f287' },
  undercover: { emoji: '🕵️', label: 'Undercover Wins!', color: '#ed4245' },
  mrwhite: { emoji: '🃏', label: 'Mr. White Wins!', color: '#fee75c' },
};

const ROLE_LABELS: Record<string, string> = {
  civilian: 'Civilian',
  undercover: 'Undercover',
  mrwhite: 'Mr. White',
};

const ROLE_COLORS: Record<string, string> = {
  civilian: '#57f287',
  undercover: '#ed4245',
  mrwhite: '#fee75c',
};

export default function GameOver({ gameState, mySessionId, me, onPlayAgain }: Props) {
  const winner = WINNER_INFO[gameState.winner] ?? { emoji: '🏁', label: 'Game Over', color: '#fff' };
  const isHost = me?.isHost;
  const players = Object.entries(gameState.players);

  return (
    <div className="screen">
      <div style={{ textAlign: 'center', padding: '24px 16px 16px' }}>
        <p style={{ fontSize: 48, margin: 0 }}>{winner.emoji}</p>
        <h2 style={{ color: winner.color, margin: '8px 0 4px' }}>{winner.label}</h2>

        <div className="word-reveal-row">
          <div className="word-reveal-box">
            <span className="label">Civilian word</span>
            <span className="word-text" style={{ color: '#57f287' }}>{gameState.civilianWord}</span>
          </div>
          <div className="word-reveal-box">
            <span className="label">Undercover word</span>
            <span className="word-text" style={{ color: '#ed4245' }}>{gameState.undercoverWord}</span>
          </div>
        </div>
      </div>

      <div className="player-list" style={{ padding: '0 16px' }}>
        <p className="label" style={{ marginBottom: 8 }}>Players</p>
        {players.map(([id, player]) => (
          <div key={id} className="player-row" style={{ borderLeft: `3px solid ${player.color}` }}>
            <span className="player-name">
              {player.username}
              {id === mySessionId && <span className="badge">You</span>}
            </span>
            <span style={{ color: ROLE_COLORS[player.role] ?? '#aaa', fontSize: 13 }}>
              {ROLE_LABELS[player.role] ?? '?'}
              {player.isEliminated && ' (eliminated)'}
            </span>
          </div>
        ))}
      </div>

      <div style={{ padding: 16, textAlign: 'center' }}>
        {isHost ? (
          <button className="btn-primary" onClick={onPlayAgain}>
            Play Again
          </button>
        ) : (
          <p className="muted">Waiting for host to start a new game...</p>
        )}
      </div>
    </div>
  );
}
