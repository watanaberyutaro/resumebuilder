import React from 'react';
import fs from 'fs';
import path from 'path';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import type { Resume, WorkHistory, Skill, Education } from '@/types/database';

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

// Colors matching Tailwind gray palette
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
  blue50: '#eff6ff',
  blue700: '#1d4ed8',
  white: '#ffffff',
};

const styles = StyleSheet.create({
  page: {
    fontFamily: fontRegistered ? 'IPAexGothic' : 'Helvetica',
    fontSize: 10,
    padding: 24,
    backgroundColor: colors.white,
  },
  // Header - dark background with title
  header: {
    backgroundColor: colors.gray800,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 0,
    marginHorizontal: -24,
    marginTop: -24,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 4,
  },
  headerDate: {
    fontSize: 8,
    color: colors.gray300,
    textAlign: 'right',
    marginTop: 4,
  },
  // Content container
  content: {
    padding: 24,
    paddingTop: 16,
  },
  // Basic info section
  basicInfoSection: {
    border: `1 solid ${colors.gray300}`,
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  basicInfoGrid: {
    flexDirection: 'row',
  },
  // Photo column
  photoColumn: {
    width: 80,
    borderRight: `1 solid ${colors.gray300}`,
    padding: 8,
    backgroundColor: colors.gray50,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 120,
  },
  photoBox: {
    width: 60,
    height: 84,
    border: `1 dashed ${colors.gray300}`,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoPlaceholder: {
    fontSize: 7,
    color: colors.gray400,
    textAlign: 'center',
  },
  // Info column
  infoColumn: {
    flex: 1,
  },
  // Name row
  nameRow: {
    borderBottom: `1 solid ${colors.gray300}`,
  },
  furiganaRow: {
    backgroundColor: colors.gray50,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottom: `1 solid ${colors.gray200}`,
    flexDirection: 'row',
    alignItems: 'center',
  },
  furiganaLabel: {
    fontSize: 8,
    color: colors.gray500,
  },
  furiganaValue: {
    fontSize: 9,
    color: colors.gray700,
    marginLeft: 8,
  },
  nameMainRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameLabel: {
    fontSize: 8,
    color: colors.gray500,
  },
  nameValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.gray900,
    marginLeft: 8,
  },
  // Birth date & age row
  birthAgeRow: {
    borderBottom: `1 solid ${colors.gray300}`,
    flexDirection: 'row',
  },
  birthDateCell: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRight: `1 solid ${colors.gray300}`,
  },
  ageCell: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cellLabel: {
    fontSize: 8,
    color: colors.gray500,
    marginBottom: 2,
  },
  cellValue: {
    fontSize: 9,
    color: colors.gray900,
  },
  // Address row
  addressRow: {
    borderBottom: `1 solid ${colors.gray300}`,
  },
  postalRow: {
    backgroundColor: colors.gray50,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottom: `1 solid ${colors.gray200}`,
    flexDirection: 'row',
    alignItems: 'center',
  },
  postalLabel: {
    fontSize: 8,
    color: colors.gray500,
  },
  postalValue: {
    fontSize: 9,
    color: colors.gray900,
    marginLeft: 4,
  },
  addressMainRow: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  // Contact row
  contactRow: {
    flexDirection: 'row',
  },
  contactCell: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  contactCellBorder: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRight: `1 solid ${colors.gray300}`,
  },
  // Section with header
  section: {
    border: `1 solid ${colors.gray300}`,
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    backgroundColor: colors.gray800,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'medium',
    color: colors.white,
  },
  // Education/Work history table
  historySubHeader: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottom: `1 solid ${colors.gray200}`,
  },
  historySubTitle: {
    fontSize: 8,
    fontWeight: 'medium',
    color: colors.gray600,
    textAlign: 'center',
  },
  historyRow: {
    flexDirection: 'row',
    borderBottom: `1 solid ${colors.gray200}`,
  },
  historyDateCell: {
    width: 70,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRight: `1 solid ${colors.gray200}`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyDateText: {
    fontSize: 9,
    color: colors.gray600,
    textAlign: 'center',
  },
  historyContentCell: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  historyContentText: {
    fontSize: 9,
    color: colors.gray900,
  },
  historyContentBold: {
    fontSize: 9,
    fontWeight: 'medium',
    color: colors.gray900,
  },
  historyDescription: {
    fontSize: 8,
    color: colors.gray600,
    marginTop: 2,
  },
  historyFooter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTop: `1 solid ${colors.gray200}`,
  },
  historyFooterText: {
    fontSize: 9,
    color: colors.gray600,
    textAlign: 'right',
  },
  // Empty state
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 9,
    color: colors.gray400,
  },
  // Certification list
  certificationItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottom: `1 solid ${colors.gray200}`,
  },
  certificationText: {
    fontSize: 9,
    color: colors.gray900,
  },
  // Skills badges
  skillsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.blue50,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  skillBadgeText: {
    fontSize: 9,
    color: colors.blue700,
  },
  // PR section
  prContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 80,
  },
  prText: {
    fontSize: 9,
    color: colors.gray900,
    lineHeight: 1.6,
  },
});

