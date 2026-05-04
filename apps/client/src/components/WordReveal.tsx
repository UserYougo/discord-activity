import React from 'react';

interface Props {
  role: string;
  word: string;
  onReady: () => void;
}

const ROLE_INFO: Record<string, { label: string; color: string; desc: string }> = {
  civilian: {
    label: 'Civilian',
    color: '#57f287',
    desc: 'Find the Undercover agent before they outnumber you!',
  },
  undercover: {
    label: 'Undercover',
    color: '#ed4245',
    desc: "Blend in with the civilians. Don't get caught!",
  },
  mrwhite: {
    label: 'Mr. White',
    color: '#fee75c',
    desc: "You have no word. Bluff your way through and guess the civilian word if eliminated!",
  },
};

export default function WordReveal({ role, word, onReady }: Props) {
  const info = ROLE_INFO[role] ?? { label: role, color: '#fff', desc: '' };

  return (
    <div className="screen center">
      <div className="card" style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <p className="label">Your role</p>
        <h2 style={{ color: info.color, fontSize: 28, margin: '8px 0 16px' }}>
          {info.label}
        </h2>

        {role !== 'mrwhite' ? (
          <>
            <p className="label">Your word</p>
            <div className="word-box">{word}</div>
          </>
        ) : (
          <div className="word-box" style={{ color: '#aaa' }}>No word</div>
        )}

        <p className="muted" style={{ margin: '16px 0 24px', fontSize: 13 }}>
          {info.desc}
        </p>

        <button className="btn-primary" onClick={onReady}>
          Got it!
        </button>
      </div>
    </div>
  );
}
