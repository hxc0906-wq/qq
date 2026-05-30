import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/blog/[id] - 获取单篇文章详情
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id, 10);

    if (isNaN(numId)) {
      return NextResponse.json({ error: '无效的文章ID' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('blog_posts')
      .select('*')
      .eq('id', numId)
      .maybeSingle();

    if (error) throw new Error(`查询文章失败: ${error.message}`);
    if (!data) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    return NextResponse.json({ article: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取文章失败';
    console.error('Blog detail error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