interface ResumeDocumentProps {
  resume: Resume;
  workHistories: WorkHistory[];
  skills: Skill[];
  templateType: 'jis' | 'modern' | 'engineer';
}

// Helper function to format date as "YYYY年M月"
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

// Helper function to format full date as "YYYY年M月D日"
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

// Helper function to calculate age
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

export function ResumeDocument({ resume, workHistories, skills }: ResumeDocumentProps) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日現在`;
  const age = calculateAge(resume.birth_date);
  const photoUrl = resume.photo_processed_url || resume.photo_url;

  // Parse education from JSONB
  const education = Array.isArray(resume.education) ? resume.education : [];
  const certifications = resume.certifications || [];
  const skillNames = skills.map(s => s.skill_name);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>履 歴 書</Text>
          <Text style={styles.headerDate}>{todayStr}</Text>
        </View>

        <View style={styles.content}>
          {/* Basic Information */}
          <View style={styles.basicInfoSection}>
            <View style={styles.basicInfoGrid}>
              {/* Photo */}
              <View style={styles.photoColumn}>
                <View style={styles.photoBox}>
                  {photoUrl ? (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <Image src={photoUrl} style={styles.photo} />
                  ) : (
                    <Text style={styles.photoPlaceholder}>写真{'\n'}3×4cm</Text>
                  )}
                </View>
              </View>

              {/* Info */}
              <View style={styles.infoColumn}>
                {/* Name */}
                <View style={styles.nameRow}>
                  <View style={styles.furiganaRow}>
                    <Text style={styles.furiganaLabel}>ふりがな</Text>
                    <Text style={styles.furiganaValue}>{resume.full_name_kana || '-'}</Text>
                  </View>
                  <View style={styles.nameMainRow}>
                    <Text style={styles.nameLabel}>氏名</Text>
                    <Text style={styles.nameValue}>{resume.full_name || '未入力'}</Text>
                  </View>
                </View>

                {/* Birth date & Age */}
                <View style={styles.birthAgeRow}>
                  <View style={styles.birthDateCell}>
                    <Text style={styles.cellLabel}>生年月日</Text>
                    <Text style={styles.cellValue}>
                      {resume.birth_date ? formatFullDate(resume.birth_date) : '-'}
                    </Text>
                  </View>
                  <View style={styles.ageCell}>
                    <Text style={styles.cellLabel}>年齢</Text>
                    <Text style={styles.cellValue}>{age !== null ? `満${age}歳` : '-'}</Text>
                  </View>
                </View>

                {/* Address */}
                <View style={styles.addressRow}>
                  <View style={styles.postalRow}>
                    <Text style={styles.postalLabel}>〒</Text>
                    <Text style={styles.postalValue}>{resume.postal_code || '-'}</Text>
                  </View>
                  <View style={styles.addressMainRow}>
                    <Text style={styles.cellLabel}>現住所</Text>
                    <Text style={styles.cellValue}>{resume.address || '未入力'}</Text>
                  </View>
                </View>

                {/* Contact */}
                <View style={styles.contactRow}>
                  <View style={styles.contactCellBorder}>
                    <Text style={styles.cellLabel}>電話番号</Text>
                    <Text style={styles.cellValue}>{resume.phone || '-'}</Text>
                  </View>
                  <View style={styles.contactCell}>
                    <Text style={styles.cellLabel}>メールアドレス</Text>
                    <Text style={styles.cellValue}>{resume.email || '-'}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Education & Work History */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>学歴・職歴</Text>
            </View>

            {/* Education */}
            <View style={styles.historySubHeader}>
              <Text style={styles.historySubTitle}>学歴</Text>
            </View>
            {education.length > 0 ? (
              education.map((edu: Education, index: number) => (
                <React.Fragment key={`edu-${index}`}>
                  <View style={styles.historyRow}>
                    <View style={styles.historyDateCell}>
                      <Text style={styles.historyDateText}>
                        {formatJapaneseDate(edu.start_date || null)}
                      </Text>
                    </View>
                    <View style={styles.historyContentCell}>
                      <Text style={styles.historyContentText}>
                        {edu.school_name || ''} {edu.faculty || ''} 入学
                      </Text>
                    </View>
                  </View>
                  <View style={styles.historyRow}>
                    <View style={styles.historyDateCell}>
                      <Text style={styles.historyDateText}>
                        {formatJapaneseDate(edu.end_date || null)}
                      </Text>
                    </View>
                    <View style={styles.historyContentCell}>
                      <Text style={styles.historyContentText}>
                        {edu.school_name || ''} {edu.faculty || ''} 卒業
                      </Text>
                    </View>
                  </View>
                </React.Fragment>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>学歴を入力してください</Text>
              </View>
            )}

            {/* Work History */}
            <View style={styles.historySubHeader}>
              <Text style={styles.historySubTitle}>職歴</Text>
            </View>
            {workHistories.length > 0 ? (
              <>
                {workHistories.map((work, index) => (
                  <React.Fragment key={`work-${index}`}>
                    <View style={styles.historyRow}>
                      <View style={styles.historyDateCell}>
                        <Text style={styles.historyDateText}>
                          {formatJapaneseDate(work.start_date)}
                        </Text>
                      </View>
                      <View style={styles.historyContentCell}>
                        <Text style={styles.historyContentBold}>
                          {work.company_name} 入社
                          {work.department && ` (${work.department})`}
                        </Text>
                        {work.description && (
                          <Text style={styles.historyDescription}>
                            {work.position && `${work.position}として `}
                            {work.description}
                          </Text>
                        )}
                      </View>
                    </View>
                    {work.is_current ? (
                      <View style={styles.historyRow}>
                        <View style={styles.historyDateCell}>
                          <Text style={styles.historyDateText}></Text>
                        </View>
                        <View style={styles.historyContentCell}>
                          <Text style={styles.historyContentText}>現在に至る</Text>
                        </View>
                      </View>
                    ) : work.end_date && (
                      <View style={styles.historyRow}>
                        <View style={styles.historyDateCell}>
                          <Text style={styles.historyDateText}>
                            {formatJapaneseDate(work.end_date)}
                          </Text>
                        </View>
                        <View style={styles.historyContentCell}>
                          <Text style={styles.historyContentText}>一身上の都合により退職</Text>
                        </View>
                      </View>
                    )}
                  </React.Fragment>
                ))}
                <View style={styles.historyFooter}>
                  <Text style={styles.historyFooterText}>以上</Text>
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>職歴を入力してください</Text>
              </View>
            )}
          </View>

          {/* Certifications */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>免許・資格</Text>
            </View>
            {certifications.length > 0 ? (
              certifications.map((cert, index) => (
                <View key={index} style={styles.certificationItem}>
                  <Text style={styles.certificationText}>{cert}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>資格・免許を入力してください</Text>
              </View>
            )}
          </View>

          {/* Skills */}
          {skillNames.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>スキル</Text>
              </View>
              <View style={styles.skillsContainer}>
                <View style={styles.skillsRow}>
                  {skillNames.map((skill, index) => (
                    <View key={index} style={styles.skillBadge}>
                      <Text style={styles.skillBadgeText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Self PR */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>自己PR</Text>
            </View>
            <View style={styles.prContent}>
              {resume.ai_self_pr ? (
                <Text style={styles.prText}>{resume.ai_self_pr}</Text>
              ) : (
                <Text style={styles.emptyText}>自己PRを入力してください</Text>
              )}
            </View>
          </View>

          {/* Career Objective */}
          {resume.ai_career_objective && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>志望動機</Text>
              </View>
              <View style={styles.prContent}>
                <Text style={styles.prText}>{resume.ai_career_objective}</Text>
              </View>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
}
