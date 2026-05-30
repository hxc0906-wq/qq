// 游戏数据类型与常量

export type Gender = 'male' | 'female';

export interface Scenario {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface GameOption {
  text: string;
  scoreChange: number;
  isGood: boolean;
  learningTip: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'partner' | 'user';
  content: string;
  audioUrl?: string;
}

export interface RoundRecord {
  round: number;
  partnerMessage: string;
  selectedOption: GameOption;
  affectionBefore: number;
  affectionAfter: number;
}

export interface GameState {
  screen: 'home' | 'game' | 'end';
  gender: Gender | null;
  scenario: Scenario | null;
  speaker: string;
  messages: ChatMessage[];
  currentOptions: GameOption[] | null;
  affection: number;
  round: number;
  gameOver: boolean;
  won: boolean;
  showLearning: boolean;
  lastSelectedOption: GameOption | null;
  gameHistory: RoundRecord[];
  isLoading: boolean;
  loadError: boolean;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'anniversary',
    title: '忘记纪念日',
    description: '今天是你们在一起的周年纪念日，你完全没想起来，没有制造惊喜准备礼物',
    icon: '💔',
  },
  {
    id: 'no-reply',
    title: '晚上不回信息',
    description: '你晚上打游戏没看手机，对方发了十几条信息你都没回',
    icon: '📵',
  },
  {
    id: 'chatting',
    title: '被发现和异性聊天',
    description: '对方看到了你和异性的暧昧聊天记录',
    icon: '💬',
  },
  {
    id: 'lost-item',
    title: '把对方的重要物品弄丢了',
    description: '你不小心把对方心爱的物品丢失了',
    icon: '🎁',
  },
  {
    id: 'public-shame',
    title: '在人多的场合让对方没面子',
    description: '你在人多的场合开了一个过分的玩笑',
    icon: '🙈',
  },
];

export const GENDER_LABELS: Record<Gender, string> = {
  male: '男朋友',
  female: '女朋友',
};

// TTS 声音映射 - 按好感度区间切换声音来体现情绪变化
export const TTS_SPEAKERS: Record<Gender, Record<string, string>> = {
  female: {
    angry: 'zh_female_jitangnv_saturn_bigtts',       // 激昂女声 - 生气
    upset: 'zh_female_meilinvyou_saturn_bigtts',      // 魅力女友 - 委屈/生气
    softening: 'zh_female_santongyongns_saturn_bigtts', // 顺滑女声 - 软化
    almost: 'saturn_zh_female_keainvsheng_tob',       // 可爱女生 - 快哄好
    happy: 'saturn_zh_female_tiaopigongzhu_tob',      // 调皮公主 - 哄好
  },
  male: {
    angry: 'zh_male_dayi_saturn_bigtts',              // 大毅 - 生气
    upset: 'zh_male_m191_uranus_bigtts',              // 云洲 - 委屈/生气
    softening: 'zh_male_ruyayichen_saturn_bigtts',    // 儒雅 - 软化
    almost: 'saturn_zh_male_shuanglangshaonian_tob',   // 爽朗少年 - 快哄好
    happy: 'saturn_zh_male_tiancaitongzhuo_tob',       // 天才同桌 - 哄好
  },
};

export function getEmotionState(affection: number): string {
  if (affection <= 0) return 'very_angry';
  if (affection <= 30) return 'upset';
  if (affection <= 60) return 'softening';
  if (affection < 80) return 'almost';
  return 'happy';
}

export function getEmotionLabel(affection: number): string {
  if (affection <= 0) return '非常生气';
  if (affection <= 30) return '还在生气';
  if (affection <= 60) return '开始软化';
  if (affection < 80) return '快哄好了';
  return '哄好了';
}

export function getTTSSpeaker(gender: Gender, affection: number): string {
  const speakers = TTS_SPEAKERS[gender];
  if (affection <= 0) return speakers.angry;
  if (affection <= 30) return speakers.upset;
  if (affection <= 60) return speakers.softening;
  if (affection < 80) return speakers.almost;
  return speakers.happy;
}

export function getEmotionPrompt(affection: number): string {
  if (affection <= 0) {
    return '非常生气，语气冰冷或愤怒，甚至不想理对方';
  }
  if (affection <= 30) {
    return '还在生气但愿意听你说的话，语气中带着委屈和不甘';
  }
  if (affection <= 60) {
    return '开始软化，嘴上生气但语气缓和，偶尔会露出一点被感动的痕迹';
  }
  if (affection < 80) {
    return '快被哄好了，可能还有小情绪，但明显已经不那么生气了';
  }
  return '已经哄好了，开心甜蜜，但要对方保证以后不再犯';
}

export const INITIAL_GAME_STATE: GameState = {
  screen: 'home',
  gender: null,
  scenario: null,
  speaker: 'zh_female_xiaohe_uranus_bigtts',
  messages: [],
  currentOptions: null,
  affection: 0,
  round: 0,
  gameOver: false,
  won: false,
  showLearning: false,
  lastSelectedOption: null,
  gameHistory: [],
  isLoading: false,
  loadError: false,
};

export const MAX_ROUNDS = 10;
export const WIN_SCORE = 80;
export const MIN_SCORE = -50;
export const MAX_SCORE = 100;
