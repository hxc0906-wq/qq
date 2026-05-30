import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/blog - 获取所有文章列表（标题+摘要）
export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('blog_posts')
      .select('id, title, summary, created_at')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`查询文章列表失败: ${error.message}`);

    return NextResponse.json({ articles: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取文章列表失败';
    console.error('Blog list error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/blog - 新增一篇文章
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, summary, content } = body;

    if (!title || !summary || !content) {
      return NextResponse.json(
        { error: '缺少必填字段: title, summary, content' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('blog_posts')
      .insert({ title, summary, content })
      .select()
      .single();

    if (error) throw new Error(`新增文章失败: ${error.message}`);

    return NextResponse.json({ article: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '新增文章失败';
    console.error('Blog create error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
