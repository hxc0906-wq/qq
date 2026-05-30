import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { getEmotionPrompt, type Gender, type Scenario } from '@/lib/game-data';

interface GameOptionResult {
  text: string;
  scoreChange: number;
  isGood: boolean;
  learningTip: string | null;
}

interface LLMResult {
  reply: string;
  options: GameOptionResult[];
}

function buildSystemPrompt(genderLabel: string, scenario: Scenario, affection: number, round: number, emotionPrompt: string): string {
  const maxRound = 10;
  const isLateGame = round >= 7;

  return `你是"${genderLabel}"，正在因为"${scenario.title}"而生气。${scenario.description}

【角色规则】
- 你就是这个人，不是AI，不是游戏角色，不要说"作为""我是AI"等
- 所有回复用第一人称，像微信聊天一样口语化
- 情绪必须匹配好感度${affection}：${emotionPrompt}
- 好感度≤0非常生气（可能骂人或沉默）→0~30委屈冷落→30~60嘴硬心软→60~80快哄好但还有小脾气→≥80基本哄好

【关键：对话连贯性】
- 这是同一场对话的连续第${round}轮，必须承接上一轮的内容
- ${isLateGame ? '已到后期，如果好感度高了就表现出明显的软化迹象，如果还低就更加绝望' : ''}
- 对方说了什么你要有具体回应，不能每次都重新开场
- 不要重复之前说过的话，不要反复问同一个问题
- 你的情绪要因为对方的每句话产生变化：对方说得好→你稍微缓和；对方说得差→你更生气

【关键：不要重复选项】
- 严禁出现和之前任何轮次相似的选项
- 加分选项要针对当前话题做出具体回应，不是泛泛的"对不起"
- 减分选项要结合当前语境，不要每次都用一样的梗

【输出格式】只返回JSON：
{"reply":"你说的话","options":[{"text":"对方可能说的话","scoreChange":10,"isGood":true,"learningTip":null},{"text":"对方可能说的话","scoreChange":-10,"isGood":false,"learningTip":"为什么不好+更好做法"}]}

【关键：选项是对方（哄你的人）说的话，不是你说的话】
- reply是你（生气的人）说的话
- options是对方（哄你的人）可能说的话，是对方回应你的选项
- 选项必须以第一人称写出对方说的话，如"对不起我错了""别生气了好不好"
- 严禁选项中出现你说的话（如"我才不信你""你别说了"），选项只能是对方对你说的

6个选项（2加分+4减分），随机排列：
- 2个加分(isGood:true,scoreChange:+5~+20,learningTip:null)：对方真诚道歉/具体弥补/提起共同回忆/承诺改变，让你听了心里舒服
- 4个减分(isGood:false,scoreChange:-5~-20,learningTip必填)：
  · 1~2个普通减分：对方敷衍/找借口/转移话题/轻视你的感受
  · 2~3个搞笑减分：对方用热梗敷衍（如"如何呢又能怎""疯狂星期四V你50""你说的对但我不听"等）
- "不至于吧""有什么好生气的""你先冷静"等轻视感受→必须是减分！
- 严禁PUA/打压式加分选项。严禁低俗色情暴力。`;
}

function buildUserMessage(round: number, selectedOption: string | undefined, affectionChange: number | undefined): string {
  if (round === 1) {
    return '（游戏开始，你正在生气，用第一句话开场，并给出6个选项——选项是对方（哄你的人）可能说的话）';
  }

  let msg = `对方选择了："${selectedOption}"`;

  if (affectionChange !== undefined && affectionChange > 0) {
    msg += `\n（这个回答让你稍微好受了一点，好感度+${affectionChange}，但你还不能完全原谅）`;
  } else if (affectionChange !== undefined && affectionChange < 0) {
    msg += `\n（这个回答让你更生气了，好感度${affectionChange}，你更不想理对方了）`;
  }

  msg += '\n请根据对方的话做出回应（你说的话放在reply），然后给出6个选项（选项是对方可能说的话）。';
  return msg;
}

