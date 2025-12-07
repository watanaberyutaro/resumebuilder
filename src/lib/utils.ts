import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale: string = 'ja-JP'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
  });
}

export function calculateAge(birthDate: string | Date): number {
  const today = new Date();
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function formatSalary(min?: number | null, max?: number | null): string {
  if (!min && !max) return '応相談';
  if (min && max) return `${min.toLocaleString()}万円 〜 ${max.toLocaleString()}万円`;
  if (min) return `${min.toLocaleString()}万円以上`;
  if (max) return `〜 ${max.toLocaleString()}万円`;
  return '応相談';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateExperienceYears(startDate: string, endDate?: string | null): number {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
  return Math.round(years * 10) / 10;
}

export function getJobCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    engineer: 'エンジニア',
    sales: '営業',
    marketing: 'マーケティング',
    design: 'デザイン',
    hr: '人事',
    finance: '経理・財務',
    medical: '医療・看護',
    other: 'その他',
  };
  return labels[category] || category;
}

export function getOfferStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '検討中',
    interested: '興味あり',
    declined: '辞退',
    accepted: '承諾',
    hired: '採用決定',
  };
  return labels[status] || status;
}
