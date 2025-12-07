'use client';

import { useState } from 'react';
import { useResumeFormStore } from '@/store/resume-form-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

const COMMON_HARD_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Node.js',
  'Python', 'Java', 'Go', 'AWS', 'Docker',
  'SQL', 'PostgreSQL', 'MongoDB', 'Git', 'CI/CD',
  'Figma', 'Photoshop', 'Illustrator',
  'Excel', 'PowerPoint', 'Word',
];

const COMMON_SOFT_SKILLS = [
  'リーダーシップ', 'コミュニケーション', 'チームワーク',
  'プロジェクト管理', '問題解決', 'プレゼンテーション',
  '交渉力', '顧客対応', 'マネジメント',
];

export function SkillsStep() {
  const {
    skills,
    addSkill,
    removeSkill,
    languages,
    setLanguages,
    certifications,
    setCertifications,
  } = useResumeFormStore();

  const [newSkill, setNewSkill] = useState('');
  const [skillType, setSkillType] = useState<'hard' | 'soft'>('hard');
  const [newLanguage, setNewLanguage] = useState('');
  const [newLanguageLevel, setNewLanguageLevel] = useState('');
  const [newCertification, setNewCertification] = useState('');

  const hardSkills = skills.filter((s) => s.skill_type === 'hard');
  const softSkills = skills.filter((s) => s.skill_type === 'soft');

  const handleAddSkill = (skillName?: string) => {
    const name = skillName || newSkill.trim();
    if (name && !skills.some((s) => s.skill_name === name)) {
      addSkill({
        skill_name: name,
        skill_type: skillType,
        proficiency_level: null,
        years_of_experience: null,
      });
      setNewSkill('');
    }
  };

  const handleAddLanguage = () => {
    if (newLanguage.trim()) {
      setLanguages([
        ...languages,
        { language: newLanguage.trim(), level: newLanguageLevel || 'ビジネスレベル' },
      ]);
      setNewLanguage('');
      setNewLanguageLevel('');
    }
  };

  const handleRemoveLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const handleAddCertification = () => {
    if (newCertification.trim() && !certifications.includes(newCertification.trim())) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification('');
    }
  };

  const handleRemoveCertification = (cert: string) => {
    setCertifications(certifications.filter((c) => c !== cert));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">スキル・資格</h2>

        {/* Skill Type Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setSkillType('hard')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              skillType === 'hard'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            技術スキル
          </button>
          <button
            type="button"
            onClick={() => setSkillType('soft')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              skillType === 'soft'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ソフトスキル
          </button>
        </div>

        {/* Add Custom Skill */}
        <div className="flex gap-2 mb-4">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder={skillType === 'hard' ? 'スキル名を入力' : 'ソフトスキルを入力'}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
          />
          <Button variant="outline" onClick={() => handleAddSkill()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Common Skills Suggestions */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">よく使われるスキル：</p>
          <div className="flex flex-wrap gap-2">
            {(skillType === 'hard' ? COMMON_HARD_SKILLS : COMMON_SOFT_SKILLS).map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => handleAddSkill(skill)}
                disabled={skills.some((s) => s.skill_name === skill)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  skills.some((s) => s.skill_name === skill)
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                }`}
              >
                + {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Skills */}
        <div className="space-y-4">
          {hardSkills.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">技術スキル</h3>
              <div className="flex flex-wrap gap-2">
                {hardSkills.map((skill, index) => (
                  <Badge key={index} variant="default">
                    {skill.skill_name}
                    <button
                      type="button"
                      onClick={() => removeSkill(skills.indexOf(skill))}
                      className="ml-1 hover:text-red-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {softSkills.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">ソフトスキル</h3>
              <div className="flex flex-wrap gap-2">
                {softSkills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill.skill_name}
                    <button
                      type="button"
                      onClick={() => removeSkill(skills.indexOf(skill))}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Languages */}
      <div>
        <h3 className="text-lg font-medium mb-3">語学</h3>
        <div className="flex gap-2 mb-3">
          <Input
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
            placeholder="言語名（例: 英語）"
            className="flex-1"
          />
          <Input
            value={newLanguageLevel}
            onChange={(e) => setNewLanguageLevel(e.target.value)}
            placeholder="レベル（例: ビジネスレベル）"
            className="flex-1"
          />
          <Button variant="outline" onClick={handleAddLanguage}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {languages.map((lang, index) => (
            <Badge key={index} variant="outline">
              {lang.language} - {lang.level}
              <button
                type="button"
                onClick={() => handleRemoveLanguage(index)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div>
        <h3 className="text-lg font-medium mb-3">資格・免許</h3>
        <div className="flex gap-2 mb-3">
          <Input
            value={newCertification}
            onChange={(e) => setNewCertification(e.target.value)}
            placeholder="資格名（例: 基本情報技術者）"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCertification())}
          />
          <Button variant="outline" onClick={handleAddCertification}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {certifications.map((cert) => (
            <Badge key={cert} variant="outline">
              {cert}
              <button
                type="button"
                onClick={() => handleRemoveCertification(cert)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
