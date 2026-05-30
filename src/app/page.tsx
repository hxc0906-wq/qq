'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { GameState, Gender, Scenario, GameOption, ChatMessage, RoundRecord } from '@/lib/game-data';
import {
  INITIAL_GAME_STATE,
  SCENARIOS,
  GENDER_LABELS,
  MAX_ROUNDS,
  WIN_SCORE,
  MIN_SCORE,
  MAX_SCORE,
  getEmotionLabel,
} from '@/lib/game-data';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/** User nav component - shows login/register or username+logout */
function UserNav() {
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user || null);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  if (loading) return <div className="w-20" />;

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="text-sm text-rose-500 hover:text-rose-600 font-medium transition-colors"
        >
          登录
        </Link>
        <Link
          href="/register"
          className="text-sm bg-rose-500 text-white px-3 py-1 rounded-lg hover:bg-rose-600 transition-colors"
        >
          注册
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/profile" className="text-sm text-gray-600 hover:text-rose-500 transition-colors">
        👋 <span className="font-medium text-gray-800">{user.username}</span>
      </Link>
      <button
        onClick={handleLogout}
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        退出
      </button>
    </div>
  );
}

// ============ 彩带动画 ============

function ConfettiEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = window.innerWidth;
    const ch = window.innerHeight;
    canvas.width = cw;
    canvas.height = ch;

    const particles: Array<{
      x: number; y: number; w: number; h: number;
      color: string; vx: number; vy: number;
      angle: number; va: number;
    }> = [];

    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6eb4', '#c084fc', '#f97316'];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * cw,
        y: Math.random() * ch - ch,
        w: Math.random() * 10 + 5,
        h: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        angle: Math.random() * Math.PI * 2,
        va: (Math.random() - 0.5) * 0.2,
      });
    }

    let animationId: number;
    let frame = 0;

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, cw, ch);
      frame++;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.angle += p.va;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (frame < 180) {
        animationId = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, cw, ch);
      }
    }

    animate();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}

// ============ 心碎动画 ============

function HeartBreakEffect() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      <div className="animate-heartBreak text-8xl">💔</div>
    </div>
  );
}

// ============ 好感度进度条 ============

