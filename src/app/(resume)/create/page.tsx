'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Send, Download, Loader2, ArrowLeft, FileText, Edit, RotateCcw, CheckCircle } from 'lucide-react';
import { ResumePreview } from '@/components/resume/resume-preview';
import { toast } from '@/components/ui/toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ResumeData {
  fullName: string;
  fullNameKana: string;
  birthDate: string;
  postalCode: string;
  address: string;
  phone: string;
  email: string;
  photoUrl?: string | null;
  photoProcessedUrl?: string | null;
  education: Education[];
  workHistories: WorkHistory[];
  skills: string[];
  certifications: string[];
  selfPR: string;
  careerObjective: string;
}

interface Education {
  schoolName: string;
  faculty: string;
  degree: string;
  startDate: string;
  endDate: string;
}

interface WorkHistory {
  companyName: string;
  position: string;
  department: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  achievements: string;
}

type Step = 'education' | 'work' | 'skills' | 'pr' | 'complete';

// Initial mode for showing choice when session exists
type InitialMode = 'loading' | 'choice' | 'chat';

interface ExistingSession {
  id: string;
  isCompleted: boolean;
  currentStep: Step;
}

const getInitialMessage = (hasEducation: boolean, hasWork: boolean, hasSkills: boolean, hasPR: boolean): Message => {
  if (hasPR) {
    return {
      id: '0',
      role: 'assistant',
      content: `おかえりなさい！履歴書の作成は完了しています。

右側のプレビューで内容を確認してください。
修正したい箇所があれば、お知らせください。`,
    };
  }

  if (hasSkills) {
    return {
      id: '0',
      role: 'assistant',
      content: `おかえりなさい！前回の続きからですね。

学歴・職歴・スキルは保存されています。
最後に自己PRを作成しましょう。

あなたの強みや、仕事で大切にしていることを教えてください。`,
    };
  }

  if (hasWork) {
    return {
      id: '0',
      role: 'assistant',
      content: `おかえりなさい！前回の続きからですね。

学歴と職歴は保存されています。
続いてスキル・資格についてお聞きします。

お持ちのスキルや資格を教えてください。
（例：JavaScript, Excel, 普通自動車免許 など）`,
    };
  }

  if (hasEducation) {
    return {
      id: '0',
      role: 'assistant',
      content: `おかえりなさい！前回の続きからですね。

学歴は保存されています。
続いて職歴についてお聞きします。

これまでどのような会社でお仕事をされてきましたか？
会社名と職種を教えてください。`,
    };
  }

  return {
    id: '0',
    role: 'assistant',
    content: `こんにちは！履歴書作成をお手伝いします。

基本情報は登録時に入力いただいた内容を使用します。
これから以下の順番でお聞きしていきますね：

1. 学歴 - 最終学歴について
2. 職歴 - これまでの仕事について
3. スキル・資格 - お持ちのスキルや資格
4. 自己PR - あなたの強み

まずは学歴からお聞きします。
最終学歴の学校名と学部・学科を教えてください。
（例：「東京大学 工学部 情報工学科」）`,
  };
};

// Generate appropriate message based on current step
const generateResumeMessage = (step: Step, hasEducation: boolean, hasWork: boolean, hasSkills: boolean, hasPR: boolean): Message => {
  switch (step) {
    case 'complete':
      return {
        id: '0',
        role: 'assistant',
        content: `おかえりなさい！履歴書の作成は完了しています。

右側のプレビューで内容を確認してください。
修正したい箇所があれば、お知らせください。`,
      };
    case 'pr':
      return {
        id: '0',
        role: 'assistant',
        content: `おかえりなさい！前回の続きからですね。

学歴・職歴・スキルは保存されています。
最後に自己PRを作成しましょう。

あなたの強みや、仕事で大切にしていることを教えてください。`,
      };
    case 'skills':
      return {
        id: '0',
        role: 'assistant',
        content: `おかえりなさい！前回の続きからですね。

${hasEducation ? '学歴' : ''}${hasEducation && hasWork ? 'と' : ''}${hasWork ? '職歴' : ''}は保存されています。
続いてスキル・資格についてお聞きします。

お持ちのスキルや資格を教えてください。
（例：JavaScript, Excel, 普通自動車免許 など）`,
      };
    case 'work':
      return {
        id: '0',
        role: 'assistant',
        content: `おかえりなさい！前回の続きからですね。

学歴は保存されています。
続いて職歴についてお聞きします。

これまでどのような会社でお仕事をされてきましたか？
会社名と職種を教えてください。`,
      };
    case 'education':
    default:
      return getInitialMessage(hasEducation, hasWork, hasSkills, hasPR);
  }
};

