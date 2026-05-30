import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { getSession } from "@/lib/auth";

// POST: 保存游戏记录
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { scenario, final_score, result } = body;

    if (!scenario || final_score === undefined || !result) {
      return NextResponse.json(
        { error: "缺少必要字段" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("game_records")
      .insert({
        user_id: session.userId,
        scenario,
        final_score,
        result,
      })
      .select("id, scenario, final_score, result, played_at")
      .single();

    if (error) {
      console.error("保存游戏记录失败:", error);
      return NextResponse.json(
        { error: "保存失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, record: data });
  } catch (error) {
    console.error("保存游戏记录异常:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}

// GET: 获取当前用户的游戏记录
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("game_records")
      .select("id, scenario, final_score, result, played_at")
      .eq("user_id", session.userId)
      .order("played_at", { ascending: false });

    if (error) {
      console.error("查询游戏记录失败:", error);
      return NextResponse.json(
        { error: "查询失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({ records: data || [] });
  } catch (error) {
    console.error("查询游戏记录异常:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
