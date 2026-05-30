"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface BlogArticle {
  id: number;
  title: string;
  summary: string;
  content: string;
  created_at: string;
}

export default function BlogArticlePage() {
  const params = useParams<{ id: string }>();
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/blog/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setArticle(data.article);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) {
      fetchArticle();
    }
  }, [params.id]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-200 border-t-pink-500" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <Link
            href="/blog"
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-pink-100 px-4 py-2 text-sm text-pink-600 transition-colors hover:bg-pink-200"
          >
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
              <path d="m15 18-6-6 6-6" />
            </svg>
            返回攻略列表
          </Link>
          <div className="py-20 text-center text-gray-400">
            文章不存在或已删除
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Back button */}
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-2 rounded-full bg-pink-100 px-4 py-2 text-sm text-pink-600 transition-colors hover:bg-pink-200"
        >
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
            <path d="m15 18-6-6 6-6" />
          </svg>
          返回攻略列表
        </Link>

        {/* Article */}
        <article className="rounded-2xl border border-pink-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {article.title}
            </h1>
            <p className="mt-1 text-xs text-gray-400">
              {formatDate(article.created_at)}
            </p>
          </div>

          <div className="prose prose-pink max-w-none">
            {article.content.split("\n\n").map((paragraph, i) => (
              <p
                key={i}
                className="mb-4 text-base leading-relaxed text-gray-700"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </article>

        {/* Back to game hint */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-pink-500 px-6 py-3 text-sm font-medium text-white shadow-md transition-all hover:bg-pink-600 hover:shadow-lg"
          >
            去哄哄模拟器练练手
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
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
