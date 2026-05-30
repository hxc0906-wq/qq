'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface GameRecord {
  id: number;
  scenario: string;
  final_score: number;
  result: string;
  played_at: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        if (!meData.user) {
          window.location.href = '/login';
          return;
        }
        setUser(meData.user);

        const recRes = await fetch('/api/game-records');
        const recData = await recRes.json();
        if (recData.records) {
          setRecords(recData.records);
        }
      } catch {
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  const winCount = records.filter((r) => r.result === '通关').length;
  const totalCount = records.length;
  const winRate = totalCount > 0 ? Math.round((winCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <div className="flex items-center gap-2 text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-rose-400" />
          加载中...
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 p-4">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between pt-4">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← 返回首页
          </Link>
        </div>

        {/* User Card */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-2xl text-white shadow-md">
                {user.username[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{user.username}</h1>
                <p className="text-sm text-gray-400">哄哄模拟器玩家</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              退出登录
            </button>
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-3 gap-4 rounded-xl bg-gray-50 p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
              <div className="text-xs text-gray-400">总场次</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{winCount}</div>
              <div className="text-xs text-gray-400">通关次数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-rose-500">{winRate}%</div>
              <div className="text-xs text-gray-400">通关率</div>
            </div>
          </div>
        </div>

        {/* Game Records */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">游戏记录</h2>
          {totalCount > 0 && (
            <span className="text-sm text-gray-400">共 {totalCount} 场</span>
          )}
        </div>

        {records.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <div className="text-4xl mb-3">🎮</div>
            <p className="text-gray-400">还没有游戏记录</p>
            <Link
              href="/"
              className="mt-3 inline-block text-sm text-rose-500 hover:text-rose-600 font-medium"
            >
              去玩一局 →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <div
                key={record.id}
                className="rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${
                        record.result === '通关'
                          ? 'bg-green-50'
                          : 'bg-red-50'
                      }`}
                    >
                      {record.result === '通关' ? '🎉' : '💔'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{record.scenario}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(record.played_at).toLocaleString('zh-CN', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-bold ${
                        record.result === '通关' ? 'text-green-600' : 'text-red-500'
                      }`}
                    >
                      {record.result}
                    </div>
                    <div className="text-xs text-gray-400">
                      好感度 {record.final_score}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pb-8" />
      </div>
    </div>
  );
}
