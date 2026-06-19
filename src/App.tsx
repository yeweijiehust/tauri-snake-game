import { useState, useCallback, useEffect, useRef } from 'react';
import { createInitialState, tick, changeDirection } from './game/logic';
import type { Direction, GameState, GameStatus } from './game/types';
import { GameCanvas } from './components/GameCanvas';
import { I18nProvider, useI18n } from './utils/i18n';
import { loadHistory, saveRecord, clearHistory } from './utils/history';
import type { GameRecord } from './game/types';
import './App.css';

function GameBoard() {
  const { t, locale, setLocale } = useI18n();
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [records, setRecords] = useState<GameRecord[]>(() => loadHistory());
  const [showHistory, setShowHistory] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const TICK_INTERVAL = 150;

  const prevStatusRef = useRef<GameStatus>(state.status);

  useEffect(() => {
    if (state.status === 'GAME_OVER' && prevStatusRef.current === 'PLAYING') {
      saveRecord(state.score);
      setRecords(loadHistory());
    }
    prevStatusRef.current = state.status;
  }, [state.status, state.score]);

  const gameLoop = useCallback((time: number) => {
    if (time - lastTimeRef.current >= TICK_INTERVAL) {
      lastTimeRef.current = time;
      setState((prev) => tick(prev));
    }
    frameRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [gameLoop]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const dirMap: Record<string, Direction> = {
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT',
        w: 'UP',
        s: 'DOWN',
        a: 'LEFT',
        d: 'RIGHT',
      };
      const dir = dirMap[e.key];
      if (dir) {
        e.preventDefault();
        setState((prev) => changeDirection(prev, dir));
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        setState((prev) => {
          if (prev.status === 'IDLE' || prev.status === 'GAME_OVER') {
            return { ...createInitialState(), status: 'PLAYING' };
          }
          return prev;
        });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const startGame = useCallback(() => {
    setState((prev) => {
      if (prev.status === 'IDLE' || prev.status === 'GAME_OVER') {
        return { ...createInitialState(), status: 'PLAYING' };
      }
      return { ...prev, status: 'PLAYING' };
    });
  }, []);

  const togglePause = useCallback(() => {
    setState((prev) => {
      if (prev.status === 'PLAYING') return { ...prev, status: 'PAUSED' };
      if (prev.status === 'PAUSED') return { ...prev, status: 'PLAYING' };
      return prev;
    });
  }, []);

  return (
    <div className="app-layout">
      <h1 className="app-title">{t('app.title')}</h1>

      <div className="lang-bar">
        <button
          className={locale === 'en' ? 'active' : ''}
          onClick={() => setLocale('en')}
        >
          {t('lang.en')}
        </button>
        <button
          className={locale === 'zh' ? 'active' : ''}
          onClick={() => setLocale('zh')}
        >
          {t('lang.zh')}
        </button>
      </div>

      <div className="game-controls">
        {(state.status === 'IDLE' || state.status === 'GAME_OVER') && (
          <button onClick={startGame}>{t('game.start')}</button>
        )}
        {state.status === 'PLAYING' && (
          <button onClick={togglePause}>{t('game.pause')}</button>
        )}
        {state.status === 'PAUSED' && (
          <button onClick={togglePause}>{t('game.resume')}</button>
        )}
        <button onClick={() => setShowHistory(true)}>
          {t('history.button')}
        </button>
        <span className="score">
          {t('game.score')}: {state.score}
        </span>
      </div>

      <div className="canvas-wrapper">
        <GameCanvas state={state} />
        {state.status === 'GAME_OVER' && (
          <div className="game-over-overlay">
            <h2>{t('game.over')}</h2>
            <p>
              {t('game.score')}: {state.score}
            </p>
            <button onClick={startGame}>{t('game.playAgain')}</button>
          </div>
        )}
      </div>

      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('history.title')}</h3>
              <button
                className="modal-close"
                onClick={() => setShowHistory(false)}
              >
                &times;
              </button>
            </div>
            {showClearConfirm ? (
              <div className="confirm-prompt">
                <p>{t('history.confirm')}</p>
                <div className="confirm-actions">
                  <button
                    className="confirm-yes"
                    onClick={() => {
                      clearHistory();
                      setRecords([]);
                      setShowClearConfirm(false);
                    }}
                  >
                    {t('history.yes')}
                  </button>
                  <button
                    className="confirm-no"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    {t('history.no')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {records.length === 0 ? (
                  <p>{t('history.empty')}</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{t('history.score')}</th>
                        <th>{t('history.date')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{r.score}</td>
                          <td>{new Date(r.date).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div className="modal-footer">
                  <button
                    className="btn-danger"
                    onClick={() => setShowClearConfirm(true)}
                  >
                    {t('history.clear')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <GameBoard />
    </I18nProvider>
  );
}
