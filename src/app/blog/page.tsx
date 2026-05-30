"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

interface BlogArticle {
  id: number;
  title: string;
  summary: string;
  content: string;
  created_at: string;
}

export default function BlogPage() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch("/api/blog");
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/blog/generate", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.article) {
          setArticles((prev) => [data.article, ...prev]);
        }
      }
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-100 text-pink-600 transition-colors hover:bg-pink-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">恋爱攻略</h1>
            <p className="text-sm text-gray-500">吵架别怕，这里有招</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-1.5 rounded-full bg-pink-500 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-pink-600 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                AI写作中...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                生成新文章
              </>
            )}
          </button>
        </div>

        {/* Article Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-200 border-t-pink-500" />
          </div>
        ) : articles.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            暂无文章，点击右上角生成新文章
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.id}`}
                className="group block"
              >
                <div className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm transition-all duration-200 hover:border-pink-200 hover:shadow-md">
                  <div className="mb-2 flex items-start gap-3">
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-gray-900 transition-colors group-hover:text-pink-600">
                        {article.title}
                      </h2>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {formatDate(article.created_at)}
                      </p>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-1 text-gray-300 transition-colors group-hover:text-pink-400"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>
                  <p className="line-clamp-2 text-sm leading-relaxed text-gray-500">
                    {article.summary}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Footer hint */}
        <div className="mt-10 text-center">
          <p className="text-xs text-gray-400">
            点击「生成新文章」让AI为你写一篇恋爱沟通技巧
          </p>
        </div>
      </div>
    </div>
  );
}