function AffectionBar({ affection, scoreChange }: { affection: number; scoreChange: number | null }) {
  const percentage = Math.max(0, Math.min(100, ((affection - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * 100));
  const emotionLabel = getEmotionLabel(affection);

  const getBarColor = () => {
    if (affection <= 0) return 'bg-red-500';
    if (affection <= 30) return 'bg-orange-400';
    if (affection <= 60) return 'bg-yellow-400';
    if (affection < 80) return 'bg-lime-400';
    return 'bg-green-400';
  };

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium">好感度</span>
        <span className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{emotionLabel}</span>
          <span className="font-bold">{affection}</span>
        </span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getBarColor()}`}
          style={{ width: `${percentage}%` }}
        />
        {scoreChange !== null && scoreChange !== 0 && (
          <span
            className={`absolute top-1/2 -translate-y-1/2 animate-scoreFloat text-sm font-bold ${
              scoreChange > 0 ? 'text-green-500' : 'text-red-500'
            }`}
            style={{ left: `${Math.min(95, Math.max(5, percentage))}%` }}
          >
            {scoreChange > 0 ? `+${scoreChange}` : scoreChange}
          </span>
        )}
      </div>
    </div>
  );
}

// ============ 打字气泡 ============

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-end gap-2 max-w-[80%]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-lg">
          💬
        </div>
        <div className="inline-block rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 shadow-sm">
          <div className="flex gap-1">
            <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
            <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
            <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ 学习弹窗 ============

function LearningPopup({
  option,
  onConfirm,
}: {
  option: GameOption;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm animate-slideUp rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-2xl">💡</span>
          <h3 className="text-lg font-bold">这样说不太对哦</h3>
        </div>
        <div className="mb-4 rounded-lg bg-red-50 p-3">
          <p className="text-sm font-medium text-red-700">你选了：</p>
          <p className="mt-1 text-sm text-red-600">{option.text}</p>
        </div>
        <div className="mb-4 rounded-lg bg-blue-50 p-3">
          <p className="text-sm font-medium text-blue-700">为什么不好：</p>
          <p className="mt-1 text-sm text-blue-600">{option.learningTip}</p>
        </div>
        <button
          onClick={onConfirm}
          className="w-full rounded-xl bg-primary py-3 text-center font-medium text-primary-foreground transition-transform active:scale-95"
        >
          我知道了
        </button>
      </div>
    </div>
  );
}

// ============ 复盘 ============

function ReviewSection({ history, gender }: { history: RoundRecord[]; gender: Gender }) {
  const genderLabel = GENDER_LABELS[gender];
  return (
    <div className="space-y-3">
      <h3 className="text-center text-lg font-bold">复盘：看看哪里可以更好</h3>
      {history.map((record) => (
        <div
          key={record.round}
          className={`rounded-xl border p-3 ${
            record.selectedOption.isGood ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-medium">第 {record.round} 轮</span>
            <span className={`text-sm font-bold ${record.selectedOption.isGood ? 'text-green-600' : 'text-red-600'}`}>
              {record.selectedOption.scoreChange > 0 ? '+' : ''}{record.selectedOption.scoreChange}
            </span>
          </div>
          <div className="mb-1 text-sm text-gray-600">
            <span className="font-medium">{genderLabel}：</span>{record.partnerMessage}
          </div>
          <div className="text-sm">
            <span className="font-medium">你选了：</span>
            <span className={record.selectedOption.isGood ? 'text-green-700' : 'text-red-700'}>
              {record.selectedOption.text}
            </span>
          </div>
          {!record.selectedOption.isGood && record.selectedOption.learningTip && (
            <div className="mt-2 rounded-lg bg-blue-50 p-2 text-sm text-blue-700">
              <span className="font-medium">更好的做法：</span>{record.selectedOption.learningTip}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============ 分享卡片 ============

function ShareCard({
  won, affection, scenario, gender, history,
}: {
  won: boolean; affection: number; scenario: Scenario; gender: Gender; history: RoundRecord[];
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const genderLabel = GENDER_LABELS[gender];
  const keyRounds = history.filter((r) => !r.selectedOption.isGood).slice(0, 3);

  const handleSave = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null, useCORS: true });
      const link = document.createElement('a');
      link.download = `哄哄模拟器_${won ? '通关' : '失败'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Save card error:', err);
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={cardRef}
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500 p-6 text-white shadow-lg"
      >
        <div className="mb-4 text-center">
          <div className="text-4xl">{won ? '🎉' : '😢'}</div>
          <h2 className="mt-2 text-2xl font-bold">{won ? '哄人成功！' : '哄人失败'}</h2>
          <p className="mt-1 text-sm opacity-80">哄哄模拟器</p>
        </div>
        <div className="mb-4 space-y-2 rounded-xl bg-white/20 p-3 backdrop-blur-sm">
          <div className="flex justify-between text-sm"><span>场景</span><span className="font-medium">{scenario.title}</span></div>
          <div className="flex justify-between text-sm"><span>对象</span><span className="font-medium">{genderLabel}</span></div>
          <div className="flex justify-between text-sm"><span>最终好感度</span><span className="font-bold">{affection}</span></div>
          <div className="flex justify-between text-sm"><span>结果</span><span className="font-bold">{won ? '通关 ✨' : '失败 💔'}</span></div>
        </div>
        {keyRounds.length > 0 && (
          <div className="space-y-1 text-xs opacity-80">
            <p className="font-medium">翻车瞬间：</p>
            {keyRounds.map((r) => (
              <p key={r.round} className="truncate">第{r.round}轮：{r.selectedOption.text}</p>
            ))}
          </div>
        )}
        <p className="mt-4 text-center text-xs opacity-60">来试试你能不能哄好Ta？</p>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
      >
        {saving ? '生成中...' : '保存分享卡片'}
      </button>
    </div>
  );
}

// ============ 音频播放 ============

function AudioButton({ audioUrl, loading }: { audioUrl: string; loading?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []);

  const handlePlay = () => {
    if (playing && audioRef.current) { audioRef.current.pause(); setPlaying(false); return; }
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
    audio.play();
    setPlaying(true);
  };

  if (loading) {
    return (
      <span className="ml-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
      </span>
    );
  }

  return (
    <button
      onClick={handlePlay}
      className="ml-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
      title={playing ? '暂停' : '播放语音'}
    >
      {playing ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
      )}
    </button>
  );
}

// ============ 主页面 ============

export default function HomePage() {
  const [game, setGame] = useState<GameState>(INITIAL_GAME_STATE);
  const [scoreChange, setScoreChange] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  // 预取缓存：存储下一轮的LLM结果
  const prefetchRef = useRef<{ reply: string; options: GameOption[]; partnerId: string } | null>(null);
  const isPrefetchingRef = useRef(false);
  // TTS加载状态
  const [ttsLoading, setTtsLoading] = useState<string | null>(null);
  // 用户登录状态
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string } | null>(null);
  // 游戏记录保存提示
  const [recordToast, setRecordToast] = useState<string | null>(null);
  // 是否已保存当前局的游戏记录
  const recordSavedRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  // 获取当前登录用户
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setCurrentUser(data.user || null))
      .catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [game.messages, game.currentOptions]);

  // 请求TTS（纯异步，不阻塞游戏流程）
  const fetchTTS = useCallback(async (text: string, gender: Gender, affection: number, messageId: string) => {
    setTtsLoading(messageId);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, gender, affection }),
      });
      const data = await res.json();
      if (data.audioUri) {
        setGame((prev) => ({
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === messageId ? { ...m, audioUrl: data.audioUri } : m
          ),
        }));
      }
    } catch (err) {
      console.error('TTS error:', err);
    } finally {
      setTtsLoading((prev) => prev === messageId ? null : prev);
    }
  }, []);

  // 调用LLM获取下一轮对话
  const fetchNextRound = useCallback(async (gender: Gender, scenario: Scenario | null, affection: number, round: number, messages: ChatMessage[], selectedOption?: string, affectionChange?: number) => {
    if (!scenario) return null;
    const chatHistory = messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender, scenario, affection, round, chatHistory, selectedOption, affectionChange }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (err) {
      console.error('fetchNextRound error:', err);
      return null;
    }
  }, []);

  // 开始游戏
  const startGame = useCallback(async (gender: Gender, scenario: Scenario) => {
    setGame({ ...INITIAL_GAME_STATE, screen: 'game', gender, scenario, round: 1, isLoading: true });
    setScoreChange(null);

    try {
      const data = await fetchNextRound(gender, scenario, 0, 1, []);
      if (!data) {
        setGame((prev) => ({ ...prev, isLoading: false, loadError: true }));
        return;
      }

      const partnerMsg: ChatMessage = { id: generateId(), role: 'partner', content: data.reply };
      setGame((prev) => ({ ...prev, messages: [partnerMsg], currentOptions: data.options, isLoading: false }));
      fetchTTS(data.reply, gender, 0, partnerMsg.id); // 异步TTS
    } catch (err) {
      console.error('Start game error:', err);
      setGame((prev) => ({ ...prev, isLoading: false, loadError: true }));
    }
  }, [fetchNextRound, fetchTTS]);

  // 重试加载
  const retryLoad = useCallback(() => {
    if (!game.gender || !game.scenario) return;
    const gender = game.gender;
    const scenario = game.scenario;

    setGame((prev) => ({ ...prev, loadError: false, isLoading: true }));
    if (game.round === 1 && game.messages.length === 0) {
      fetchNextRound(gender, scenario, 0, 1, [])
        .then((data) => {
          if (!data) { setGame((prev) => ({ ...prev, isLoading: false, loadError: true })); return; }
          const partnerMsg: ChatMessage = { id: generateId(), role: 'partner', content: data.reply };
          setGame((prev) => ({ ...prev, messages: [partnerMsg], currentOptions: data.options, isLoading: false, loadError: false }));
          fetchTTS(data.reply, gender, 0, partnerMsg.id);
        })
        .catch(() => setGame((prev) => ({ ...prev, isLoading: false, loadError: true })));
    } else {
      const lastUser = [...game.messages].reverse().find((m) => m.role === 'user');
      fetchNextRound(gender, scenario, game.affection, game.round, game.messages, lastUser?.content)
        .then((data) => {
          if (!data) { setGame((prev) => ({ ...prev, isLoading: false, loadError: true })); return; }
          const partnerMsg: ChatMessage = { id: generateId(), role: 'partner', content: data.reply };
          setGame((prev) => ({
            ...prev, messages: [...prev.messages, partnerMsg], currentOptions: data.options, isLoading: false, loadError: false,
          }));
          fetchTTS(data.reply, gender, game.affection, partnerMsg.id);
        })
        .catch(() => setGame((prev) => ({ ...prev, isLoading: false, loadError: true })));
    }
  }, [game, fetchNextRound, fetchTTS]);

  // 选择选项
  const selectOption = useCallback((option: GameOption) => {
    const newAffection = Math.max(MIN_SCORE, Math.min(MAX_SCORE, game.affection + option.scoreChange));
    const newRound = game.round + 1;
    const userMsg: ChatMessage = { id: generateId(), role: 'user', content: option.text };
    const record: RoundRecord = {
      round: game.round,
      partnerMessage: game.messages[game.messages.length - 1]?.content || '',
      selectedOption: option, affectionBefore: game.affection, affectionAfter: newAffection,
    };

    setScoreChange(option.scoreChange);
    setTimeout(() => setScoreChange(null), 1500);

    const isWon = newAffection >= WIN_SCORE;
    const isLost = newAffection <= MIN_SCORE || (newRound > MAX_ROUNDS && newAffection < WIN_SCORE);

    if (isWon || isLost || newRound > MAX_ROUNDS) {
      setGame((prev) => ({
        ...prev, messages: [...prev.messages, userMsg], currentOptions: null,
        affection: newAffection, round: newRound, gameOver: true, won: isWon,
        lastSelectedOption: option, gameHistory: [...prev.gameHistory, record],
        showLearning: !option.isGood,
      }));
      return;
    }

    // 游戏继续：立即显示用户消息+隐藏选项
    setGame((prev) => ({
      ...prev, messages: [...prev.messages, userMsg], currentOptions: null,
      affection: newAffection, round: prev.round, // 保持当前轮次，等下一轮数据回来再+1
      isLoading: true, lastSelectedOption: option,
      gameHistory: [...prev.gameHistory, record], showLearning: !option.isGood,
    }));

    // 立即开始预取下一轮LLM
    if (!isPrefetchingRef.current && game.gender && game.scenario) {
      isPrefetchingRef.current = true;
      const partnerId = generateId();
      const allMessages = [...game.messages, userMsg];

      fetchNextRound(game.gender, game.scenario, newAffection, newRound, allMessages, option.text, option.scoreChange)
        .then((data) => {
          if (data) {
            prefetchRef.current = { reply: data.reply, options: data.options, partnerId };
          } else {
            setGame((prev) => ({ ...prev, loadError: true, isLoading: false }));
          }
        })
        .catch(() => {
          setGame((prev) => ({ ...prev, loadError: true, isLoading: false }));
        })
        .finally(() => { isPrefetchingRef.current = false; });
    }
  }, [game, fetchNextRound]);

  // 学习弹窗确认后 / 好选项直接进入下一轮
  const proceedToNextRound = useCallback((currentAffection: number, currentGender: Gender | null, isGameOver: boolean) => {
    setGame((prev) => ({ ...prev, showLearning: false }));

    if (isGameOver) {
      setGame((prev) => ({ ...prev, screen: 'end' }));
      return;
    }

    // 如果预取已完成，直接使用缓存结果
    if (prefetchRef.current) {
      const { reply, options, partnerId } = prefetchRef.current;
      prefetchRef.current = null;

      const partnerMsg: ChatMessage = { id: partnerId, role: 'partner', content: reply };
      setGame((prev) => ({
        ...prev, messages: [...prev.messages, partnerMsg],
        currentOptions: options, round: prev.round + 1, isLoading: false,
      }));

      if (currentGender) fetchTTS(reply, currentGender, currentAffection, partnerMsg.id);
      return;
    }

    // 预取未完成，等待
    let checkCount = 0;
    const checkPrefetch = () => {
      if (prefetchRef.current) {
        const { reply, options, partnerId } = prefetchRef.current;
        prefetchRef.current = null;
        const partnerMsg: ChatMessage = { id: partnerId, role: 'partner', content: reply };
        setGame((prev) => ({
          ...prev, messages: [...prev.messages, partnerMsg],
          currentOptions: options, round: prev.round + 1, isLoading: false,
        }));
        if (currentGender) fetchTTS(reply, currentGender, currentAffection, partnerMsg.id);
      } else if (checkCount < 200) {
        checkCount++;
        setTimeout(checkPrefetch, 100);
      } else {
        setGame((prev) => ({ ...prev, loadError: true, isLoading: false }));
      }
    };
    checkPrefetch();
  }, [fetchTTS]);

  // 好选项自动进入下一轮（无学习弹窗）
  useEffect(() => {
    if (game.isLoading && !game.showLearning && !game.loadError && game.lastSelectedOption?.isGood && !game.gameOver) {
      proceedToNextRound(game.affection, game.gender, false);
    }
    if (game.gameOver && !game.showLearning && game.screen === 'game') {
      setGame((prev) => ({ ...prev, screen: 'end' }));
    }
  }, [game.isLoading, game.showLearning, game.loadError, game.lastSelectedOption, game.gameOver, game.affection, game.gender, game.screen, proceedToNextRound]);

  // 游戏结束时保存记录
  useEffect(() => {
    if (game.screen !== 'end' || recordSavedRef.current) return;
    recordSavedRef.current = true;

    const scenarioName = game.scenario?.title || '未知场景';
    const result = game.won ? '通关' : '失败';

    if (currentUser) {
      fetch('/api/game-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioName, final_score: game.affection, result }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            setRecordToast('您的游戏记录已经保存');
          }
        })
        .catch(() => {});
    } else {
      setRecordToast('登录后可保存你的游戏记录');
    }
  }, [game.screen, game.won, game.affection, game.scenario, currentUser]);

  // 重新开始
  const restart = useCallback(() => {
    setGame(INITIAL_GAME_STATE);
    setScoreChange(null);
    setRecordToast(null);
    prefetchRef.current = null;
    recordSavedRef.current = false;
    isPrefetchingRef.current = false;
  }, []);

  if (!mounted) return null;

  // ============ 首页 ============
  if (game.screen === 'home') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50 p-4">
        <div className="w-full max-w-lg">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-between mb-2">
              <div className="w-24" />
              <h1 className="text-4xl font-bold text-purple-600">哄哄模拟器</h1>
              <div className="w-24 flex justify-end">
                <UserNav />
              </div>
            </div>
            <p className="mt-2 text-gray-500">选对话哄好你的Ta，选错就学习怎么说</p>
            <Link href="/blog" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700 ring-1 ring-amber-200 transition-all hover:bg-amber-100 hover:ring-amber-300">
              <span>📖</span> 恋爱攻略
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="mb-3 text-center text-lg font-medium text-gray-700">你要哄的对象是？</h2>
            <div className="flex justify-center gap-4">
              {(['female', 'male'] as Gender[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGame((prev) => ({ ...prev, gender: g }))}
                  className={`flex w-36 flex-col items-center gap-2 rounded-2xl border-2 p-6 transition-all ${
                    game.gender === g
                      ? 'border-primary bg-primary/5 shadow-md scale-105'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <span className="text-4xl">{g === 'female' ? '👩' : '👨'}</span>
                  <span className="font-medium">{GENDER_LABELS[g]}</span>
                </button>
              ))}
            </div>
          </div>

          {game.gender && (
            <div className="animate-fadeIn">
              <h2 className="mb-3 text-center text-lg font-medium text-gray-700">选择一个场景</h2>
              <div className="space-y-3">
                {SCENARIOS.map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => startGame(game.gender!, scenario)}
                    className="flex w-full items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.98]"
                  >
                    <span className="mt-0.5 text-2xl">{scenario.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{scenario.title}</div>
                      <div className="mt-0.5 text-sm text-gray-500">{scenario.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ 游戏界面 ============
  if (game.screen === 'game') {
    const lastMsg = game.messages[game.messages.length - 1];
    return (
      <div className="flex h-screen flex-col bg-gray-50">
        {/* 顶部 */}
        <div className="shrink-0 border-b bg-white px-4 py-3 shadow-sm">
          <div className="mx-auto max-w-lg">
            <div className="mb-2 flex items-center justify-between">
              <button onClick={restart} className="text-sm text-gray-400 hover:text-gray-600">退出</button>
              <span className="text-sm font-medium text-gray-600">第 {game.round} 轮 / 共 {MAX_ROUNDS} 轮</span>
              <span className="text-sm text-gray-400">{game.scenario?.icon} {game.scenario?.title}</span>
            </div>
            <AffectionBar affection={game.affection} scoreChange={scoreChange} />
          </div>
        </div>

        {/* 对话区域 */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto max-w-lg space-y-4">
            {game.messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg ${msg.role === 'partner' ? 'bg-rose-100' : 'bg-blue-100'}`}>
                    {msg.role === 'partner' ? (game.gender === 'male' ? '👨' : '👩') : '🧑'}
                  </div>
                  <div>
                    <div className={`inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'partner'
                        ? 'rounded-bl-sm bg-white text-gray-800 shadow-sm'
                        : 'rounded-br-sm bg-primary text-primary-foreground'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.role === 'partner' && (msg.audioUrl || ttsLoading === msg.id) && (
                      <div className="mt-1"><AudioButton audioUrl={msg.audioUrl || ''} loading={!msg.audioUrl && ttsLoading === msg.id} /></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {/* 正在输入提示 */}
            {game.isLoading && !game.loadError && <TypingBubble />}
            {/* 加载失败提示 */}
            {game.loadError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                <span>加载失败，请重试</span>
                <button onClick={retryLoad} className="rounded-lg bg-red-500 px-3 py-1 text-xs text-white hover:bg-red-600">重试</button>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* 选项区域 */}
        <div className="shrink-0 border-t bg-white px-4 py-3">
          <div className="mx-auto max-w-lg">
            {game.currentOptions && !game.isLoading && (
              <div className="space-y-2">
                {game.currentOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => selectOption(option)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm leading-relaxed text-gray-700 transition-all hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm active:scale-[0.98]"
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 学习弹窗 */}
        {game.showLearning && game.lastSelectedOption && (
          <LearningPopup option={game.lastSelectedOption} onConfirm={() => proceedToNextRound(game.affection, game.gender, game.gameOver)} />
        )}
      </div>
    );
  }

  // ============ 结局界面 ============
  if (game.screen === 'end') {
    const wrongRounds = game.gameHistory.filter((r) => !r.selectedOption.isGood);

    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 p-4">
        {game.won && <ConfettiEffect />}
        {!game.won && <HeartBreakEffect />}

        <div className="mx-auto max-w-lg">
          <div className="mb-8 pt-8 text-center">
            <div className="text-6xl">{game.won ? '🎉' : '💔'}</div>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">{game.won ? '通关！' : '失败'}</h2>
            <p className="mt-2 text-gray-500">
              {game.won ? '你成功把Ta哄好了！' : '这次没哄好，看看哪里可以做得更好'}
            </p>
            <div className="mt-3 text-lg font-medium">
              最终好感度：<span className={game.won ? 'text-green-600' : 'text-red-500'}>{game.affection}</span>
            </div>
            {recordToast && (
              <div className={`mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${currentUser ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                {currentUser ? '✅' : '💡'} {recordToast}
                {!currentUser && (
                  <Link href="/login" className="underline hover:text-amber-800">去登录</Link>
                )}
              </div>
            )}
          </div>

          {game.messages.length > 0 && (
            <div className="mb-6 flex justify-start">
              <div className="flex items-end gap-2 max-w-[80%]">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-lg">
                  {game.gender === 'male' ? '👨' : '👩'}
                </div>
                <div className="inline-block rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 text-sm leading-relaxed text-gray-800 shadow-sm">
                  {game.messages[game.messages.length - 1]?.content}
                </div>
              </div>
            </div>
          )}

          {!game.won && wrongRounds.length > 0 && (
            <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
              <ReviewSection history={game.gameHistory} gender={game.gender!} />
            </div>
          )}

          <div className="mb-6">
            <ShareCard won={game.won} affection={game.affection} scenario={game.scenario!} gender={game.gender!} history={game.gameHistory} />
          </div>

          <div className="pb-8 text-center">
            <button onClick={restart} className="rounded-xl bg-primary px-8 py-3 font-medium text-primary-foreground transition-transform active:scale-95">
              再来一局
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
