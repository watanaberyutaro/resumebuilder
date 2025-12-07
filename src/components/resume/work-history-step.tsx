'use client';

import { useState } from 'react';
import { useResumeFormStore } from '@/store/resume-form-store';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { JobCategory } from '@/types/database';

const JOB_CATEGORY_OPTIONS = [
  { value: 'engineer', label: 'エンジニア' },
  { value: 'sales', label: '営業' },
  { value: 'marketing', label: 'マーケティング' },
  { value: 'design', label: 'デザイン' },
  { value: 'hr', label: '人事' },
  { value: 'finance', label: '経理・財務' },
  { value: 'medical', label: '医療・看護' },
  { value: 'other', label: 'その他' },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: '正社員', label: '正社員' },
  { value: '契約社員', label: '契約社員' },
  { value: '派遣社員', label: '派遣社員' },
  { value: 'パート・アルバイト', label: 'パート・アルバイト' },
  { value: '業務委託', label: '業務委託' },
  { value: 'インターン', label: 'インターン' },
];

type WorkHistoryForm = {
  company_name: string;
  company_name_hidden: string | null;
  industry: string | null;
  employee_count: string | null;
  position: string | null;
  department: string | null;
  job_category: JobCategory | null;
  employment_type: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  achievements: string | null;
  ai_description: string | null;
  ai_achievements: string | null;
  display_order: number;
};

const emptyWorkHistory: WorkHistoryForm = {
  company_name: '',
  company_name_hidden: null,
  industry: null,
  employee_count: null,
  position: null,
  department: null,
  job_category: null,
  employment_type: null,
  start_date: null,
  end_date: null,
  is_current: false,
  description: null,
  achievements: null,
  ai_description: null,
  ai_achievements: null,
  display_order: 0,
};

export function WorkHistoryStep() {
  const {
    workHistories,
    addWorkHistory,
    updateWorkHistory,
    removeWorkHistory,
  } = useResumeFormStore();

  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    workHistories.length > 0 ? 0 : null
  );

  const handleAdd = () => {
    addWorkHistory({ ...emptyWorkHistory, display_order: workHistories.length });
    setExpandedIndex(workHistories.length);
  };

  const handleUpdate = (index: number, field: keyof WorkHistoryForm, value: unknown) => {
    const updated = { ...workHistories[index], [field]: value };
    updateWorkHistory(index, updated);
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">職務経歴</h2>
        <Button variant="outline" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" />
          経歴を追加
        </Button>
      </div>

      {workHistories.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 mb-4">職務経歴がまだ登録されていません</p>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" />
              最初の経歴を追加
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {workHistories.map((wh, index) => (
            <Card key={index}>
              <div
                className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpand(index)}
              >
                <div>
                  <h3 className="font-medium">
                    {wh.company_name || `職歴 ${index + 1}`}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {wh.position && `${wh.position} / `}
                    {wh.start_date && `${wh.start_date.substring(0, 7)} 〜 `}
                    {wh.is_current ? '現在' : wh.end_date?.substring(0, 7)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeWorkHistory(index);
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {expandedIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              {expandedIndex === index && (
                <CardContent className="border-t pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        会社名 <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={wh.company_name}
                        onChange={(e) => handleUpdate(index, 'company_name', e.target.value)}
                        placeholder="株式会社〇〇"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        業界
                      </label>
                      <Input
                        value={wh.industry || ''}
                        onChange={(e) => handleUpdate(index, 'industry', e.target.value)}
                        placeholder="IT・通信"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        従業員規模
                      </label>
                      <Input
                        value={wh.employee_count || ''}
                        onChange={(e) => handleUpdate(index, 'employee_count', e.target.value)}
                        placeholder="100-500名"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        役職
                      </label>
                      <Input
                        value={wh.position || ''}
                        onChange={(e) => handleUpdate(index, 'position', e.target.value)}
                        placeholder="シニアエンジニア"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        部署
                      </label>
                      <Input
                        value={wh.department || ''}
                        onChange={(e) => handleUpdate(index, 'department', e.target.value)}
                        placeholder="開発部"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        職種
                      </label>
                      <Select
                        value={wh.job_category || ''}
                        onChange={(e) => handleUpdate(index, 'job_category', e.target.value || null)}
                        options={JOB_CATEGORY_OPTIONS}
                        placeholder="選択してください"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        雇用形態
                      </label>
                      <Select
                        value={wh.employment_type || ''}
                        onChange={(e) => handleUpdate(index, 'employment_type', e.target.value || null)}
                        options={EMPLOYMENT_TYPE_OPTIONS}
                        placeholder="選択してください"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        入社日
                      </label>
                      <Input
                        type="month"
                        value={wh.start_date?.substring(0, 7) || ''}
                        onChange={(e) => handleUpdate(index, 'start_date', e.target.value ? `${e.target.value}-01` : null)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        退職日
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="month"
                          value={wh.end_date?.substring(0, 7) || ''}
                          onChange={(e) => handleUpdate(index, 'end_date', e.target.value ? `${e.target.value}-01` : null)}
                          disabled={wh.is_current}
                          className={wh.is_current ? 'opacity-50' : ''}
                        />
                        <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={wh.is_current}
                            onChange={(e) => {
                              handleUpdate(index, 'is_current', e.target.checked);
                              if (e.target.checked) {
                                handleUpdate(index, 'end_date', null);
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          現在在籍
                        </label>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        業務内容
                      </label>
                      <Textarea
                        value={wh.description || ''}
                        onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                        placeholder="担当した業務内容を記載してください..."
                        rows={4}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        実績・成果
                      </label>
                      <Textarea
                        value={wh.achievements || ''}
                        onChange={(e) => handleUpdate(index, 'achievements', e.target.value)}
                        placeholder="具体的な数値や成果を記載してください..."
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <div className="bg-yellow-50 p-4 rounded-lg">
        <p className="text-sm text-yellow-800">
          職務経歴は新しい順に並べることをおすすめします。AIが内容を自動で整えます。
        </p>
      </div>
    </div>
  );
}
