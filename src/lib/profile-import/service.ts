import type { Resume, WorkHistory } from '@/types/database';

// =====================================================
// Profile Import Service
// Handles importing profiles from LinkedIn, Wantedly, etc.
// Note: Actual scraping should be done carefully considering
// terms of service. This is a placeholder implementation.
// =====================================================

export type ImportSource = 'linkedin' | 'wantedly' | 'facebook';

export interface ImportedProfile {
  fullName?: string;
  email?: string;
  phone?: string;
  headline?: string;
  summary?: string;
  location?: string;
  workExperiences: ImportedWorkExperience[];
  skills: string[];
  education: ImportedEducation[];
}

export interface ImportedWorkExperience {
  companyName: string;
  position: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
}

export interface ImportedEducation {
  schoolName: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
}

export interface ImportResult {
  success: boolean;
  profile?: ImportedProfile;
  error?: string;
}

// Parse URL to determine source
export function detectSourceFromUrl(url: string): ImportSource | null {
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('wantedly.com')) return 'wantedly';
  if (url.includes('facebook.com')) return 'facebook';
  return null;
}

// Main import function
export async function importProfile(url: string): Promise<ImportResult> {
  const source = detectSourceFromUrl(url);

  if (!source) {
    return {
      success: false,
      error: 'サポートされていないURLです。LinkedIn、Wantedly、またはFacebookのプロフィールURLを入力してください。',
    };
  }

  try {
    switch (source) {
      case 'linkedin':
        return await importFromLinkedIn(url);
      case 'wantedly':
        return await importFromWantedly(url);
      case 'facebook':
        return await importFromFacebook(url);
      default:
        return { success: false, error: 'Unknown source' };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'インポート中にエラーが発生しました',
    };
  }
}

// LinkedIn import (placeholder)
async function importFromLinkedIn(url: string): Promise<ImportResult> {
  // In production, this would:
  // 1. Use LinkedIn API (requires OAuth and LinkedIn Developer approval)
  // 2. Or use a scraping service (careful with ToS)

  // Returning dummy data for demonstration
  console.log('LinkedIn import: Using placeholder data for URL:', url);

  return {
    success: true,
    profile: {
      fullName: '山田 太郎',
      headline: 'シニアソフトウェアエンジニア | React / Node.js',
      summary: '10年以上のWeb開発経験を持つフルスタックエンジニア。大規模サービスの設計・開発からチームリードまで幅広く経験。',
      location: '東京都',
      workExperiences: [
        {
          companyName: 'テック株式会社',
          position: 'シニアエンジニア',
          startDate: '2020-04',
          isCurrent: true,
          description: 'BtoB SaaSプロダクトの開発リード。React/TypeScriptでのフロントエンド開発、Node.jsでのバックエンド開発を担当。',
        },
        {
          companyName: 'ウェブ開発合同会社',
          position: 'エンジニア',
          startDate: '2015-04',
          endDate: '2020-03',
          isCurrent: false,
          description: 'ECサイトの開発・運用。PHP/Laravelでのバックエンド開発を主に担当。',
        },
      ],
      skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'Docker', 'PostgreSQL'],
      education: [
        {
          schoolName: '東京工業大学',
          degree: '学士',
          fieldOfStudy: '情報工学',
          startDate: '2011-04',
          endDate: '2015-03',
        },
      ],
    },
  };
}

// Wantedly import (placeholder)
async function importFromWantedly(url: string): Promise<ImportResult> {
  console.log('Wantedly import: Using placeholder data for URL:', url);

  return {
    success: true,
    profile: {
      fullName: '佐藤 花子',
      headline: 'セールス / カスタマーサクセス',
      summary: 'SaaS企業でのセールス経験5年。新規開拓からカスタマーサクセスまで一貫して担当。ARR2億円の達成に貢献。',
      location: '大阪府',
      workExperiences: [
        {
          companyName: 'クラウドサービス株式会社',
          position: 'セールスマネージャー',
          startDate: '2021-01',
          isCurrent: true,
          description: 'エンタープライズ向けSaaSの法人営業。チーム5名のマネジメントも担当。',
        },
      ],
      skills: ['法人営業', 'アカウントマネジメント', 'Salesforce', 'プレゼンテーション'],
      education: [
        {
          schoolName: '慶應義塾大学',
          degree: '学士',
          fieldOfStudy: '商学',
          startDate: '2013-04',
          endDate: '2017-03',
        },
      ],
    },
  };
}

// Facebook import (placeholder)
async function importFromFacebook(url: string): Promise<ImportResult> {
  console.log('Facebook import: Using placeholder data for URL:', url);

  // Facebook Graph API would be needed for real implementation
  return {
    success: true,
    profile: {
      fullName: '鈴木 一郎',
      location: '神奈川県',
      workExperiences: [],
      skills: [],
      education: [],
    },
  };
}

// Convert imported profile to Resume format
export function convertToResumeInput(imported: ImportedProfile): Partial<Resume> {
  return {
    full_name: imported.fullName,
    email: imported.email,
    phone: imported.phone,
    address: imported.location,
    ai_summary: imported.summary,
    education: imported.education.map((edu) => ({
      school_name: edu.schoolName,
      degree: edu.degree || null,
      faculty: edu.fieldOfStudy || null,
      start_date: edu.startDate || null,
      end_date: edu.endDate || null,
      is_current: false,
    })),
  };
}

// Convert imported work experiences to WorkHistory format
export function convertToWorkHistories(
  imported: ImportedProfile,
  resumeId: string,
  userId: string
): Partial<WorkHistory>[] {
  return imported.workExperiences.map((exp, index) => ({
    resume_id: resumeId,
    user_id: userId,
    company_name: exp.companyName,
    position: exp.position,
    start_date: exp.startDate,
    end_date: exp.endDate,
    is_current: exp.isCurrent,
    description: exp.description,
    display_order: index,
  }));
}
