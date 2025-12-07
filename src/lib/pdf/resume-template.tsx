import React from 'react';
import fs from 'fs';
import path from 'path';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import type { Resume, WorkHistory, Skill } from '@/types/database';

// Register IPAex Gothic font for Japanese support using Buffer
const fontPath = path.join(process.cwd(), 'public', 'fonts', 'ipaexg.ttf');
let fontRegistered = false;

try {
  if (fs.existsSync(fontPath)) {
    const fontBuffer = fs.readFileSync(fontPath);
    Font.register({
      family: 'IPAexGothic',
      src: `data:font/truetype;base64,${fontBuffer.toString('base64')}`,
    });
    fontRegistered = true;
    console.log('IPAexGothic font registered successfully');
  } else {
    console.warn('Font file not found:', fontPath);
  }
} catch (error) {
  console.error('Failed to register font:', error);
}

// Hyphenation callback to prevent word breaking issues with Japanese
Font.registerHyphenationCallback((word) => [word]);

// Colors matching Tailwind
const colors = {
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  blue600: '#2563eb',
  blue700: '#1d4ed8',
  white: '#ffffff',
};

const styles = StyleSheet.create({
  page: {
    fontFamily: fontRegistered ? 'IPAexGothic' : 'Helvetica',
    fontSize: 10,
    padding: 30,
    backgroundColor: colors.gray50,
  },
  // Card matching shadcn/ui Card component
  card: {
    marginBottom: 12,
    backgroundColor: colors.white,
    borderRadius: 8,
    border: `1 solid ${colors.gray200}`,
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.gray900,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  // Header with photo
  headerContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.gray900,
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 9,
    color: colors.gray500,
    textAlign: 'center',
  },
  // Photo container - JIS standard size 30mm x 40mm
  photoContainer: {
    width: 85,
    height: 113,
    marginLeft: 16,
    backgroundColor: colors.gray100,
    borderRadius: 4,
    border: `1 solid ${colors.gray200}`,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPlaceholderText: {
    fontSize: 8,
    color: colors.gray400,
    textAlign: 'center',
  },
  // Grid layout for basic info (2 columns)
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '50%',
    marginBottom: 8,
  },
  gridItemFull: {
    width: '100%',
    marginBottom: 8,
  },
  label: {
    fontSize: 9,
    color: colors.gray500,
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    color: colors.gray900,
  },
  // Work history items
  workItem: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottom: `1 solid ${colors.gray100}`,
  },
  workItemLast: {
    marginBottom: 0,
    paddingBottom: 0,
  },
  companyName: {
    fontSize: 11,
    fontWeight: 500,
    color: colors.gray900,
    marginBottom: 2,
  },
  positionPeriod: {
    fontSize: 9,
    color: colors.gray500,
    marginBottom: 4,
  },
  description: {
    fontSize: 9,
    color: colors.gray700,
    lineHeight: 1.5,
    marginTop: 4,
  },
  achievements: {
    fontSize: 9,
    color: colors.blue700,
    lineHeight: 1.5,
    marginTop: 2,
  },
  // Skills
  skillsRow: {
    marginBottom: 6,
  },
  skillLabel: {
    fontSize: 9,
    color: colors.gray500,
  },
  skillValue: {
    fontSize: 10,
    color: colors.gray900,
    marginLeft: 6,
  },
  // Section text
  sectionText: {
    fontSize: 10,
    color: colors.gray700,
    lineHeight: 1.6,
  },
  // Education items
  educationRow: {
    marginBottom: 4,
  },
  educationText: {
    fontSize: 10,
    color: colors.gray900,
    marginLeft: 6,
  },
});

interface ResumeDocumentProps {
  resume: Resume;
  workHistories: WorkHistory[];
  skills: Skill[];
  templateType: 'jis' | 'modern' | 'engineer';
}

