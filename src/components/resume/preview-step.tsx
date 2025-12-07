'use client';

import { useResumeFormStore } from '@/store/resume-form-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Download, RefreshCw, Edit3, Camera } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/components/ui/toast';
import Link from 'next/link';
import Image from 'next/image';

export function PreviewStep() {
  const {
    fullName,
    fullNameKana,
    birthDate,
    address,
    phone,
    email,
    workHistories,
    skills,
    education,
    certifications,
    languages,
    aiSummary,
    aiSelfPR,
    aiCareerObjective,
    resumeId,
    photoUrl,
    photoProcessedUrl,
    setAIContent,
  } = useResumeFormStore();

  const displayPhotoUrl = photoProcessedUrl || photoUrl;

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const hardSkills = skills.filter((s) => s.skill_type === 'hard');
  const softSkills = skills.filter((s) => s.skill_type === 'soft');

  const handleRegenerate = async (field: 'summary' | 'selfPR' | 'careerObjective') => {
    if (!resumeId) {
      toast.error('先に履歴書を保存してください');
      return;
    }

    setIsRegenerating(true);
    try {
      const response = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId,
          regenerateOnly: field,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const fieldMap = {
          summary: 'aiSummary',
          selfPR: 'aiSelfPR',
          careerObjective: 'aiCareerObjective',
        };
        setAIContent({
          [fieldMap[field]]: data.content[field],
        });
        toast.success('再生成しました');
      } else {
        throw new Error(data.error);
      }
    } catch {
      toast.error('再生成に失敗しました');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!resumeId) {
      toast.error('先に履歴書を保存してください');
      return;
    }

    try {
      const response = await fetch(`/api/resume/pdf?resumeId=${resumeId}`);
      if (!response.ok) throw new Error('PDF生成に失敗しました');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `履歴書_${fullName || 'resume'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('PDFをダウンロードしました');
    } catch {
      toast.error('PDFダウンロードに失敗しました');
    }
  };

  const startEditing = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const saveEditing = () => {
    if (editingField) {
      setAIContent({ [editingField]: editValue });
      setEditingField(null);
      setEditValue('');
    }
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue('');
  };

  const calculateAge = () => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">プレビュー</h2>
        <div className="flex gap-2">
          <Link href={`/chat?resumeId=${resumeId}`}>
            <Button variant="outline" disabled={!resumeId}>
              <Edit3 className="h-4 w-4 mr-1" />
              AIチャットで編集
            </Button>
          </Link>
          <Button onClick={handleDownloadPDF} disabled={!resumeId}>
            <Download className="h-4 w-4 mr-1" />
            PDFダウンロード
          </Button>
        </div>
      </div>

      {/* Basic Info Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            {/* Photo */}
            <div className="flex-shrink-0">
              <div className="w-[90px] h-[120px] bg-gray-100 border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                {displayPhotoUrl ? (
                  <Image
                    src={displayPhotoUrl}
                    alt="証明写真"
                    width={90}
                    height={120}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="text-center p-2">
                    <Camera className="h-8 w-8 mx-auto text-gray-400" />
                    <span className="text-xs text-gray-400 mt-1 block">証明写真</span>
                  </div>
                )}
              </div>
            </div>
            {/* Info */}
            <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">氏名：</span>
                {fullName} {fullNameKana && `（${fullNameKana}）`}
              </div>
              <div>
                <span className="text-gray-500">年齢：</span>
                {calculateAge() ? `${calculateAge()}歳` : '-'}
              </div>
              <div>
                <span className="text-gray-500">住所：</span>
                {address || '-'}
              </div>
              <div>
                <span className="text-gray-500">電話：</span>
                {phone || '-'}
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">メール：</span>
                {email || '-'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">職務要約</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRegenerate('summary')}
            disabled={isRegenerating}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRegenerating ? 'animate-spin' : ''}`} />
            再生成
          </Button>
        </CardHeader>
        <CardContent>
          {editingField === 'aiSummary' ? (
            <div className="space-y-2">
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEditing}>保存</Button>
                <Button size="sm" variant="outline" onClick={cancelEditing}>キャンセル</Button>
              </div>
            </div>
          ) : (
            <div
              className="text-sm whitespace-pre-wrap cursor-pointer hover:bg-gray-50 p-2 rounded"
              onClick={() => startEditing('aiSummary', aiSummary || '')}
            >
              {aiSummary || (
                <span className="text-gray-400">
                  「AI生成」ボタンをクリックして職務要約を生成してください
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work History */}
      {workHistories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">職務経歴</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {workHistories.map((wh, index) => (
              <div key={index} className="border-b pb-4 last:border-0">
                <div className="font-medium">{wh.company_name}</div>
                <div className="text-sm text-gray-500">
                  {wh.position && `${wh.position} / `}
                  {wh.start_date?.substring(0, 7)} 〜 {wh.is_current ? '現在' : wh.end_date?.substring(0, 7)}
                </div>
                {(wh.ai_description || wh.description) && (
                  <p className="text-sm mt-2">{wh.ai_description || wh.description}</p>
                )}
                {(wh.ai_achievements || wh.achievements) && (
                  <p className="text-sm mt-1 text-blue-700">
                    【実績】{wh.ai_achievements || wh.achievements}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">スキル</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {hardSkills.length > 0 && (
              <div>
                <span className="text-sm text-gray-500">技術スキル：</span>
                <span className="text-sm ml-2">
                  {hardSkills.map((s) => s.skill_name).join(', ')}
                </span>
              </div>
            )}
            {softSkills.length > 0 && (
              <div>
                <span className="text-sm text-gray-500">ソフトスキル：</span>
                <span className="text-sm ml-2">
                  {softSkills.map((s) => s.skill_name).join(', ')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Self PR */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">自己PR</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRegenerate('selfPR')}
            disabled={isRegenerating}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRegenerating ? 'animate-spin' : ''}`} />
            再生成
          </Button>
        </CardHeader>
        <CardContent>
          {editingField === 'aiSelfPR' ? (
            <div className="space-y-2">
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={6}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEditing}>保存</Button>
                <Button size="sm" variant="outline" onClick={cancelEditing}>キャンセル</Button>
              </div>
            </div>
          ) : (
            <div
              className="text-sm whitespace-pre-wrap cursor-pointer hover:bg-gray-50 p-2 rounded"
              onClick={() => startEditing('aiSelfPR', aiSelfPR || '')}
            >
              {aiSelfPR || (
                <span className="text-gray-400">
                  「AI生成」ボタンをクリックして自己PRを生成してください
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Career Objective */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">志望動機</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRegenerate('careerObjective')}
            disabled={isRegenerating}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRegenerating ? 'animate-spin' : ''}`} />
            再生成
          </Button>
        </CardHeader>
        <CardContent>
          {editingField === 'aiCareerObjective' ? (
            <div className="space-y-2">
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEditing}>保存</Button>
                <Button size="sm" variant="outline" onClick={cancelEditing}>キャンセル</Button>
              </div>
            </div>
          ) : (
            <div
              className="text-sm whitespace-pre-wrap cursor-pointer hover:bg-gray-50 p-2 rounded"
              onClick={() => startEditing('aiCareerObjective', aiCareerObjective || '')}
            >
              {aiCareerObjective || (
                <span className="text-gray-400">
                  「AI生成」ボタンをクリックして志望動機を生成してください
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Education & Certifications */}
      {(education.length > 0 || certifications.length > 0 || languages.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">学歴・資格・語学</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {education.length > 0 && (
              <div>
                <span className="text-sm text-gray-500">学歴：</span>
                {education.map((edu, i) => (
                  <div key={i} className="text-sm ml-2">
                    {edu.school_name} {edu.faculty && `${edu.faculty}`} {edu.degree}
                  </div>
                ))}
              </div>
            )}
            {certifications.length > 0 && (
              <div>
                <span className="text-sm text-gray-500">資格：</span>
                <span className="text-sm ml-2">{certifications.join(', ')}</span>
              </div>
            )}
            {languages.length > 0 && (
              <div>
                <span className="text-sm text-gray-500">語学：</span>
                <span className="text-sm ml-2">
                  {languages.map((l) => `${l.language}(${l.level})`).join(', ')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
