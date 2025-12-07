import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GPT-4o-mini pricing (per 1M tokens)
const PRICING = {
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
};

async function trackApiUsage(
  userId: string | null,
  endpoint: string,
  model: string,
  inputTokens: number,
  outputTokens: number
) {
  try {
    const supabase = await createClient();
    const totalTokens = inputTokens + outputTokens;
    const pricing = PRICING[model as keyof typeof PRICING] || PRICING['gpt-4o-mini'];
    const costUsd = (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;

    await supabase.from('api_usage').insert({
      user_id: userId,
      endpoint,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      cost_usd: costUsd,
    });
  } catch (error) {
    console.error('Failed to track API usage:', error);
  }
}

type Step = 'education' | 'work' | 'skills' | 'pr' | 'complete';

// Helper function to convert YYYY-MM to YYYY-MM-01 format for database
function formatDateForDB(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // If in YYYY-MM format, add -01
  if (/^\d{4}-\d{2}$/.test(dateStr)) return `${dateStr}-01`;
  // If in other format, try to parse or return null
  return null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  message: string;
  currentStep: Step;
  resumeData: Record<string, unknown>;
  history: Message[];
}

const STEP_PROMPTS: Record<Step, string> = {
  education: `あなたは履歴書作成をサポートする親切なAIアシスタントです。フレンドリーで会話をリードしてください。
現在は「学歴」ステップです。

【絶対に守るルール】
1. 学歴情報を受け取ったら、必ず「職歴についての質問」をメッセージの最後に含めること
2. 確認だけで終わらず、必ず次の質問で会話を続けること
3. messageフィールドには「確認」と「次の質問」の両方を必ず含めること

【出力例 - このフォーマットを必ず守ること】
{
  "message": "ありがとうございます！東京大学 工学部ですね。学歴として登録しました！\\n\\nそれでは次に職歴についてお聞きします。\\nこれまでどんな会社でどんなお仕事をされてきましたか？\\n例えば「株式会社〇〇で営業職を3年」のように教えてください。\\n\\n（職歴がない場合は「なし」と入力してください）",
  "extractedData": { "education": [{ "schoolName": "東京大学", "faculty": "工学部", "degree": "学士", "startDate": "", "endDate": "" }] },
  "isStepComplete": true,
  "nextStep": "work"
}

【抽出する情報】
- schoolName: 学校名
- faculty: 学部・学科（高校の場合は科名）
- degree: 高卒/学士/修士/博士 など推測で設定

重要: messageには必ず「職歴について教えてください」という次の質問を含めてください。`,

  work: `あなたは履歴書作成をサポートする親切なAIアシスタントです。フレンドリーで会話をリードしてください。
現在は「職歴」ステップです。

【絶対に守るルール】
1. 職歴情報を受け取ったら、必ず「次の質問」をメッセージの最後に含めること
2. 確認だけで終わらず、必ず次の質問で会話を続けること
3. 「なし」「ない」の場合は、すぐにスキル・資格の質問へ進む

【出力例1: 職歴を受け取った時 - 次はスキルの質問をする】
{
  "message": "ありがとうございます！株式会社ABCで営業を3年されていたんですね。職歴として登録しました！\\n\\n続いてスキル・資格についてお聞きします。\\nお持ちのスキルや資格を教えてください。\\n（例：Excel、Word、普通自動車免許、TOEIC800点 など）\\n\\n特にない場合は「なし」と入力してください。",
  "extractedData": { "workHistories": [{ "companyName": "株式会社ABC", "position": "営業", "startDate": "", "endDate": "" }] },
  "isStepComplete": true,
  "nextStep": "skills"
}

【出力例2: 「なし」の場合】
{
  "message": "承知しました！\\n\\nではスキル・資格についてお聞きします。\\nお持ちのスキルや資格を教えてください。\\n（例：Excel、Word、普通自動車免許、TOEIC800点 など）\\n\\n特にない場合は「なし」と入力してください。",
  "extractedData": null,
  "isStepComplete": true,
  "nextStep": "skills"
}

【抽出する情報】
- companyName: 会社名
- position: 職種・役職
- startDate/endDate: 期間（わかれば）

重要: messageには必ず「スキル・資格について教えてください」という次の質問を含めてください。`,

  skills: `あなたは履歴書作成をサポートする親切なAIアシスタントです。フレンドリーで会話をリードしてください。
現在は「スキル・資格」ステップです。

【絶対に守るルール】
1. スキル・資格を受け取ったら、必ず「自己PRの質問」をメッセージの最後に含めること
2. 確認だけで終わらず、必ず次の質問で会話を続けること
3. 「なし」の場合も、自己PRの質問へ進む

【出力例 - このフォーマットを必ず守ること】
{
  "message": "ありがとうございます！以下のスキル・資格を登録しました：\\n・Excel\\n・PowerPoint\\n・普通自動車免許\\n\\nいよいよ最後のステップです！自己PRを作成しましょう。\\n\\nあなたの強みや、仕事で大切にしていることを教えてください。\\n（例：「コミュニケーション力が強み」「粘り強く最後までやり遂げる」など）\\n\\n入力いただいた内容をもとに、AIが自己PR文を作成します！",
  "extractedData": { "skills": ["Excel", "PowerPoint"], "certifications": ["普通自動車免許"] },
  "isStepComplete": true,
  "nextStep": "pr"
}

【抽出する情報】
- skills: スキル（Excel、プログラミングなど）
- certifications: 資格（免許、TOEIC、簿記など）

重要: messageには必ず「自己PRを作成しましょう」「強みを教えてください」という次の質問を含めてください。`,

  pr: `あなたは履歴書作成をサポートする親切なAIアシスタントです。
現在は「自己PR」ステップです。

【絶対に守るルール】
1. ユーザーの強みを元に、200-400字の魅力的な自己PR文を作成する
2. 作成したPRを提示し、完成を祝福するメッセージを含める
3. 必ず isStepComplete: true、nextStep: "complete" にする

【自己PR作成のコツ】
1. 強みを具体的に
2. エピソードがあれば活用
3. 「御社で〜に貢献したい」で締める

【出力例 - このフォーマットを必ず守ること】
{
  "message": "素晴らしいですね！以下の自己PRを作成しました：\\n\\n---\\n私の強みはコミュニケーション力です。相手の話を丁寧に聞き、ニーズを的確に把握することで、信頼関係を築くことができます。前職では、この力を活かしてお客様の課題を深く理解し、最適な提案を行ってまいりました。御社においても、チームメンバーやお客様との円滑なコミュニケーションを通じて、業務に貢献したいと考えております。\\n---\\n\\n🎉 履歴書の作成が完了しました！\\n右側のプレビューで全体を確認してください。\\n修正したい箇所があれば、お気軽にお知らせください。",
  "extractedData": { "selfPR": "私の強みはコミュニケーション力です。相手の話を丁寧に聞き..." },
  "isStepComplete": true,
  "nextStep": "complete"
}

重要: 自己PRは200-400字程度で作成し、messageとextractedData.selfPRの両方に含めてください。`,

  complete: `あなたは履歴書作成をサポートする親切なAIアシスタントです。
履歴書は完成しています。ユーザーが修正を希望する場合は対応してください。

【対応例】
- 「自己PRを変えて」→ 新しい自己PRを作成
- 「職歴を追加して」→ 追加情報を聞く
- 「スキルを増やしたい」→ 追加スキルを聞く

回答はJSON形式：
{
  "message": "修正対応のメッセージ",
  "extractedData": { /* 修正項目 */ },
  "isStepComplete": true,
  "nextStep": null
}`,
};

// Helper function to save extracted data to database
async function saveExtractedData(
  userId: string,
  extractedData: Record<string, unknown>
) {
  try {
    const supabase = await createClient();
    console.log('saveExtractedData called with:', JSON.stringify(extractedData, null, 2));

    // Get or create resume
    let { data: resume } = await supabase
      .from('resumes')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!resume) {
      const { data: newResume, error: createError } = await supabase
        .from('resumes')
        .insert({ user_id: userId })
        .select('id')
        .single();

      if (createError) {
        console.error('Failed to create resume:', createError);
        return;
      }
      resume = newResume;
    }

    if (!resume) {
      console.error('No resume found or created');
      return;
    }

    const resumeId = resume.id;
    console.log('Using resumeId:', resumeId);

    // Save education
    if (extractedData.education && Array.isArray(extractedData.education)) {
      const educationData = (extractedData.education as Array<{
        schoolName?: string;
        faculty?: string;
        degree?: string;
        startDate?: string;
        endDate?: string;
      }>).map(edu => ({
        school_name: edu.schoolName || '',
        faculty: edu.faculty || '',
        degree: edu.degree || '学士',
        start_date: formatDateForDB(edu.startDate),
        end_date: formatDateForDB(edu.endDate),
      }));

      console.log('Saving education:', educationData);
      const { error: eduError } = await supabase
        .from('resumes')
        .update({ education: educationData })
        .eq('id', resumeId);

      if (eduError) {
        console.error('Error saving education:', eduError);
      } else {
        console.log('Education saved successfully');
      }
    }

    // Save work histories
    if (extractedData.workHistories && Array.isArray(extractedData.workHistories)) {
      console.log('Processing work histories:', extractedData.workHistories);

      // Delete existing (by user_id to catch any orphaned entries)
      const { error: deleteError } = await supabase
        .from('work_histories')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting existing work histories:', deleteError);
      }

      const workData = (extractedData.workHistories as Array<{
        companyName?: string;
        position?: string;
        department?: string;
        startDate?: string;
        endDate?: string;
        isCurrent?: boolean;
        description?: string;
        achievements?: string;
      }>).map((work, index) => ({
        resume_id: resumeId,
        user_id: userId,
        company_name: work.companyName || '',
        position: work.position || '',
        department: work.department || null,
        start_date: formatDateForDB(work.startDate),
        end_date: formatDateForDB(work.endDate),
        is_current: work.isCurrent || false,
        description: work.description || null,
        achievements: work.achievements || null,
        display_order: index,
      }));

      console.log('Prepared work data for insert:', workData);

      if (workData.length > 0) {
        const { error: insertError } = await supabase
          .from('work_histories')
          .insert(workData);

        if (insertError) {
          console.error('Error inserting work histories:', insertError);
        } else {
          console.log('Work histories saved successfully');
        }
      }
    }

    // Save skills
    if (extractedData.skills && Array.isArray(extractedData.skills)) {
      console.log('Processing skills:', extractedData.skills);

      // Delete existing (by user_id to catch any orphaned entries)
      const { error: deleteSkillsError } = await supabase
        .from('skills')
        .delete()
        .eq('user_id', userId);

      if (deleteSkillsError) {
        console.error('Error deleting existing skills:', deleteSkillsError);
      }

      const skillsData = (extractedData.skills as string[]).filter(s => s).map(skill => ({
        resume_id: resumeId,
        user_id: userId,
        skill_name: skill,
        skill_type: 'hard',
      }));

      console.log('Prepared skills data for insert:', skillsData);

      if (skillsData.length > 0) {
        const { error: insertSkillsError } = await supabase
          .from('skills')
          .insert(skillsData);

        if (insertSkillsError) {
          console.error('Error inserting skills:', insertSkillsError);
        } else {
          console.log('Skills saved successfully');
        }
      }
    }

    // Save certifications
    if (extractedData.certifications && Array.isArray(extractedData.certifications)) {
      console.log('Saving certifications:', extractedData.certifications);
      const { error: certError } = await supabase
        .from('resumes')
        .update({ certifications: extractedData.certifications })
        .eq('id', resumeId);

      if (certError) {
        console.error('Error saving certifications:', certError);
      } else {
        console.log('Certifications saved successfully');
      }
    }

    // Save self PR
    if (extractedData.selfPR) {
      console.log('Saving selfPR:', extractedData.selfPR);
      const { error: prError } = await supabase
        .from('resumes')
        .update({ ai_self_pr: extractedData.selfPR as string })
        .eq('id', resumeId);

      if (prError) {
        console.error('Error saving selfPR:', prError);
      } else {
        console.log('Self PR saved successfully');
      }
    }

    // Save basic info (name, contact details, etc.)
    const basicInfoUpdate: Record<string, unknown> = {};

    if (extractedData.fullName) {
      basicInfoUpdate.full_name = extractedData.fullName;
    }
    if (extractedData.fullNameKana) {
      basicInfoUpdate.full_name_kana = extractedData.fullNameKana;
    }
    if (extractedData.birthDate) {
      basicInfoUpdate.birth_date = formatDateForDB(extractedData.birthDate as string);
    }
    if (extractedData.gender) {
      basicInfoUpdate.gender = extractedData.gender;
    }
    if (extractedData.postalCode) {
      basicInfoUpdate.postal_code = extractedData.postalCode;
    }
    if (extractedData.address) {
      basicInfoUpdate.address = extractedData.address;
    }
    if (extractedData.phone) {
      basicInfoUpdate.phone = extractedData.phone;
    }
    if (extractedData.email) {
      basicInfoUpdate.email = extractedData.email;
    }

    if (Object.keys(basicInfoUpdate).length > 0) {
      console.log('Saving basic info:', basicInfoUpdate);
      const { error: basicInfoError } = await supabase
        .from('resumes')
        .update(basicInfoUpdate)
        .eq('id', resumeId);

      if (basicInfoError) {
        console.error('Error saving basic info:', basicInfoError);
      } else {
        console.log('Basic info saved successfully');
      }
    }

    console.log('Finished saving extracted data:', Object.keys(extractedData));
  } catch (error) {
    console.error('Error saving extracted data:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { message, currentStep, resumeData, history } = body;

    // Validate currentStep - use 'education' as default if invalid
    const validSteps: Step[] = ['education', 'work', 'skills', 'pr', 'complete'];
    const safeCurrentStep: Step = validSteps.includes(currentStep) ? currentStep : 'education';

    console.log('Chat API called with:', {
      currentStep,
      safeCurrentStep,
      messageLength: message?.length,
      historyLength: history?.length
    });

    // Get current user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!process.env.OPENAI_API_KEY) {
      // Fallback response when no API key
      const fallbackResponse = createFallbackResponse(message, safeCurrentStep, resumeData);

      // Save extracted data to database
      if (user && fallbackResponse.extractedData) {
        await saveExtractedData(user.id, fallbackResponse.extractedData);
      }

      return NextResponse.json(fallbackResponse);
    }

    // Get system prompt with guaranteed non-null value
    let systemPrompt: string = STEP_PROMPTS[safeCurrentStep];

    // Final safety check - if somehow still null, use education prompt
    if (!systemPrompt || typeof systemPrompt !== 'string' || !systemPrompt.trim()) {
      console.error('SystemPrompt was null/empty, falling back to education. Step was:', safeCurrentStep);
      systemPrompt = STEP_PROMPTS.education;
    }

    // Build conversation history for context (filter out null/empty content)
    const conversationHistory = (history || [])
      .slice(-10)
      .filter(msg => msg && msg.content && typeof msg.content === 'string' && msg.content.trim())
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    // Ensure user message is valid
    const userMessage = (message && typeof message === 'string' && message.trim()) ? message : '続けてください';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: `現在の履歴書データ: ${JSON.stringify(resumeData || {})}。回答は必ずJSON形式(json format)で返してください。` },
        ...conversationHistory,
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1500,
    });

    // Track API usage
    if (response.usage) {
      await trackApiUsage(
        user?.id || null,
        '/api/chat/resume',
        'gpt-4o-mini',
        response.usage.prompt_tokens,
        response.usage.completion_tokens
      );
    }

    const aiResponse = response.choices[0].message.content;
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(aiResponse);

    // Save extracted data to database
    if (user && parsed.extractedData) {
      await saveExtractedData(user.id, parsed.extractedData);
    }

    return NextResponse.json({
      message: parsed.message,
      extractedData: parsed.extractedData || null,
      nextStep: parsed.isStepComplete ? parsed.nextStep : null,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'チャット処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

// Fallback responses when no OpenAI API key is set
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createFallbackResponse(message: string, currentStep: Step, resumeData: Record<string, unknown>) {
  // Check for skip keywords
  const skipKeywords = ['次へ', '次に', 'next', 'なし', 'ない', '特にない', 'skip'];
  const shouldSkip = skipKeywords.some(kw => message.toLowerCase().includes(kw.toLowerCase()));

  // Education step - always progress to work after receiving info
  if (currentStep === 'education') {
    if (shouldSkip) {
      return {
        message: `承知しました。では職歴についてお聞きします。

これまでどのような会社でお仕事をされてきましたか？
会社名と職種を教えてください。

（職歴がない場合は「なし」と入力してください）`,
        extractedData: null,
        nextStep: 'work' as Step,
      };
    }

    // Parse education from message
    const parts = message.split(/[\s　]+/);
    return {
      message: `ありがとうございます！「${message}」ですね。学歴として登録しました。

続いて職歴についてお聞きします。
これまでどのような会社でお仕事をされてきましたか？
会社名と職種を教えてください。

（職歴がない場合は「なし」と入力してください）`,
      extractedData: {
        education: [{
          schoolName: parts[0] || message,
          faculty: parts.slice(1).join(' ') || '',
          degree: '学士',
          startDate: '',
          endDate: '',
        }],
      },
      nextStep: 'work' as Step,
    };
  }

  // Work step
  if (currentStep === 'work') {
    if (shouldSkip) {
      return {
        message: `承知しました。ではスキル・資格についてお聞きします。

お持ちのスキルや資格を教えてください。
（例：JavaScript, Excel, 普通自動車免許 など）

（特にない場合は「なし」と入力してください）`,
        extractedData: null,
        nextStep: 'skills' as Step,
      };
    }

    return {
      message: `ありがとうございます！「${message}」ですね。職歴として登録しました。

続いてスキル・資格についてお聞きします。
お持ちのスキルや資格を教えてください。
（例：JavaScript, Excel, 普通自動車免許 など）`,
      extractedData: {
        workHistories: [{
          companyName: message.split(/[\s　]/)[0] || message,
          position: message.split(/[\s　]/).slice(1).join(' ') || '',
          department: '',
          startDate: '',
          endDate: '',
          isCurrent: false,
          description: '',
          achievements: '',
        }],
      },
      nextStep: 'skills' as Step,
    };
  }

  // Skills step
  if (currentStep === 'skills') {
    if (shouldSkip) {
      return {
        message: `承知しました。最後に自己PRを作成しましょう。

あなたの強みや、仕事で大切にしていることを教えてください。
AIがそれを元に自己PR文を作成します。`,
        extractedData: null,
        nextStep: 'pr' as Step,
      };
    }

    const skills = message.split(/[,、\s　]+/).filter(Boolean);
    return {
      message: `ありがとうございます！スキル・資格として登録しました。

最後に自己PRを作成しましょう。
あなたの強みや、仕事で大切にしていることを教えてください。`,
      extractedData: {
        skills: skills,
        certifications: [],
      },
      nextStep: 'pr' as Step,
    };
  }

  // PR step
  if (currentStep === 'pr') {
    const selfPR = message.length > 20
      ? message
      : `私の強みは${message}です。これまでの経験を活かし、御社に貢献したいと考えております。`;

    return {
      message: `素晴らしい自己PRですね！以下の内容で登録しました：

「${selfPR}」

お疲れさまでした！履歴書の作成が完了しました。
右側のプレビューで内容を確認してください。`,
      extractedData: {
        selfPR: selfPR,
      },
      nextStep: 'complete' as Step,
    };
  }

  // Complete step
  return {
    message: '履歴書の作成が完了しました！右側のプレビューで確認してください。',
    extractedData: null,
    nextStep: null,
  };
}
