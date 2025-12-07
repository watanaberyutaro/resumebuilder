import openai, { AI_MODEL, calculateCostJPY } from './client';
import type { Resume, WorkHistory, Skill } from '@/types/database';

export interface ResumeInput {
  resume: Resume;
  workHistories: WorkHistory[];
  skills: Skill[];
  language?: string;
}

export interface GeneratedContent {
  summary: string;
  selfPR: string;
  careerObjective: string;
  workDescriptions: { workHistoryId: string; description: string; achievements: string }[];
}

export interface GenerationResult {
  content: GeneratedContent;
  usage: {
    inputTokens: number;
    outputTokens: number;
    costJPY: number;
  };
}

const SYSTEM_PROMPT = `あなたは日本の転職市場に精通したプロのキャリアアドバイザーです。
履歴書・職務経歴書の作成をサポートします。

以下のガイドラインに従ってください：
1. ビジネス文書として適切な丁寧語を使用
2. 具体的な数値や実績を重視
3. 応募者の強みが伝わるよう表現
4. 画一的なテンプレートを避け、個性を反映
5. 業界・職種に適した専門用語を適切に使用

出力は必ず指定されたJSON形式で返してください。`;

const GENERATION_PROMPT = `以下の情報を基に、履歴書・職務経歴書の各セクションを作成してください。

【候補者情報】
氏名: {fullName}
年齢: {age}歳
希望職種: {desiredCategory}
希望業界: {desiredIndustries}

【職務経歴】
{workHistories}

【保有スキル】
{skills}

【出力言語】
{language}

以下のJSON形式で出力してください：
{
  "summary": "3-4行程度の職務要約。経験年数、得意分野、強みを簡潔に",
  "selfPR": "5-7行程度の自己PR。具体的なエピソードや数値を含める",
  "careerObjective": "3-4行程度の志望動機（業界・職種ベース、特定企業名は出さない）",
  "workDescriptions": [
    {
      "workHistoryId": "職歴ID",
      "description": "担当業務の詳細説明（3-5行）",
      "achievements": "成果・実績（数値を含めて2-3行）"
    }
  ]
}`;

export async function generateResumeContent(input: ResumeInput): Promise<GenerationResult> {
  const { resume, workHistories, skills, language = '日本語' } = input;

  const age = resume.birth_date
    ? Math.floor((new Date().getTime() - new Date(resume.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : '不明';

  const workHistoriesText = workHistories
    .map((wh, i) => `
${i + 1}. ${wh.company_name}（${wh.industry || '業界不明'}）
   役職: ${wh.position || '不明'}
   期間: ${wh.start_date || '不明'} 〜 ${wh.is_current ? '現在' : wh.end_date || '不明'}
   業務内容（本人記載）: ${wh.description || 'なし'}
   実績（本人記載）: ${wh.achievements || 'なし'}
   ID: ${wh.id}`)
    .join('\n');

  const skillsText = skills
    .map(s => `- ${s.skill_name}（${s.skill_type === 'hard' ? '技術' : 'ソフト'}スキル、経験${s.years_of_experience || '?'}年）`)
    .join('\n');

  const prompt = GENERATION_PROMPT
    .replace('{fullName}', resume.full_name || '不明')
    .replace('{age}', String(age))
    .replace('{desiredCategory}', resume.desired_job_category || '不明')
    .replace('{desiredIndustries}', resume.desired_industries?.join('、') || '不明')
    .replace('{workHistories}', workHistoriesText || 'なし')
    .replace('{skills}', skillsText || 'なし')
    .replace('{language}', language);

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 2000,
  });

  const content = JSON.parse(response.choices[0].message.content || '{}') as GeneratedContent;
  const inputTokens = response.usage?.prompt_tokens || 0;
  const outputTokens = response.usage?.completion_tokens || 0;

  return {
    content,
    usage: {
      inputTokens,
      outputTokens,
      costJPY: calculateCostJPY(inputTokens, outputTokens),
    },
  };
}

// Chat-based editing
export interface ChatEditRequest {
  currentContent: string;
  userInstruction: string;
  contentType: 'summary' | 'selfPR' | 'careerObjective' | 'workDescription';
  chatHistory?: { role: 'user' | 'assistant'; content: string }[];
}

export interface ChatEditResult {
  editedContent: string;
  explanation: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    costJPY: number;
  };
}

