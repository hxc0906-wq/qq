import { NextRequest, NextResponse } from 'next/server';
import { TTSClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getTTSSpeaker, type Gender } from '@/lib/game-data';

export async function POST(request: NextRequest) {
  try {
    const { text, gender, affection }: { text: string; gender: Gender; affection: number } = await request.json();

    if (!text || !gender) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new TTSClient(config, customHeaders);

    const speaker = getTTSSpeaker(gender, affection);

    // 根据好感度调整语速：生气时稍快，软化时正常，开心时稍慢
    let speechRate = 0;
    if (affection <= 0) speechRate = 10;
    else if (affection <= 30) speechRate = 5;
    else if (affection <= 60) speechRate = 0;
    else if (affection < 80) speechRate = -5;
    else speechRate = -5;

    const response = await client.synthesize({
      uid: `user_${Date.now()}`,
      text,
      speaker,
      audioFormat: 'mp3',
      sampleRate: 24000,
      speechRate,
    });

    return NextResponse.json({ audioUri: response.audioUri });
  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json({ error: '语音合成失败' }, { status: 500 });
  }
}
