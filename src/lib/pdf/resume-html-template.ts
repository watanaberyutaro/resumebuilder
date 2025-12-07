import type { Resume, WorkHistory, Skill } from '@/types/database';

interface ResumeTemplateData {
  resume: Resume;
  workHistories: WorkHistory[];
  skills: Skill[];
}

function formatJapaneseDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}年${month}月`;
  } catch {
    return dateStr;
  }
}

function formatFullDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  } catch {
    return dateStr;
  }
}

function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getTodayString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  return `${year}年${month}月${day}日現在`;
}

export function generateResumeHtml({ resume, workHistories, skills }: ResumeTemplateData): string {
  const age = calculateAge(resume.birth_date);
  const photoUrl = resume.photo_processed_url || resume.photo_url;
  const today = getTodayString();

  // Parse education from JSONB
  const educationData = Array.isArray(resume.education) ? resume.education : [];

  // Get certifications
  const certifications = resume.certifications || [];

  // Get skill names
  const skillNames = skills.map(s => s.skill_name);

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>履歴書 - ${escapeHtml(resume.full_name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Noto Serif JP', serif;
      font-size: 14px;
      line-height: 1.5;
      color: #111827;
      background-color: white;
      -webkit-font-smoothing: antialiased;
    }

    .resume-container {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    /* Header */
    .resume-header {
      background-color: #1f2937;
      color: white;
      padding: 16px 24px;
    }

    .resume-title {
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 0.1em;
      text-align: center;
    }

    .resume-date {
      font-size: 12px;
      color: #d1d5db;
      text-align: right;
      margin-top: 4px;
    }

    /* Content */
    .resume-content {
      padding: 24px;
    }

    /* Section Card */
    .section-card {
      border: 1px solid #d1d5db;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 24px;
    }

    .section-card:last-child {
      margin-bottom: 0;
    }

    .section-header {
      background-color: #1f2937;
      color: white;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 500;
    }

    .section-subheader {
      background-color: #f3f4f6;
      padding: 4px 16px;
      font-size: 12px;
      font-weight: 500;
      color: #4b5563;
      text-align: center;
      border-bottom: 1px solid #e5e7eb;
    }

    /* Basic Info Grid */
    .basic-info-grid {
      display: grid;
      grid-template-columns: 1fr 3fr;
    }

    /* Photo */
    .photo-cell {
      grid-row: span 3;
      border-right: 1px solid #d1d5db;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f9fafb;
    }

    .photo-box {
      width: 80px;
      height: 112px;
      border: 2px dashed #d1d5db;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .photo-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-placeholder {
      font-size: 12px;
      color: #9ca3af;
      text-align: center;
    }

    /* Name Row */
    .name-row {
      border-bottom: 1px solid #d1d5db;
    }

    .furigana-row {
      padding: 4px 16px;
      border-bottom: 1px solid #e5e7eb;
      background-color: #f9fafb;
    }

    .furigana-label {
      font-size: 12px;
      color: #6b7280;
    }

    .furigana-value {
      font-size: 14px;
      color: #374151;
      margin-left: 12px;
    }

    .name-content {
      padding: 12px 16px;
    }

    .name-label {
      font-size: 12px;
      color: #6b7280;
    }

    .name-value {
      font-size: 18px;
      font-weight: bold;
      margin-left: 12px;
    }

    /* Birth & Age Row */
    .birth-age-row {
      border-bottom: 1px solid #d1d5db;
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .birth-cell, .age-cell {
      padding: 8px 16px;
    }

    .birth-cell {
      border-right: 1px solid #d1d5db;
    }

    .info-label {
      font-size: 12px;
      color: #6b7280;
      display: block;
    }

    .info-value {
      font-size: 14px;
    }

    /* Address Row */
    .address-row {
      border-bottom: 1px solid #d1d5db;
    }

    .postal-row {
      padding: 4px 16px;
      border-bottom: 1px solid #e5e7eb;
      background-color: #f9fafb;
    }

    .postal-label {
      font-size: 12px;
      color: #6b7280;
    }

    .postal-value {
      font-size: 14px;
      margin-left: 8px;
    }

    .address-content {
      padding: 8px 16px;
    }

    /* Contact Row */
    .contact-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-column: span 2;
    }

    .phone-cell, .email-cell {
      padding: 8px 16px;
    }

    .phone-cell {
      border-right: 1px solid #d1d5db;
    }

    .email-value {
      word-break: break-all;
    }

    /* Education & Work History */
    .history-row {
      display: grid;
      grid-template-columns: 1fr 5fr;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }

    .history-row:last-child {
      border-bottom: none;
    }

    .history-date {
      padding: 8px 12px;
      border-right: 1px solid #e5e7eb;
      text-align: center;
      color: #4b5563;
    }

    .history-content {
      padding: 8px 12px;
    }

    .history-description {
      font-size: 12px;
      color: #4b5563;
      padding: 4px 12px 8px;
      grid-column: 2;
    }

    .company-name {
      font-weight: 500;
    }

    .department {
      color: #4b5563;
      margin-left: 8px;
    }

    .history-footer {
      padding: 8px 16px;
      text-align: right;
      font-size: 14px;
      color: #4b5563;
      border-top: 1px solid #e5e7eb;
    }

    /* Certifications */
    .cert-item {
      padding: 8px 16px;
      font-size: 14px;
      border-bottom: 1px solid #e5e7eb;
    }

    .cert-item:last-child {
      border-bottom: none;
    }

    .empty-message {
      padding: 24px 16px;
      text-align: center;
      color: #9ca3af;
      font-size: 14px;
    }

    /* Skills */
    .skills-container {
      padding: 12px 16px;
    }

    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .skill-badge {
      padding: 4px 12px;
      background-color: #eff6ff;
      color: #1d4ed8;
      border-radius: 9999px;
      font-size: 14px;
    }

    /* Self PR & Career Objective */
    .text-content {
      padding: 16px;
      min-height: 120px;
    }

    .text-content p {
      font-size: 14px;
      white-space: pre-wrap;
      line-height: 1.6;
    }

    /* Print styles */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .section-card {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }

    @page {
      size: A4;
      margin: 10mm;
    }
  </style>
</head>
<body>
  <div class="resume-container">
    <!-- Header -->
    <div class="resume-header">
      <h1 class="resume-title">履 歴 書</h1>
      <p class="resume-date">${today}</p>
    </div>

    <div class="resume-content">
      <!-- Basic Information -->
      <div class="section-card">
        <div class="basic-info-grid">
          <!-- Photo -->
          <div class="photo-cell">
            <div class="photo-box">
              ${photoUrl
                ? `<img src="${photoUrl}" alt="証明写真">`
                : `<span class="photo-placeholder">写真<br>3×4cm</span>`
              }
            </div>
          </div>

          <!-- Name -->
          <div class="name-row">
            <div class="furigana-row">
              <span class="furigana-label">ふりがな</span>
              <span class="furigana-value">${escapeHtml(resume.full_name_kana) || '-'}</span>
            </div>
            <div class="name-content">
              <span class="name-label">氏名</span>
              <span class="name-value">${escapeHtml(resume.full_name) || '未入力'}</span>
            </div>
          </div>

          <!-- Birth & Age -->
          <div class="birth-age-row">
            <div class="birth-cell">
              <span class="info-label">生年月日</span>
              <span class="info-value">${resume.birth_date ? formatFullDate(resume.birth_date) : '-'}</span>
            </div>
            <div class="age-cell">
              <span class="info-label">年齢</span>
              <span class="info-value">${age ? `満${age}歳` : '-'}</span>
            </div>
          </div>

          <!-- Address -->
          <div class="address-row">
            <div class="postal-row">
              <span class="postal-label">〒</span>
              <span class="postal-value">${escapeHtml(resume.postal_code) || '-'}</span>
            </div>
            <div class="address-content">
              <span class="info-label">現住所</span>
              <span class="info-value">${escapeHtml(resume.address) || '未入力'}</span>
            </div>
          </div>

          <!-- Contact -->
          <div class="contact-row">
            <div class="phone-cell">
              <span class="info-label">電話番号</span>
              <span class="info-value">${escapeHtml(resume.phone) || '-'}</span>
            </div>
            <div class="email-cell">
              <span class="info-label">メールアドレス</span>
              <span class="info-value email-value">${escapeHtml(resume.email) || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Education & Work History -->
      <div class="section-card">
        <div class="section-header">学歴・職歴</div>

        <!-- Education -->
        <div class="section-subheader">学歴</div>
        ${educationData.length > 0 ? educationData.map(edu => `
          <div class="history-row">
            <div class="history-date">${formatJapaneseDate(edu.start_date)}</div>
            <div class="history-content">${escapeHtml(edu.school_name)} ${escapeHtml(edu.faculty)} 入学</div>
          </div>
          <div class="history-row">
            <div class="history-date">${formatJapaneseDate(edu.end_date)}</div>
            <div class="history-content">${escapeHtml(edu.school_name)} ${escapeHtml(edu.faculty)} 卒業</div>
          </div>
        `).join('') : `
          <div class="empty-message">学歴を入力してください</div>
        `}

        <!-- Work History -->
        <div class="section-subheader">職歴</div>
        ${workHistories.length > 0 ? workHistories.map(wh => `
          <div class="history-row">
            <div class="history-date">${formatJapaneseDate(wh.start_date)}</div>
            <div class="history-content">
              <span class="company-name">${escapeHtml(wh.company_name)}</span> 入社
              ${wh.department ? `<span class="department">(${escapeHtml(wh.department)})</span>` : ''}
            </div>
          </div>
          ${(wh.description || wh.ai_description) ? `
            <div class="history-row">
              <div class="history-date"></div>
              <div class="history-description">
                ${wh.position ? `${escapeHtml(wh.position)}として ` : ''}${escapeHtml(wh.ai_description || wh.description)}
              </div>
            </div>
          ` : ''}
          ${wh.is_current ? `
            <div class="history-row">
              <div class="history-date"></div>
              <div class="history-content" style="color: #4b5563;">現在に至る</div>
            </div>
          ` : wh.end_date ? `
            <div class="history-row">
              <div class="history-date">${formatJapaneseDate(wh.end_date)}</div>
              <div class="history-content">一身上の都合により退職</div>
            </div>
          ` : ''}
        `).join('') : `
          <div class="empty-message">職歴を入力してください</div>
        `}
        <div class="history-footer">以上</div>
      </div>

      <!-- Certifications -->
      <div class="section-card">
        <div class="section-header">免許・資格</div>
        ${certifications.length > 0 ? certifications.map(cert => `
          <div class="cert-item">${escapeHtml(cert)}</div>
        `).join('') : `
          <div class="empty-message">資格・免許を入力してください</div>
        `}
      </div>

      ${skillNames.length > 0 ? `
      <!-- Skills -->
      <div class="section-card">
        <div class="section-header">スキル</div>
        <div class="skills-container">
          <div class="skills-list">
            ${skillNames.map(skill => `
              <span class="skill-badge">${escapeHtml(skill)}</span>
            `).join('')}
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Self PR -->
      <div class="section-card">
        <div class="section-header">自己PR</div>
        <div class="text-content">
          ${resume.ai_self_pr ? `
            <p>${escapeHtml(resume.ai_self_pr)}</p>
          ` : `
            <p class="empty-message" style="padding: 32px 0;">自己PRを入力してください</p>
          `}
        </div>
      </div>

      ${resume.ai_career_objective ? `
      <!-- Career Objective -->
      <div class="section-card">
        <div class="section-header">志望動機</div>
        <div class="text-content">
          <p>${escapeHtml(resume.ai_career_objective)}</p>
        </div>
      </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
`;
}