export function ResumeDocument({ resume, workHistories, skills }: ResumeDocumentProps) {
  const formatDateShort = (date: string | null) => {
    if (!date) return '';
    return date.substring(0, 7).replace('-', '/');
  };

  const calculateAge = (birthDate: string | null) => {
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

  const hardSkills = skills.filter(s => s.skill_type === 'hard');
  const softSkills = skills.filter(s => s.skill_type === 'soft');
  const age = calculateAge(resume.birth_date);
  const photoUrl = resume.photo_processed_url || resume.photo_url;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Title and Photo */}
        <View style={styles.headerContainer}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>履歴書</Text>
            <Text style={styles.headerSubtitle}>
              作成日：{new Date().toLocaleDateString('ja-JP')}
            </Text>
          </View>
          <View style={styles.photoContainer}>
            {photoUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={photoUrl} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>証明写真</Text>
              </View>
            )}
          </View>
        </View>

        {/* Basic Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>基本情報</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.gridContainer}>
              <View style={styles.gridItem}>
                <Text style={styles.label}>氏名：</Text>
                <Text style={styles.value}>
                  {resume.full_name || '-'} {resume.full_name_kana && `（${resume.full_name_kana}）`}
                </Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>年齢：</Text>
                <Text style={styles.value}>{age ? `${age}歳` : '-'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>住所：</Text>
                <Text style={styles.value}>{resume.address || '-'}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.label}>電話：</Text>
                <Text style={styles.value}>{resume.phone || '-'}</Text>
              </View>
              <View style={styles.gridItemFull}>
                <Text style={styles.label}>メール：</Text>
                <Text style={styles.value}>{resume.email || '-'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Career Summary Card */}
        {resume.ai_summary && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>職務要約</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.sectionText}>{resume.ai_summary}</Text>
            </View>
          </View>
        )}

        {/* Work History Card */}
        {workHistories.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>職務経歴</Text>
            </View>
            <View style={styles.cardContent}>
              {workHistories.map((wh, index) => (
                <View
                  key={index}
                  style={[
                    styles.workItem,
                    index === workHistories.length - 1 ? styles.workItemLast : undefined
                  ]}
                >
                  <Text style={styles.companyName}>{wh.company_name}</Text>
                  <Text style={styles.positionPeriod}>
                    {wh.position && `${wh.position} / `}
                    {formatDateShort(wh.start_date)} 〜 {wh.is_current ? '現在' : formatDateShort(wh.end_date)}
                  </Text>
                  {(wh.ai_description || wh.description) && (
                    <Text style={styles.description}>
                      {wh.ai_description || wh.description}
                    </Text>
                  )}
                  {(wh.ai_achievements || wh.achievements) && (
                    <Text style={styles.achievements}>
                      【実績】{wh.ai_achievements || wh.achievements}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Skills Card */}
        {skills.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>スキル</Text>
            </View>
            <View style={styles.cardContent}>
              {hardSkills.length > 0 && (
                <View style={styles.skillsRow}>
                  <Text style={styles.skillLabel}>
                    技術スキル：
                    <Text style={styles.skillValue}>
                      {hardSkills.map(s => s.skill_name).join(', ')}
                    </Text>
                  </Text>
                </View>
              )}
              {softSkills.length > 0 && (
                <View style={styles.skillsRow}>
                  <Text style={styles.skillLabel}>
                    ソフトスキル：
                    <Text style={styles.skillValue}>
                      {softSkills.map(s => s.skill_name).join(', ')}
                    </Text>
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Self PR Card */}
        {resume.ai_self_pr && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>自己PR</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.sectionText}>{resume.ai_self_pr}</Text>
            </View>
          </View>
        )}

        {/* Career Objective Card */}
        {resume.ai_career_objective && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>志望動機</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.sectionText}>{resume.ai_career_objective}</Text>
            </View>
          </View>
        )}

        {/* Education & Certifications Card */}
        {((resume.education && Array.isArray(resume.education) && resume.education.length > 0) ||
          (resume.certifications && resume.certifications.length > 0) ||
          (resume.languages && resume.languages.length > 0)) && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>学歴・資格・語学</Text>
            </View>
            <View style={styles.cardContent}>
              {resume.education && Array.isArray(resume.education) && resume.education.length > 0 && (
                <View style={styles.skillsRow}>
                  <Text style={styles.skillLabel}>学歴：</Text>
                  {resume.education.map((edu, index) => (
                    <View key={index} style={styles.educationRow}>
                      <Text style={styles.educationText}>
                        {edu.school_name || ''} {edu.faculty ? edu.faculty : ''} {edu.degree || ''}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              {resume.certifications && resume.certifications.length > 0 && (
                <View style={styles.skillsRow}>
                  <Text style={styles.skillLabel}>
                    資格：
                    <Text style={styles.skillValue}>
                      {resume.certifications.join(', ')}
                    </Text>
                  </Text>
                </View>
              )}
              {resume.languages && resume.languages.length > 0 && (
                <View style={styles.skillsRow}>
                  <Text style={styles.skillLabel}>
                    語学：
                    <Text style={styles.skillValue}>
                      {resume.languages.map(l => `${l.language}(${l.level})`).join(', ')}
                    </Text>
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
