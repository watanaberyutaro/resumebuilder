'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import Image from 'next/image';

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

interface ResumePreviewProps {
  data: ResumeData;
}

function formatJapaneseDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return format(date, 'yyyy年M月', { locale: ja });
  } catch {
    return dateStr;
  }
}

function formatFullDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return format(date, 'yyyy年M月d日', { locale: ja });
  } catch {
    return dateStr;
  }
}

function calculateAge(birthDate: string): number {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function ResumePreview({ data }: ResumePreviewProps) {
  const today = format(new Date(), 'yyyy年M月d日現在', { locale: ja });
  const age = calculateAge(data.birthDate);
  const photoUrl = data.photoProcessedUrl || data.photoUrl;

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden text-gray-900" style={{ fontFamily: "'Noto Serif JP', serif" }}>
      {/* Header */}
      <div className="bg-gray-800 text-white px-6 py-4">
        <h1 className="text-xl font-bold tracking-wider text-center">履 歴 書</h1>
        <p className="text-xs text-gray-300 text-right mt-1">{today}</p>
      </div>

      <div className="p-6">
        {/* Basic Information */}
        <div className="border border-gray-300 rounded-lg overflow-hidden mb-6">
          <div className="grid grid-cols-4">
            {/* Photo */}
            <div className="row-span-3 border-r border-gray-300 p-4 flex items-center justify-center bg-gray-50">
              <div className="relative w-20 h-28 border-2 border-dashed border-gray-300 rounded flex items-center justify-center overflow-hidden">
                {photoUrl ? (
                  <Image
                    src={photoUrl}
                    alt="証明写真"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-xs text-gray-400 text-center">
                    写真<br />3×4cm
                  </span>
                )}
              </div>
            </div>

            {/* Name */}
            <div className="col-span-3 border-b border-gray-300">
              <div className="px-4 py-1 border-b border-gray-200 bg-gray-50">
                <span className="text-xs text-gray-500">ふりがな</span>
                <span className="ml-3 text-sm text-gray-700">{data.fullNameKana || '-'}</span>
              </div>
              <div className="px-4 py-3">
                <span className="text-xs text-gray-500">氏名</span>
                <span className="ml-3 text-lg font-bold">{data.fullName || '未入力'}</span>
              </div>
            </div>

            {/* Birth date & Age */}
            <div className="col-span-3 border-b border-gray-300">
              <div className="grid grid-cols-2 divide-x divide-gray-300">
                <div className="px-4 py-2">
                  <span className="text-xs text-gray-500 block">生年月日</span>
                  <span className="text-sm">
                    {data.birthDate ? formatFullDate(data.birthDate) : '-'}
                  </span>
                </div>
                <div className="px-4 py-2">
                  <span className="text-xs text-gray-500 block">年齢</span>
                  <span className="text-sm">{data.birthDate ? `満${age}歳` : '-'}</span>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="col-span-3 border-b border-gray-300">
              <div className="px-4 py-1 border-b border-gray-200 bg-gray-50">
                <span className="text-xs text-gray-500">〒</span>
                <span className="ml-2 text-sm">{data.postalCode || '-'}</span>
              </div>
              <div className="px-4 py-2">
                <span className="text-xs text-gray-500 block">現住所</span>
                <span className="text-sm">{data.address || '未入力'}</span>
              </div>
            </div>

            {/* Contact */}
            <div className="col-span-4 grid grid-cols-2 divide-x divide-gray-300">
              <div className="px-4 py-2">
                <span className="text-xs text-gray-500 block">電話番号</span>
                <span className="text-sm">{data.phone || '-'}</span>
              </div>
              <div className="px-4 py-2">
                <span className="text-xs text-gray-500 block">メールアドレス</span>
                <span className="text-sm break-all">{data.email || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Education & Work History */}
        <div className="border border-gray-300 rounded-lg overflow-hidden mb-6">
          <div className="bg-gray-800 text-white px-4 py-2 text-sm font-medium">
            学歴・職歴
          </div>

          {/* Education */}
          <div className="border-b border-gray-300">
            <div className="bg-gray-100 px-4 py-1 text-xs font-medium text-gray-600 text-center border-b border-gray-200">
              学歴
            </div>
            {data.education.length > 0 ? (
              data.education.map((edu, index) => (
                <div key={index} className="text-sm">
                  <div className="grid grid-cols-6 border-b border-gray-200">
                    <div className="px-3 py-2 border-r border-gray-200 text-center text-gray-600">
                      {formatJapaneseDate(edu.startDate)}
                    </div>
                    <div className="col-span-5 px-3 py-2">
                      {edu.schoolName} {edu.faculty} 入学
                    </div>
                  </div>
                  <div className="grid grid-cols-6 border-b border-gray-200">
                    <div className="px-3 py-2 border-r border-gray-200 text-center text-gray-600">
                      {formatJapaneseDate(edu.endDate)}
                    </div>
                    <div className="col-span-5 px-3 py-2">
                      {edu.schoolName} {edu.faculty} 卒業
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-gray-400 text-sm">
                学歴を入力してください
              </div>
            )}
          </div>

          {/* Work History */}
          <div>
            <div className="bg-gray-100 px-4 py-1 text-xs font-medium text-gray-600 text-center border-b border-gray-200">
              職歴
            </div>
            {data.workHistories.length > 0 ? (
              data.workHistories.map((work, index) => (
                <div key={index} className="text-sm border-b border-gray-200 last:border-b-0">
                  <div className="grid grid-cols-6">
                    <div className="px-3 py-2 border-r border-gray-200 text-center text-gray-600">
                      {formatJapaneseDate(work.startDate)}
                    </div>
                    <div className="col-span-5 px-3 py-2">
                      <span className="font-medium">{work.companyName}</span> 入社
                      {work.department && <span className="text-gray-600 ml-2">({work.department})</span>}
                    </div>
                  </div>
                  {work.description && (
                    <div className="grid grid-cols-6">
                      <div className="border-r border-gray-200"></div>
                      <div className="col-span-5 px-3 py-1 text-xs text-gray-600">
                        {work.position && `${work.position}として `}
                        {work.description}
                      </div>
                    </div>
                  )}
                  {work.isCurrent ? (
                    <div className="grid grid-cols-6">
                      <div className="border-r border-gray-200"></div>
                      <div className="col-span-5 px-3 py-2 text-gray-600">現在に至る</div>
                    </div>
                  ) : work.endDate && (
                    <div className="grid grid-cols-6">
                      <div className="px-3 py-2 border-r border-gray-200 text-center text-gray-600">
                        {formatJapaneseDate(work.endDate)}
                      </div>
                      <div className="col-span-5 px-3 py-2">一身上の都合により退職</div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-gray-400 text-sm">
                職歴を入力してください
              </div>
            )}
            <div className="px-4 py-2 text-right text-sm text-gray-600 border-t border-gray-200">以上</div>
          </div>
        </div>

        {/* Certifications */}
        <div className="border border-gray-300 rounded-lg overflow-hidden mb-6">
          <div className="bg-gray-800 text-white px-4 py-2 text-sm font-medium">
            免許・資格
          </div>
          {data.certifications.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {data.certifications.map((cert, index) => (
                <div key={index} className="px-4 py-2 text-sm">{cert}</div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-gray-400 text-sm">
              資格・免許を入力してください
            </div>
          )}
        </div>

        {/* Skills */}
        {data.skills.length > 0 && (
          <div className="border border-gray-300 rounded-lg overflow-hidden mb-6">
            <div className="bg-gray-800 text-white px-4 py-2 text-sm font-medium">
              スキル
            </div>
            <div className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Self PR */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <div className="bg-gray-800 text-white px-4 py-2 text-sm font-medium">
            自己PR
          </div>
          <div className="px-4 py-4 min-h-[120px]">
            {data.selfPR ? (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{data.selfPR}</p>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">自己PRを入力してください</p>
            )}
          </div>
        </div>

        {/* Career Objective */}
        {data.careerObjective && (
          <div className="border border-gray-300 rounded-lg overflow-hidden mt-6">
            <div className="bg-gray-800 text-white px-4 py-2 text-sm font-medium">
              志望動機
            </div>
            <div className="px-4 py-4">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{data.careerObjective}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