const CHAT_EDIT_SYSTEM_PROMPT = `あなたは履歴書・職務経歴書の編集をサポートするアシスタントです。
ユーザーの指示に従って文章を修正します。

ルール：
1. 元の文章の良い部分は残しつつ、指示に沿った修正を行う
2. ビジネス文書として適切なトーンを維持
3. 具体性や数値は可能な限り保持
4. 修正理由を簡潔に説明

出力は以下のJSON形式で：
{
  "editedContent": "修正後の文章",
  "explanation": "修正のポイントを1-2文で説明"
}`;

export async function editWithChat(request: ChatEditRequest): Promise<ChatEditResult> {
  const { currentContent, userInstruction, contentType, chatHistory = [] } = request;

  const contentTypeLabel = {
    summary: '職務要約',
    selfPR: '自己PR',
    careerObjective: '志望動機',
    workDescription: '職務内容',
  }[contentType];

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: CHAT_EDIT_SYSTEM_PROMPT },
    ...chatHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    {
      role: 'user',
      content: `【現在の${contentTypeLabel}】\n${currentContent}\n\n【修正指示】\n${userInstruction}`,
    },
  ];

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages,
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 1000,
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  const inputTokens = response.usage?.prompt_tokens || 0;
  const outputTokens = response.usage?.completion_tokens || 0;

  return {
    editedContent: result.editedContent || currentContent,
    explanation: result.explanation || '',
    usage: {
      inputTokens,
      outputTokens,
      costJPY: calculateCostJPY(inputTokens, outputTokens),
    },
  };
}

// Career recall assistant
export interface RecallQuestionResult {
  question: string;
  followUpPrompts: string[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    costJPY: number;
  };
}

const RECALL_SYSTEM_PROMPT = `あなたは転職希望者のキャリアを深掘りするインタビュアーです。
候補者の職歴情報を見て、思い出しやすい質問をします。

目的：
- 候補者が忘れている実績やエピソードを引き出す
- 数値化できる成果を思い出させる
- 職務経歴書に書ける具体的なエピソードを見つける

出力は以下のJSON形式で：
{
  "question": "思い出しを促す質問（1つ）",
  "followUpPrompts": ["回答例1", "回答例2", "回答例3"]
}`;

export async function generateRecallQuestion(
  workHistory: WorkHistory,
  previousAnswers: string[] = []
): Promise<RecallQuestionResult> {
  const previousContext = previousAnswers.length > 0
    ? `\n\n【これまでの回答】\n${previousAnswers.join('\n')}`
    : '';

  const prompt = `【職歴情報】
会社: ${workHistory.company_name}
役職: ${workHistory.position || '不明'}
期間: ${workHistory.start_date} 〜 ${workHistory.is_current ? '現在' : workHistory.end_date}
業務概要: ${workHistory.description || 'なし'}${previousContext}

上記を踏まえて、候補者が実績を思い出しやすい質問を1つ生成してください。`;

  const response = await openai.chat.completions.create({
    model: AI_MODEL,
    messages: [
      { role: 'system', content: RECALL_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.8,
    max_tokens: 500,
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  const inputTokens = response.usage?.prompt_tokens || 0;
  const outputTokens = response.usage?.completion_tokens || 0;

  return {
    question: result.question || '',
    followUpPrompts: result.followUpPrompts || [],
    usage: {
      inputTokens,
      outputTokens,
      costJPY: calculateCostJPY(inputTokens, outputTokens),
    },
  };
}
