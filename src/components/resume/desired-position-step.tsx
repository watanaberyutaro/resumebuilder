'use client';

import { useResumeFormStore } from '@/store/resume-form-store';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { useState } from 'react';

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

const LOCATION_OPTIONS = [
  '東京都', '大阪府', '愛知県', '福岡県', '北海道',
  '神奈川県', '埼玉県', '千葉県', '兵庫県', '京都府',
  'リモート勤務可', 'その他',
];

export function DesiredPositionStep() {
  const {
    desiredJobCategory,
    desiredIndustries,
    desiredPositions,
    desiredSalaryMin,
    desiredSalaryMax,
    desiredWorkLocations,
    setDesiredPosition,
  } = useResumeFormStore();

  const [newIndustry, setNewIndustry] = useState('');
  const [newPosition, setNewPosition] = useState('');

  const addIndustry = () => {
    if (newIndustry.trim() && !desiredIndustries.includes(newIndustry.trim())) {
      setDesiredPosition({
        desiredIndustries: [...desiredIndustries, newIndustry.trim()],
      });
      setNewIndustry('');
    }
  };

  const removeIndustry = (industry: string) => {
    setDesiredPosition({
      desiredIndustries: desiredIndustries.filter((i) => i !== industry),
    });
  };

  const addPosition = () => {
    if (newPosition.trim() && !desiredPositions.includes(newPosition.trim())) {
      setDesiredPosition({
        desiredPositions: [...desiredPositions, newPosition.trim()],
      });
      setNewPosition('');
    }
  };

  const removePosition = (position: string) => {
    setDesiredPosition({
      desiredPositions: desiredPositions.filter((p) => p !== position),
    });
  };

  const toggleLocation = (location: string) => {
    if (desiredWorkLocations.includes(location)) {
      setDesiredPosition({
        desiredWorkLocations: desiredWorkLocations.filter((l) => l !== location),
      });
    } else {
      setDesiredPosition({
        desiredWorkLocations: [...desiredWorkLocations, location],
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">希望職種・条件</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            希望職種カテゴリ
          </label>
          <Select
            value={desiredJobCategory}
            onChange={(e) => setDesiredPosition({ desiredJobCategory: e.target.value as typeof desiredJobCategory })}
            options={JOB_CATEGORY_OPTIONS}
            placeholder="選択してください"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            希望業界
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newIndustry}
              onChange={(e) => setNewIndustry(e.target.value)}
              placeholder="例: IT、金融、製造"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIndustry())}
            />
            <Button type="button" variant="outline" onClick={addIndustry}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {desiredIndustries.map((industry) => (
              <Badge key={industry} variant="secondary">
                {industry}
                <button
                  type="button"
                  onClick={() => removeIndustry(industry)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            希望ポジション
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              placeholder="例: フロントエンドエンジニア、営業マネージャー"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPosition())}
            />
            <Button type="button" variant="outline" onClick={addPosition}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {desiredPositions.map((position) => (
              <Badge key={position} variant="secondary">
                {position}
                <button
                  type="button"
                  onClick={() => removePosition(position)}
                  className="ml-1 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            希望年収（万円）
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={desiredSalaryMin || ''}
              onChange={(e) => setDesiredPosition({ desiredSalaryMin: e.target.value ? Number(e.target.value) : null })}
              placeholder="最低"
              className="w-32"
            />
            <span className="text-gray-500">〜</span>
            <Input
              type="number"
              value={desiredSalaryMax || ''}
              onChange={(e) => setDesiredPosition({ desiredSalaryMax: e.target.value ? Number(e.target.value) : null })}
              placeholder="最高"
              className="w-32"
            />
            <span className="text-sm text-gray-500">万円</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            希望勤務地
          </label>
          <div className="flex flex-wrap gap-2">
            {LOCATION_OPTIONS.map((location) => (
              <button
                key={location}
                type="button"
                onClick={() => toggleLocation(location)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  desiredWorkLocations.includes(location)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {location}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