function parseJSON(raw: string): LLMResult | null {
  const content = raw.trim();

  // 尝试1: 直接解析
  try { return JSON.parse(content); } catch { /* continue */ }

  // 尝试2: 提取 ```json ... ``` 代码块
  try {
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch?.[1]) return JSON.parse(codeBlockMatch[1].trim());
  } catch { /* continue */ }

  // 尝试3: 提取最外层 { }
  try {
    const braceMatch = content.match(/\{[\s\S]*\}/);
    if (braceMatch) return JSON.parse(braceMatch[0]);
  } catch { /* continue */ }

  // 尝试4: 修复常见问题 - 尾部多余逗号
  try {
    const braceMatch = content.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      const fixed = braceMatch[0].replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(fixed);
    }
  } catch { /* continue */ }

  // 尝试5: 修复被截断的JSON - 补全缺失的括号
  try {
    const braceMatch = content.match(/\{[\s\S]*/);
    if (braceMatch) {
      let partial = braceMatch[0];
      let openBraces = 0;
      let openBrackets = 0;
      let inString = false;
      let escape = false;
      for (const ch of partial) {
        if (escape) { escape = false; continue; }
        if (ch === '\\' && inString) { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{') openBraces++;
        if (ch === '}') openBraces--;
        if (ch === '[') openBrackets++;
        if (ch === ']') openBrackets--;
      }
      if (inString) partial += '"';
      partial = partial.replace(/,\s*$/, '');
      const lastCompleteObj = partial.lastIndexOf('"},');
      if (lastCompleteObj > -1) {
        let truncated = partial.substring(0, lastCompleteObj + 2);
        truncated += ']';
        openBraces = 0;
        openBrackets = 0;
        inString = false;
        escape = false;
        for (const ch of truncated) {
          if (escape) { escape = false; continue; }
          if (ch === '\\' && inString) { escape = true; continue; }
          if (ch === '"') { inString = !inString; continue; }
          if (inString) continue;
          if (ch === '{') openBraces++;
          if (ch === '}') openBraces--;
          if (ch === '[') openBrackets++;
          if (ch === ']') openBrackets--;
        }
        for (let i = 0; i < openBrackets; i++) truncated += ']';
        for (let i = 0; i < openBraces; i++) truncated += '}';
        return JSON.parse(truncated);
      }
    }
  } catch { /* continue */ }

  return null;
}

function validateAndFixOptions(options: GameOptionResult[]): GameOptionResult[] {
  const trimmed = options.slice(0, 6);

  const fixed = trimmed.map((o) => {
    const scoreChange = Math.max(-20, Math.min(20, Number(o.scoreChange) || 0));
    if (o.isGood) {
      return {
        text: o.text,
        scoreChange: Math.max(5, Math.min(20, Math.abs(scoreChange))),
        isGood: true as const,
        learningTip: null,
      };
    }
    return {
      text: o.text,
      scoreChange: -Math.max(5, Math.min(20, Math.abs(scoreChange))),
      isGood: false as const,
      learningTip: o.learningTip || '这样说可能不太合适，试试更真诚地表达。',
    };
  });

  const goodCount = fixed.filter((o) => o.isGood).length;

  if (goodCount < 2) {
    const badOptions = fixed.filter((o) => !o.isGood).sort((a, b) => Math.abs(a.scoreChange) - Math.abs(b.scoreChange));
    for (let i = 0; i < 2 - goodCount && i < badOptions.length; i++) {
      const idx = fixed.indexOf(badOptions[i]);
      fixed[idx] = {
        text: fixed[idx].text,
        scoreChange: 10,
        isGood: true,
        learningTip: null,
      };
    }
  }

  if (goodCount > 2) {
    const goodOptions = fixed.filter((o) => o.isGood).sort((a, b) => a.scoreChange - b.scoreChange);
    for (let i = 0; i < goodCount - 2 && i < goodOptions.length; i++) {
      const idx = fixed.indexOf(goodOptions[i]);
      fixed[idx] = {
        text: fixed[idx].text,
        scoreChange: -10,
        isGood: false,
        learningTip: '这样说可能不太合适，试试更真诚的方式。',
      };
    }
  }

  // 打乱选项顺序
  for (let i = fixed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [fixed[i], fixed[j]] = [fixed[j], fixed[i]];
  }

  return fixed;
}

// 生成兜底选项（当LLM完全失败时使用）
function generateFallbackReply(scenario: Scenario, genderLabel: string, affection: number, round: number): LLMResult {
  const emotionPrompt = getEmotionPrompt(affection);
  const fallbackReplies: Record<string, string[]> = {
    anniversary: [
      '（冷冷地看着你）你还知道回来？今天什么日子你忘了吧？',
      '（摔门）纪念日都能忘，我在你心里算什么？',
      '（眼圈泛红）我就知道你不会记得的……',
    ],
    'no-reply': [
      '（手机摔在沙发上）十几条消息都不回，你跟手机也冷战吗？',
      '（咬牙切齿）我还以为你出事了呢，结果在打游戏？',
      '（红着眼）我等了你一整晚，你连个标点符号都不给我？',
    ],
    chatting: [
      '（把手机甩过来）你自己看看这些聊天记录！你觉得合适吗？',
      '（发抖）我怎么也没想到你会跟别人这样聊天……',
      '（冷笑）解释一下吧，我听着呢。',
    ],
    'lost-item': [
      '（翻箱倒柜）我的东西呢？你放哪儿了？！',
      '（急得快哭了）那对我来说很重要的你知道吗？',
      '（愣住）你……你把它弄丢了？',
    ],
    'public-shame': [
      '（拉着你的手小声说）你能不能别在别人面前这样说我……',
      '（低头不说话，脸涨得通红）你太过分了……',
      '（红着眼眶）你当着那么多人的面让我下不来台，你知不知道我多难堪？',
    ],
  };

  const scenarioReplies = fallbackReplies[scenario.id] || fallbackReplies.anniversary;
  const replyIndex = Math.min(round - 1, scenarioReplies.length - 1);

  return {
    reply: scenarioReplies[replyIndex] || `（${emotionPrompt}）你到底想说什么？`,
    options: [
      { text: '对不起，我真的知道错了，以后一定注意', scoreChange: 12, isGood: true, learningTip: null },
      { text: '别生气了好不好，我带你去吃好吃的', scoreChange: 8, isGood: true, learningTip: null },
      { text: '你先冷静一下行不行', scoreChange: -10, isGood: false, learningTip: '让对方冷静其实是变相推卸责任，不如先自己冷静想想错在哪，主动承认' },
      { text: '至于这么生气吗', scoreChange: -15, isGood: false, learningTip: '轻视对方感受是大忌，对方会认为你根本不在乎，应该先承认对方的情绪是合理的' },
      { text: '如何呢，又能怎样', scoreChange: -20, isGood: false, learningTip: '挑衅态度只会火上浇油，即使觉得委屈也要先放下态度，等对方情绪缓和再沟通' },
      { text: '疯狂星期四V我50这事就翻篇了', scoreChange: -18, isGood: false, learningTip: '用梗敷衍说明你根本没把问题当回事，真诚面对才是正确做法' },
    ],
  };
}

async function invokeLLM(client: LLMClient, messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): Promise<string> {
  // 优先使用 invoke 快速获取完整响应，失败再回退 stream
  try {
    const response = await client.invoke(messages, {
      model: 'doubao-seed-2-0-mini-260215',
      temperature: 0.8,
    });
    if (response?.content) return response.content;
  } catch {
    // invoke 失败，回退 stream
  }

  // stream 作为 fallback
  const stream = client.stream(messages, {
    model: 'doubao-seed-2-0-mini-260215',
    temperature: 0.8,
  });

  let fullContent = '';
  for await (const chunk of stream) {
    if (chunk.content) {
      fullContent += chunk.content.toString();
    }
  }
  return fullContent;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      gender,
      scenario,
      affection,
      round,
      chatHistory,
      selectedOption,
      affectionChange,
    }: {
      gender: Gender;
      scenario: Scenario;
      affection: number;
      round: number;
      chatHistory: Array<{ role: string; content: string }>;
      selectedOption?: string;
      affectionChange?: number;
    } = body;

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    const genderLabel = gender === 'male' ? '男朋友' : '女朋友';
    const emotionPrompt = getEmotionPrompt(affection);
    const systemPrompt = buildSystemPrompt(genderLabel, scenario, affection, round, emotionPrompt);

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // 发送完整聊天历史，让LLM知道之前说了什么，避免重复
    // partner = assistant, user = user
    for (const msg of chatHistory) {
      messages.push({
        role: msg.role === 'partner' ? 'assistant' as const : 'user' as const,
        content: msg.content,
      });
    }

    // 添加当前轮次的用户消息
    const userMsg = buildUserMessage(round, selectedOption, affectionChange);
    messages.push({ role: 'user', content: userMsg });

    // 最多重试2次
    let result: LLMResult | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const rawContent = await invokeLLM(client, messages);
        result = parseJSON(rawContent);

        if (result && result.reply && Array.isArray(result.options) && result.options.length >= 2) {
          break;
        }

        result = null;
      } catch (err) {
        console.error('LLM attempt failed:', err);
      }
    }

    // 如果LLM完全失败，使用兜底回复
    if (!result || !result.reply || !Array.isArray(result.options) || result.options.length < 2) {
      result = generateFallbackReply(scenario, genderLabel, affection, round);
    }

    const options = validateAndFixOptions(result.options);

    return NextResponse.json({ reply: result.reply, options });
  } catch (error) {
    console.error('Chat API error:', error);
    try {
      const rawBody = await new Request(request.clone()).text().catch(() => '');
      const body = JSON.parse(rawBody || '{}');
      if (body?.scenario) {
        const genderLabel = body.gender === 'male' ? '男朋友' : '女朋友';
        const fallback = generateFallbackReply(body.scenario, genderLabel, body.affection || 0, body.round || 1);
        return NextResponse.json({ reply: fallback.reply, options: validateAndFixOptions(fallback.options) });
      }
    } catch { /* fallback failed */ }
    return NextResponse.json({ error: '服务器错误，请重试' }, { status: 500 });
  }
}
