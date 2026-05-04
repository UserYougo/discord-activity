import React, { useEffect, useRef, useState } from 'react';
import { Room } from '@colyseus/sdk';
import { authenticate } from './utils/Auth';
import { colyseusSDK } from './utils/Colyseus';
import { discordSDK } from './utils/DiscordSDK';

import Lobby from './components/Lobby';
import WordReveal from './components/WordReveal';
import DescriptionPhase from './components/DescriptionPhase';
import VotingPhase from './components/VotingPhase';
import Elimination from './components/Elimination';
import MrWhiteGuess from './components/MrWhiteGuess';
import GameOver from './components/GameOver';

export interface PlayerData {
  id: string;
  username: string;
  isHost: boolean;
  isEliminated: boolean;
  votes: number;
  hasDescribed: boolean;
  description: string;
  role: string;
}

export interface GameState {
  phase: string;
  players: Record<string, PlayerData>;
  currentPlayerId: string;
  lastEliminatedId: string;
  winner: string;
  civilianWord: string;
  undercoverWord: string;
  round: number;
}

function stateToPlain(state: any): GameState {
  const players: Record<string, PlayerData> = {};
  state.players.forEach((player: any, id: string) => {
    players[id] = {
      id: player.id,
      username: player.username,
      isHost: player.isHost,
      isEliminated: player.isEliminated,
      votes: player.votes,
      hasDescribed: player.hasDescribed,
      description: player.description,
      role: player.role,
    };
  });
  return {
    phase: state.phase,
    players,
    currentPlayerId: state.currentPlayerId,
    lastEliminatedId: state.lastEliminatedId,
    winner: state.winner,
    civilianWord: state.civilianWord,
    undercoverWord: state.undercoverWord,
    round: state.round,
  };
}

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [mySessionId, setMySessionId] = useState('');
  const [myRole, setMyRole] = useState('');
  const [myWord, setMyWord] = useState('');
  const [wordSeen, setWordSeen] = useState(false);
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(true);
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    connect();
    return () => { roomRef.current?.leave(); };
  }, []);

  // Reset wordSeen when a new game starts (round resets to 1)
  useEffect(() => {
    if (gameState?.round === 1 && gameState.phase === 'description') {
      setWordSeen(false);
    }
  }, [gameState?.round]);

  async function connect() {
    try {
      const authData = await authenticate();
      colyseusSDK.auth.token = authData.token;

      const room = await colyseusSDK.joinOrCreate<any>('undercover', {
        channelId: discordSDK.channelId,
      });

      roomRef.current = room;
      setMySessionId(room.sessionId);
      setConnecting(false);

      room.onMessage('your_role', ({ role, word }: { role: string; word: string }) => {
        setMyRole(role);
        setMyWord(word);
        setWordSeen(false);
      });

      room.onMessage('error', ({ message }: { message: string }) => {
        setError(message);
        setTimeout(() => setError(''), 3000);
      });

      room.onStateChange((state: any) => {
        setGameState(stateToPlain(state));
      });

    } catch (e) {
      console.error('Connection failed', e);
      setError('Failed to connect. Please restart the activity.');
      setConnecting(false);
    }
  }

  function sendMessage(type: string, data?: any) {
    roomRef.current?.send(type, data);
  }

  if (connecting) {
    return <div className="screen center"><p className="muted">Connecting...</p></div>;
  }

  if (error && !gameState) {
    return <div className="screen center"><p className="error-text">{error}</p></div>;
  }

  if (!gameState) {
    return <div className="screen center"><p className="muted">Loading...</p></div>;
  }

  const { phase } = gameState;
  const me = gameState.players[mySessionId];

  // Show word reveal screen once when the game starts
  if (phase === 'description' && myRole && !wordSeen) {
    return <WordReveal role={myRole} word={myWord} onReady={() => setWordSeen(true)} />;
  }

  return (
    <div className="screen">
      {error && <div className="toast">{error}</div>}

      {phase === 'lobby' && (
        <Lobby
          gameState={gameState}
          mySessionId={mySessionId}
          onStart={() => sendMessage('start_game')}
        />
      )}

      {phase === 'description' && (
        <DescriptionPhase
          gameState={gameState}
          mySessionId={mySessionId}
          onDescribe={(desc) => sendMessage('describe', { description: desc })}
        />
      )}

      {phase === 'voting' && (
        <VotingPhase
          gameState={gameState}
          mySessionId={mySessionId}
          onVote={(targetId) => sendMessage('vote', { targetId })}
        />
      )}

      {phase === 'elimination' && (
        <Elimination gameState={gameState} />
      )}

      {phase === 'mrwhite_guess' && (
        <MrWhiteGuess
          gameState={gameState}
          mySessionId={mySessionId}
          isMrWhite={myRole === 'mrwhite'}
          onGuess={(guess) => sendMessage('mrwhite_guess', { guess })}
        />
      )}

      {phase === 'gameover' && (
        <GameOver
          gameState={gameState}
          mySessionId={mySessionId}
          me={me}
          onPlayAgain={() => sendMessage('play_again')}
        />
      )}
    </div>
  );
}
