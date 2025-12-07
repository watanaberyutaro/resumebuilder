'use client';

import { useResumeFormStore } from '@/store/resume-form-store';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PhotoUpload } from './photo-upload';

const GENDER_OPTIONS = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
  { value: 'prefer_not_to_say', label: '回答しない' },
];

export function BasicInfoStep() {
  const {
    fullName,
    fullNameKana,
    birthDate,
    gender,
    postalCode,
    address,
    phone,
    email,
    setBasicInfo,
  } = useResumeFormStore();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">基本情報</h2>

      {/* Photo Upload Section */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <PhotoUpload />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            氏名 <span className="text-red-500">*</span>
          </label>
          <Input
            value={fullName}
            onChange={(e) => setBasicInfo({ fullName: e.target.value })}
            placeholder="山田 太郎"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            氏名（フリガナ）
          </label>
          <Input
            value={fullNameKana}
            onChange={(e) => setBasicInfo({ fullNameKana: e.target.value })}
            placeholder="ヤマダ タロウ"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            生年月日
          </label>
          <Input
            type="date"
            value={birthDate}
            onChange={(e) => setBasicInfo({ birthDate: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            性別
          </label>
          <Select
            value={gender}
            onChange={(e) => setBasicInfo({ gender: e.target.value })}
            options={GENDER_OPTIONS}
            placeholder="選択してください"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            郵便番号
          </label>
          <Input
            value={postalCode}
            onChange={(e) => setBasicInfo({ postalCode: e.target.value })}
            placeholder="123-4567"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            住所
          </label>
          <Input
            value={address}
            onChange={(e) => setBasicInfo({ address: e.target.value })}
            placeholder="東京都渋谷区〇〇1-2-3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            電話番号
          </label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setBasicInfo({ phone: e.target.value })}
            placeholder="090-1234-5678"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setBasicInfo({ email: e.target.value })}
            placeholder="example@email.com"
          />
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          入力された情報は自動的に保存されます。後からいつでも編集できます。
        </p>
      </div>
    </div>
  );
}