const STEP_LABELS: Record<Step, string> = {
  education: '学歴',
  work: '職歴',
  skills: 'スキル・資格',
  pr: '自己PR',
  complete: '完了',
};

export default function CreateResumePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get('session');
  const actionParam = searchParams.get('action'); // 'edit' or 'restart'

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(sessionIdParam);
  const [initialMode, setInitialMode] = useState<InitialMode>('loading');
  const [existingSession, setExistingSession] = useState<ExistingSession | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData>({
    fullName: '',
    fullNameKana: '',
    birthDate: '',
    postalCode: '',
    address: '',
    phone: '',
    email: '',
    photoUrl: null,
    photoProcessedUrl: null,
    education: [],
    workHistories: [],
    skills: [],
    certifications: [],
    selfPR: '',
    careerObjective: '',
  });
  const [currentStep, setCurrentStep] = useState<Step>('education');
  const [showPreview, setShowPreview] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  // Load existing session - returns session data if found
  const loadSession = useCallback(async (id: string): Promise<{ step: Step; messages: Message[]; isCompleted: boolean } | null> => {
    try {
      console.log('[loadSession] Loading session:', id);
      const response = await fetch(`/api/chat/sessions/${id}`);

      if (!response.ok) {
        console.error('[loadSession] Session fetch failed:', response.status);
        return null;
      }

      const data = await response.json();
      console.log('[loadSession] Response:', { session: !!data.session, messagesCount: data.messages?.length });

      if (data.session) {
        // Convert DB messages to local format
        const loadedMessages: Message[] = (data.messages || []).map((m: { id: string; role: 'user' | 'assistant'; content: string }) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

        const step = (data.session.current_step as Step) || 'education';
        const isCompleted = data.session.is_completed || false;
        console.log('[loadSession] Loaded:', { step, messagesCount: loadedMessages.length, isCompleted });

        return { step, messages: loadedMessages, isCompleted };
      }

      return null;
    } catch (error) {
      console.error('[loadSession] Error:', error);
      return null;
    }
  }, []);

  // Handle restart - delete session and all related data
  const handleRestart = async () => {
    // Use current sessionId or existingSession.id
    const currentSessionId = sessionId || existingSession?.id;

    if (!confirm('履歴書を最初から作り直しますか？\n入力済みのデータは全て削除されます。')) {
      return;
    }

    setIsRestarting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Delete session (cascades to messages) if exists
      if (currentSessionId) {
        await fetch(`/api/chat/sessions/${currentSessionId}`, {
          method: 'DELETE',
        });
      }

      // Delete work histories
      await supabase.from('work_histories').delete().eq('user_id', user.id);

      // Delete skills
      await supabase.from('skills').delete().eq('user_id', user.id);

      // Reset resume data
      await supabase
        .from('resumes')
        .update({
          education: [],
          ai_self_pr: null,
          ai_summary: null,
          ai_career_objective: null,
          certifications: [],
          languages: [],
        })
        .eq('user_id', user.id);

      // Create new session
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '履歴書作成' }),
      });
      const data = await response.json();

      if (data.session) {
        // Reset local state
        setSessionId(data.session.id);
        setCurrentStep('education');
        setResumeData(prev => ({
          ...prev,
          education: [],
          workHistories: [],
          skills: [],
          certifications: [],
          selfPR: '',
          careerObjective: '',
          photoUrl: prev.photoUrl,
          photoProcessedUrl: prev.photoProcessedUrl,
        }));

        const initialMsg = getInitialMessage(false, false, false, false);
        setMessages([initialMsg]);

        // Save initial message
        await fetch(`/api/chat/sessions/${data.session.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'assistant',
            content: initialMsg.content,
          }),
        });

        // Update URL
        window.history.replaceState(null, '', `/create?session=${data.session.id}`);
        setInitialMode('chat');
        toast.success('履歴書をリセットしました');
      }
    } catch (error) {
      console.error('Error restarting:', error);
      toast.error('リセットに失敗しました');
    } finally {
      setIsRestarting(false);
    }
  };

  // Handle edit - continue with existing session
  const handleEdit = async () => {
    if (!existingSession?.id) return;

    setSessionId(existingSession.id);
    const sessionData = await loadSession(existingSession.id);

    if (sessionData) {
      setCurrentStep(sessionData.step);

      // Load all existing messages
      const existingMessages = sessionData.messages.length > 0 ? sessionData.messages : [];

      // Add a new message asking which part to edit
      const editPromptMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `履歴書の編集ですね。これまでのやり取りを確認できます。

現在の履歴書には以下の内容が含まれています：
${resumeData.education.length > 0 ? '✓ 学歴' : ''}
${resumeData.workHistories.length > 0 ? '✓ 職歴' : ''}
${resumeData.skills.length > 0 ? '✓ スキル・資格' : ''}
${resumeData.selfPR ? '✓ 自己PR' : ''}

どの部分を編集しますか？
例えば以下のように教えてください：
・「自己PRをもっと具体的にして」
・「職歴の書き方を変えて」
・「スキルを追加したい」`,
      };

      setMessages([...existingMessages, editPromptMessage]);

      // Save the edit prompt message
      await fetch(`/api/chat/sessions/${existingSession.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'assistant',
          content: editPromptMessage.content,
        }),
      });
    }

    window.history.replaceState(null, '', `/create?session=${existingSession.id}`);
    setInitialMode('chat');
  };

  // Fetch user's basic info - shared function
  const fetchUserData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // Get resume data with all related data
    let { data: resume } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Create resume if it doesn't exist
    if (!resume) {
        const { data: newResume, error: createError } = await supabase
          .from('resumes')
          .insert({
            user_id: user.id,
            email: user.email,
          })
          .select('*')
          .single();

        if (createError) {
          console.error('Error creating resume:', createError);
        } else {
          resume = newResume;
        }
    }

    // Get work histories
    const { data: workHistories } = await supabase
      .from('work_histories')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order', { ascending: true });

    // Get skills
    const { data: skills } = await supabase
      .from('skills')
      .select('skill_name')
      .eq('user_id', user.id);

    if (!resume) {
      console.error('[fetchUserData] Failed to get or create resume');
      setInitialMode('chat');
      return;
    }

    // Store resume ID for PDF download
    setResumeId(resume.id);

    // Parse education from JSONB
    const educationData = Array.isArray(resume.education)
      ? resume.education.map((edu: { school_name?: string; faculty?: string; degree?: string; start_date?: string; end_date?: string }) => ({
          schoolName: edu.school_name || '',
          faculty: edu.faculty || '',
          degree: edu.degree || '',
          startDate: edu.start_date || '',
          endDate: edu.end_date || '',
        }))
      : [];

    // Parse work histories
    const workData = (workHistories || []).map(wh => ({
      companyName: wh.company_name || '',
      position: wh.position || '',
      department: wh.department || '',
      startDate: wh.start_date || '',
      endDate: wh.end_date || '',
      isCurrent: wh.is_current || false,
      description: wh.description || '',
      achievements: wh.achievements || '',
    }));

    // Parse skills
    const skillsData = (skills || []).map(s => s.skill_name);

    setResumeData(prev => ({
      ...prev,
      fullName: resume.full_name || '',
      fullNameKana: resume.full_name_kana || '',
      birthDate: resume.birth_date || '',
      postalCode: resume.postal_code || '',
      address: resume.address || '',
      phone: resume.phone || '',
      email: resume.email || user.email || '',
      photoUrl: resume.photo_url || null,
      photoProcessedUrl: resume.photo_processed_url || null,
      education: educationData,
      workHistories: workData,
      skills: skillsData,
      certifications: resume.certifications || [],
      selfPR: resume.ai_self_pr || '',
      careerObjective: resume.ai_career_objective || '',
    }));

    console.log('Resume data loaded:', {
      fullName: resume.full_name,
      fullNameKana: resume.full_name_kana,
      phone: resume.phone,
      address: resume.address,
    });

    // Determine existing data state
    const hasPR = !!resume.ai_self_pr;
    const hasSkills = skillsData.length > 0;
    const hasWork = workData.length > 0;
    const hasEducation = educationData.length > 0;

    // Check for existing session
    try {
      const listResponse = await fetch('/api/chat/sessions');
      const listData = await listResponse.json();

      if (listData.sessions && listData.sessions.length > 0) {
        const session = listData.sessions[0];
        const isCompleted = session.is_completed || hasPR;

        setExistingSession({
          id: session.id,
          isCompleted,
          currentStep: session.current_step as Step,
        });

        // If action param is specified, handle accordingly
        if (actionParam === 'edit' || sessionIdParam) {
          setSessionId(session.id);
          const sessionData = await loadSession(session.id);

          if (sessionData) {
            setCurrentStep(sessionData.step);
            if (sessionData.messages.length > 0) {
              setMessages(sessionData.messages);
            } else {
              const stepMessage = generateResumeMessage(sessionData.step, hasEducation, hasWork, hasSkills, hasPR);
              setMessages([stepMessage]);
            }
          }

          if (!sessionIdParam) {
            window.history.replaceState(null, '', `/create?session=${session.id}`);
          }
          setInitialMode('chat');
          return;
        }

        // Show choice dialog for existing completed session
        if (isCompleted) {
          setInitialMode('choice');
          return;
        }

        // Session exists but not completed - continue automatically
        setSessionId(session.id);
        const sessionData = await loadSession(session.id);

        if (sessionData) {
          setCurrentStep(sessionData.step);
          if (sessionData.messages.length > 0) {
            setMessages(sessionData.messages);
          } else {
            const stepMessage = generateResumeMessage(sessionData.step, hasEducation, hasWork, hasSkills, hasPR);
            setMessages([stepMessage]);
          }
        }

        window.history.replaceState(null, '', `/create?session=${session.id}`);
        setInitialMode('chat');
        return;
      }
    } catch (e) {
      console.error('[fetchUserData] Error checking existing sessions:', e);
    }

    // No session found - create new one
    console.log('[fetchUserData] No existing session, creating new one');

    let startingStep: Step = 'education';
    if (hasPR) {
      startingStep = 'complete';
    } else if (hasSkills) {
      startingStep = 'pr';
    } else if (hasWork) {
      startingStep = 'skills';
    } else if (hasEducation) {
      startingStep = 'work';
    }
    setCurrentStep(startingStep);

    // Create new session
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '履歴書作成' }),
      });
      const data = await response.json();

      if (data.session) {
        setSessionId(data.session.id);
        const initialMsg = getInitialMessage(hasEducation, hasWork, hasSkills, hasPR);
        setMessages([initialMsg]);

        // Save initial message
        await fetch(`/api/chat/sessions/${data.session.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'assistant',
            content: initialMsg.content,
          }),
        });

        // Update URL
        window.history.replaceState(null, '', `/create?session=${data.session.id}`);
      }
    } catch (error) {
      console.error('[fetchUserData] Error creating session:', error);
    }

    setInitialMode('chat');
  }, [router, sessionIdParam, actionParam, loadSession]);

  // Call fetchUserData on mount
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Reload data when window gains focus (user returns from settings page)
  useEffect(() => {
    const handleFocus = () => {
      console.log('Window focused - reloading resume data');
      fetchUserData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchUserData]);

  // Set session ID when it's updated
  useEffect(() => {
    if (sessionIdParam && !sessionId) {
      setSessionId(sessionIdParam);
    }
  }, [sessionIdParam, sessionId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save message to database
  const saveMessage = async (role: 'user' | 'assistant', content: string, extractedData?: Record<string, unknown>) => {
    if (!sessionId) return;

    try {
      await fetch(`/api/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, content, extractedData }),
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  // Update session step
  const updateSessionStep = async (step: Step) => {
    if (!sessionId) return;

    try {
      await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: step,
          isCompleted: step === 'complete',
        }),
      });
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!resumeId || isDownloading) return;

    setIsDownloading(true);
    try {
      const response = await fetch(`/api/resume/pdf?resumeId=${resumeId}&template=jis`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'PDF生成に失敗しました');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `履歴書_${resumeData.fullName || 'untitled'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('PDF download error:', error);
      alert(error instanceof Error ? error.message : 'PDF生成に失敗しました');
    } finally {
      setIsDownloading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Save user message
    await saveMessage('user', input);

    try {
      const response = await fetch('/api/chat/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          currentStep,
          resumeData,
          history: messages,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Update resume data if AI extracted info
      if (data.extractedData) {
        setResumeData(prev => ({
          ...prev,
          ...data.extractedData,
        }));
      }

      // Update step if AI indicates progression
      if (data.nextStep) {
        setCurrentStep(data.nextStep);
        await updateSessionStep(data.nextStep);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message
      await saveMessage('assistant', data.message, data.extractedData);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'すみません、エラーが発生しました。もう一度お試しください。',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Loading state
  if (initialMode === 'loading') {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // Choice dialog for completed session with preview
  if (initialMode === 'choice') {
    return (
      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">履歴書</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 bg-green-100 text-green-700 rounded-full px-3 py-1 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>作成済み</span>
              </div>
              {resumeId && (
                <Button
                  size="sm"
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {isDownloading ? 'PDF生成中...' : 'PDF出力'}
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Action Panel */}
          <div className="w-full lg:w-96 flex flex-col bg-white border-r border-gray-200 p-6 overflow-y-auto">
            <div className="mb-6">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                履歴書が完成しています
              </h2>
              <p className="text-gray-600 text-sm">
                右側のプレビューで内容を確認できます。<br />
                編集が必要な場合は下のボタンから操作してください。
              </p>
            </div>

            <div className="space-y-3 flex-1">
              <Button
                onClick={handleEdit}
                className="w-full h-14 text-base"
                variant="default"
              >
                <Edit className="w-5 h-5 mr-3" />
                内容を編集する
              </Button>

              <Button
                onClick={handleRestart}
                disabled={isRestarting}
                className="w-full h-14 text-base"
                variant="outline"
              >
                {isRestarting ? (
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                ) : (
                  <RotateCcw className="w-5 h-5 mr-3" />
                )}
                最初から作り直す
              </Button>
            </div>

            {/* Mobile: Show preview toggle */}
            <div className="lg:hidden mt-6 pt-4 border-t">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'アクションに戻る' : 'プレビューを見る'}
              </Button>
            </div>
          </div>

          {/* Resume Preview Panel */}
          <div className={`flex-1 overflow-y-auto bg-gray-100 p-6 ${showPreview ? 'block' : 'hidden lg:block'}`}>
            <div className="max-w-[595px] mx-auto">
              <h3 className="text-sm font-medium text-gray-600 mb-3">プレビュー</h3>
              <ResumePreview data={resumeData} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat view
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">履歴書</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Step indicator */}
            <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
              {(['education', 'work', 'skills', 'pr'] as Step[]).map((step, i) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      step === currentStep ? 'bg-blue-600' :
                      ['education', 'work', 'skills', 'pr'].indexOf(currentStep) > i ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                  {i < 3 && <div className="w-4 h-px bg-gray-300 mx-1" />}
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-500 hidden sm:block">
              {STEP_LABELS[currentStep]}
            </span>

            {/* Preview toggle for mobile */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="lg:hidden"
            >
              {showPreview ? 'チャット' : 'プレビュー'}
            </Button>

            {currentStep === 'complete' && resumeId && (
              <Button
                size="sm"
                onClick={handleDownloadPDF}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                {isDownloading ? 'PDF生成中...' : 'PDF出力'}
              </Button>
            )}

            {/* Restart button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRestart}
              disabled={isRestarting}
              className="text-gray-500 hover:text-gray-700"
            >
              {isRestarting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              <span className="hidden sm:inline ml-1">作り直す</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className={`flex-1 flex flex-col bg-white ${showPreview ? 'hidden lg:flex' : 'flex'} lg:border-r border-gray-200`}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                      <span className="text-sm text-gray-500">考え中...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={currentStep === 'complete' ? '修正があればお知らせください...' : 'メッセージを入力...'}
                    disabled={isLoading}
                    rows={1}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  className="h-12 w-12 rounded-xl"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                {currentStep === 'complete'
                  ? '修正したい箇所があればメッセージを送信してください'
                  : 'Enterで送信 / 「次へ」と入力して次のステップに進む'}
              </p>
            </div>
          </div>
        </div>

        {/* Resume Preview Panel */}
        <div className={`w-full lg:w-1/2 xl:w-2/5 overflow-y-auto bg-gray-100 ${showPreview ? 'block' : 'hidden lg:block'}`}>
          <div className="p-4 lg:p-6">
            <div className="max-w-[595px] mx-auto">
              <h3 className="text-sm font-medium text-gray-600 mb-3">プレビュー</h3>
              <ResumePreview data={resumeData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
