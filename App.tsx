
import React, { useState, useRef, useEffect } from 'react';
import { GameDataPoint, GameStatus } from './types';
import GameChart from './components/GameChart';
import WeightSlider from './components/WeightSlider';
import { getGameCommentary } from './services/geminiService';

class CasinoSoundEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // High-pitched coin clink for P1
  playP1Chip() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // Lower-pitched mechanical clack for P2
  playP2Chip() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playJackpot() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const scale = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6
    scale.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.05, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.4);
    });
  }
}

const sounds = new CasinoSoundEngine();

const App: React.FC = () => {
  const [turn, setTurn] = useState<number>(0);
  const [maxTurnsInput, setMaxTurnsInput] = useState<string>("25");
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [history, setHistory] = useState<GameDataPoint[]>([{ turn: 0, player1Value: 0, player2Value: 0 }]);
  const [commentary, setCommentary] = useState<string>("WELCOME TO KISKA ZYAADA BADA. WHO HAS THE BIGGER score?");
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const [p1Name, setP1Name] = useState<string>("PLAYER ONE");
  const [p2Name, setP2Name] = useState<string>("PLAYER TWO");
  const [p1Weight, setP1Weight] = useState<number>(1.2);
  const [p2Weight, setP2Weight] = useState<number>(1.2);

  const p1Score = history[history.length - 1].player1Value;
  const p2Score = history[history.length - 1].player2Value;

  const maxTurns = parseInt(maxTurnsInput) || 1;

  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const runSimulation = async () => {
    if (isSimulating && status === GameStatus.PLAYING) {
      setIsPaused(false);
      return;
    }

    setIsSimulating(true);
    setStatus(GameStatus.PLAYING);
    setIsPaused(false);
    setCommentary(`THE BATTLE BEGINS: ${p1Name} VS ${p2Name}`);

    let currentHistory = [{ turn: 0, player1Value: 0, player2Value: 0 }];
    const BASE_POWER = 35;
    const RUBBER_BAND = 0.12;

    for (let i = 1; i <= maxTurns; i++) {
      while (isPausedRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      const prevP1 = currentHistory[currentHistory.length - 1].player1Value;
      const prevP2 = currentHistory[currentHistory.length - 1].player2Value;

      const variance = 1 + (Math.random() - 0.5) * 0.6;
      const p1Growth = (p1Weight * BASE_POWER * Math.sqrt(i) * variance) + (prevP2 - prevP1) * RUBBER_BAND;
      const p2Growth = (p2Weight * BASE_POWER * Math.sqrt(i) * (2 - variance)) + (prevP1 - prevP2) * RUBBER_BAND;

      if (p1Growth > p2Growth) sounds.playP1Chip(); else sounds.playP2Chip();

      const nextPoint: GameDataPoint = {
        turn: i,
        player1Value: Math.max(0, Number((prevP1 + p1Growth).toFixed(2))),
        player2Value: Math.max(0, Number((prevP2 + p2Growth).toFixed(2))),
      };

      currentHistory = [...currentHistory, nextPoint];
      setHistory(currentHistory);
      setTurn(i);
    }

    setIsSimulating(false);
    setStatus(GameStatus.FINISHED);
    sounds.playJackpot();

    setIsAiLoading(true);
    const lastPoint = currentHistory[currentHistory.length - 1];
    const text = await getGameCommentary(
      maxTurns, lastPoint.player1Value, lastPoint.player2Value,
      p1Weight, p2Weight, p1Name, p2Name
    );
    setCommentary(text);
    setIsAiLoading(false);
  };

  const resetGame = () => {
    setTurn(0);
    setHistory([{ turn: 0, player1Value: 0, player2Value: 0 }]);
    setStatus(GameStatus.IDLE);
    setIsPaused(false);
    setIsSimulating(false);
    setCommentary("TABLE RESET. WHOSE IS BIGGER THIS TIME?");
  };

  return (
    <div className="min-h-screen p-4 md:p-10 flex flex-col items-center max-w-6xl mx-auto">
      <header className="w-full text-center mb-12">
        <h1 className="casino-title text-6xl font-black text-yellow-500 mb-2 tracking-tighter shadow-yellow-500/20 drop-shadow-lg">
          KISKA ZYAADA BADA
        </h1>
        <div className="h-1 w-32 bg-yellow-600 mx-auto rounded-full mb-4"></div>
        <p className="text-stone-500 font-semibold tracking-widest uppercase text-sm">
          High-Volatility Magnitude Duel
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 w-full">
        {/* Left Column: Players */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Player 1 Card */}
          <div className="bg-[#121212] border-2 border-stone-800 p-5 rounded-2xl shadow-xl hover:border-blue-900/50 transition-colors">
            <div className="mb-4">
              <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 block">CONTENDER ONE</label>
              <input
                type="text"
                value={p1Name}
                onChange={(e) => setP1Name(e.target.value.toUpperCase())}
                disabled={status !== GameStatus.IDLE}
                className="w-full bg-black/40 border-b border-stone-700 p-2 text-white font-bold focus:border-blue-500 focus:outline-none disabled:opacity-50 text-sm"
              />
            </div>
            <WeightSlider
              label="BET MULTIPLIER"
              value={p1Weight}
              onChange={setP1Weight}
              color="#3b82f6"
              disabled={status !== GameStatus.IDLE}
            />
            <div className="mt-4 p-4 bg-blue-950/20 border border-blue-900/30 rounded-xl text-center">
              <span className="text-[10px] text-blue-400 font-bold uppercase block mb-1">TOTAL CHIPS</span>
              <span className="text-3xl font-black text-blue-100 neon-blue">{Math.floor(p1Score).toLocaleString()}</span>
            </div>
          </div>

          {/* Player 2 Card */}
          <div className="bg-[#121212] border-2 border-stone-800 p-5 rounded-2xl shadow-xl hover:border-red-900/50 transition-colors">
            <div className="mb-4">
              <label className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1 block">CONTENDER TWO</label>
              <input
                type="text"
                value={p2Name}
                onChange={(e) => setP2Name(e.target.value.toUpperCase())}
                disabled={status !== GameStatus.IDLE}
                className="w-full bg-black/40 border-b border-stone-700 p-2 text-white font-bold focus:border-red-500 focus:outline-none disabled:opacity-50 text-sm"
              />
            </div>
            <WeightSlider
              label="BET MULTIPLIER"
              value={p2Weight}
              onChange={setP2Weight}
              color="#ef4444"
              disabled={status !== GameStatus.IDLE}
            />
            <div className="mt-4 p-4 bg-red-950/20 border border-red-900/30 rounded-xl text-center">
              <span className="text-[10px] text-red-400 font-bold uppercase block mb-1">TOTAL CHIPS</span>
              <span className="text-3xl font-black text-red-100 neon-red">{Math.floor(p2Score).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Center/Right: Game Area */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <GameChart data={history} p1Name={p1Name} p2Name={p2Name} />

          {/* Dealer Commentary */}
          <div className="bg-[#0a0a0a] border border-yellow-900/20 p-6 rounded-2xl relative flex items-center shadow-inner overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-yellow-600/50"></div>
            <div className="flex items-center gap-4 w-full">
              <div className={`w-3 h-3 rounded-full ${isAiLoading || (isSimulating && !isPaused) ? 'bg-yellow-500 animate-pulse' : 'bg-stone-800'}`}></div>
              <p className="text-stone-300 font-medium italic text-lg leading-tight">
                {isAiLoading ? "CALCULATING ODDS..." : isSimulating ? (isPaused ? "ROUND SUSPENDED" : "NUMBERS ARE CLIMBING...") : commentary}
              </p>
            </div>
          </div>

          {/* Control Panel */}
          <div className="bg-stone-900/80 p-8 rounded-3xl border border-stone-800 flex flex-wrap items-center justify-between gap-8 shadow-2xl">
            <div className="flex items-center gap-12">
              <div className="flex flex-col">
                <span className="text-[10px] text-stone-500 font-black uppercase tracking-widest mb-1">CURRENT TURN</span>
                <span className="text-5xl font-black text-stone-200 leading-none tabular-nums">
                  {turn.toString().padStart(2, '0')}<span className="text-stone-700 mx-1">/</span>{maxTurns.toString().padStart(2, '0')}
                </span>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] text-stone-500 font-black uppercase tracking-widest mb-1">TOTAL ROUNDS</label>
                <input
                  type="number"
                  value={maxTurnsInput}
                  onChange={(e) => setMaxTurnsInput(e.target.value)}
                  onBlur={() => {
                    const v = parseInt(maxTurnsInput);
                    if (isNaN(v) || v < 1) setMaxTurnsInput("1");
                    if (v > 100) setMaxTurnsInput("100");
                  }}
                  disabled={status !== GameStatus.IDLE}
                  className="bg-black border border-stone-700 rounded-xl py-3 px-4 w-24 font-black text-white focus:border-yellow-600 focus:outline-none transition-all disabled:opacity-50 text-2xl text-center"
                />
              </div>
            </div>

            <div className="flex gap-4">
              {status === GameStatus.IDLE ? (
                <button
                  onClick={runSimulation}
                  className="px-14 py-5 bg-gradient-to-b from-yellow-500 to-yellow-700 hover:from-yellow-400 hover:to-yellow-600 text-black font-black rounded-2xl transition-all shadow-[0_5px_0_#92400e] active:shadow-none active:translate-y-1 text-xl uppercase tracking-tighter"
                >
                  START DUEL
                </button>
              ) : status === GameStatus.PLAYING ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className={`px-8 py-5 border-2 ${isPaused ? 'border-emerald-600 text-emerald-500' : 'border-stone-700 text-stone-400'} font-black rounded-2xl transition-all active:scale-95 text-lg`}
                  >
                    {isPaused ? 'RESUME' : 'PAUSE'}
                  </button>
                  <button
                    onClick={resetGame}
                    className="px-8 py-5 bg-stone-800 text-stone-300 font-black rounded-2xl transition-all active:scale-95 text-lg"
                  >
                    QUIT
                  </button>
                </div>
              ) : (
                <button
                  onClick={resetGame}
                  className="px-12 py-5 bg-stone-800 hover:bg-stone-700 text-white font-black rounded-2xl transition-all active:scale-95 text-lg"
                >
                  NEW DEAL
                </button>
              )}
            </div>
          </div>

          {/* Result Banner */}
          {status === GameStatus.FINISHED && !isSimulating && (
            <div className={`p-10 rounded-3xl border-4 text-center animate-bounce transition-all ${p1Score > p2Score
                ? 'bg-blue-900/10 border-blue-500 text-blue-100 shadow-[0_0_30px_rgba(59,130,246,0.2)]'
                : p2Score > p1Score
                  ? 'bg-red-900/10 border-red-500 text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                  : 'bg-stone-900/10 border-stone-500 text-stone-100'
              }`}>
              <h2 className="text-5xl font-black mb-2 uppercase tracking-tight">
                {p1Score > p2Score ? `${p1Name} IS BADA!` : p2Score > p1Score ? `${p2Name} IS BADA!` : "IT'S A TIE!"}
              </h2>
              <p className="text-2xl opacity-80 font-bold font-mono tracking-widest">
                GAP: {Math.floor(Math.abs(p1Score - p2Score)).toLocaleString()} POINTS
              </p>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-20 w-full text-center text-stone-600 text-[10px] font-black tracking-[0.4em] border-t border-stone-900 pt-10 pb-20 uppercase">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto mb-12">
          <div>
            <h4 className="text-stone-500 mb-3">CONVERGENCE MATH</h4>
            <p className="normal-case tracking-normal font-medium opacity-60">Trailing contenders gain statistical momentum to ensure photo finishes.</p>
          </div>
          <div>
            <h4 className="text-stone-500 mb-3">WAVY INTERPOLATION</h4>
            <p className="normal-case tracking-normal font-medium opacity-60">Smooth visualizations optimized for real-time magnitude trajectory tracking.</p>
          </div>
        </div>
        <p>© 2025 KISKA ZYAADA BADA </p>
      </footer>
    </div>
  );
};

export default App;
