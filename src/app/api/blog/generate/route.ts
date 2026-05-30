import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

// POST /api/blog/generate - 调用LLM生成新文章并保存到数据库
export async function POST() {
  try {
    const config = new Config();
    const client = new LLMClient(config);

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content:
          '你是一个恋爱沟通技巧作家，风格轻松幽默接地气，像朋友聊天一样。你写的文章能帮助恋爱经验不足的年轻人学会更好地与伴侣沟通。',
      },
      {
        role: 'user',
        content: `请写一篇关于恋爱沟通技巧的文章。要求：
1. 风格轻松幽默，像朋友聊天一样
2. 300-500字
3. 有具体例子和建议
4. 不要太学术
5. 结尾要有金句

请严格按以下JSON格式返回，不要加任何其他文字：
{"title":"文章标题","summary":"50字以内的摘要","content":"文章正文"}`,
      },
    ];

    let article: { title: string; summary: string; content: string } | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      const resp = await client.invoke(messages, {
        model: 'doubao-seed-2-0-mini-260215',
        temperature: 0.9,
      });

      const raw = resp.content.trim();
      try {
        // 尝试直接解析
        article = JSON.parse(raw);
      } catch {
        // 尝试从代码块中提取
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            article = JSON.parse(jsonMatch[0]);
          } catch {
            continue;
          }
        } else {
          continue;
        }
      }

      if (article?.title && article?.summary && article?.content) {
        break;
      }
      article = null;
    }

    if (!article) {
      return NextResponse.json({ error: 'LLM生成文章格式异常，请重试' }, { status: 500 });
    }

    // 保存到数据库
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        title: article.title,
        summary: article.summary,
        content: article.content,
      })
      .select()
      .single();

    if (error) throw new Error(`保存文章失败: ${error.message}`);

    return NextResponse.json({ article: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '生成文章失败';
    console.error('Blog generate error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
