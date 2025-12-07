'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { User, MapPin, Phone, Calendar, Mail, Save, Loader2, Camera, Upload, X, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { IDPhotoGenerator } from '@/components/photo/id-photo-generator';

interface UserProfile {
  id: string;
  display_name: string | null;
  phone: string | null;
  email: string;
}

interface ResumeData {
  id: string;
  full_name: string | null;
  full_name_kana: string | null;
  birth_date: string | null;
  gender: string | null;
  postal_code: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  photo_processed_url: string | null;
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [resume, setResume] = useState<ResumeData | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [fullNameKana, setFullNameKana] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Photo state
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoProcessedUrl, setPhotoProcessedUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showIDPhotoModal, setShowIDPhotoModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Get resume (get first one if multiple exist)
      const { data: resumeDataList } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const resumeData = resumeDataList && resumeDataList.length > 0 ? resumeDataList[0] : null;

      if (resumeData) {
        setResume(resumeData);
        setFullName(resumeData.full_name || '');
        setFullNameKana(resumeData.full_name_kana || '');
        setBirthDate(resumeData.birth_date || '');
        setGender(resumeData.gender || '');
        setPostalCode(resumeData.postal_code || '');
        setAddress(resumeData.address || '');
        setPhone(resumeData.phone || '');
        setEmail(resumeData.email || user.email || '');
        setPhotoUrl(resumeData.photo_url);
        setPhotoProcessedUrl(resumeData.photo_processed_url);
      } else {
        setEmail(user.email || '');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostalCodeChange = async (value: string) => {
    setPostalCode(value);

    const cleanCode = value.replace('-', '');
    if (cleanCode.length === 7) {
      try {
        const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleanCode}`);
        const data = await res.json();
        if (data.results && data.results[0]) {
          const result = data.results[0];
          setAddress(`${result.address1}${result.address2}${result.address3}`);
        }
      } catch {
        // Ignore errors
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('画像ファイルを選択してください');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('ファイルサイズは5MB以下にしてください');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('ログインが必要です');
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('resume-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('resume-photos')
        .getPublicUrl(fileName);

      setPhotoUrl(publicUrl);
      setPhotoProcessedUrl(null);

      // Update resume in database if exists
      if (resume) {
        await supabase
          .from('resumes')
          .update({ photo_url: publicUrl, photo_processed_url: null })
          .eq('id', resume.id);
      }

      toast.success('写真をアップロードしました');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('アップロードに失敗しました');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    setPhotoUrl(null);
    setPhotoProcessedUrl(null);

    if (resume) {
      const supabase = createClient();
      await supabase
        .from('resumes')
        .update({ photo_url: null, photo_processed_url: null })
        .eq('id', resume.id);
    }

    toast.success('写真を削除しました');
  };

  const handleIDPhotoComplete = async (processedUrl: string) => {
    setPhotoProcessedUrl(processedUrl);
    setShowIDPhotoModal(false);

    // Update resume in database if exists
    if (resume) {
      const supabase = createClient();
      await supabase
        .from('resumes')
        .update({ photo_processed_url: processedUrl })
        .eq('id', resume.id);
    }

    toast.success('証明写真を保存しました');
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      const supabase = createClient();

      console.log('Saving basic info:', {
        fullName,
        fullNameKana,
        birthDate,
        gender,
        postalCode,
        address,
        phone,
        email,
      });

      // Update profile display_name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: fullName,
          phone: phone,
        })
        .eq('id', profile.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      console.log('Profile updated successfully');

      // Upsert resume (update if exists, insert if not)
      console.log('Upserting resume for user:', profile.id);
      const { data: upsertedResume, error: resumeError } = await supabase
        .from('resumes')
        .upsert({
          user_id: profile.id,
          full_name: fullName,
          full_name_kana: fullNameKana,
          birth_date: birthDate || null,
          gender: gender || null,
          postal_code: postalCode || null,
          address: address || null,
          phone: phone || null,
          email: email || null,
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (resumeError) {
        console.error('Resume upsert error:', resumeError);
        throw resumeError;
      }

      console.log('Resume upserted successfully:', upsertedResume);
      setResume(upsertedResume);

      toast.success('保存しました');

      // Reload data to ensure UI is in sync
      await fetchData();

      console.log('Data reloaded successfully');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-white flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-900">設定</h1>
          <p className="text-gray-600 mt-1">基本情報を編集</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b bg-white flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">設定</h1>
        <p className="text-gray-600 mt-1">基本情報を編集</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Photo Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                証明写真
              </CardTitle>
              <CardDescription>
                履歴書に使用する証明写真を設定してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                {/* Photo Preview */}
                <div className="relative w-[90px] h-[120px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                  {(photoProcessedUrl || photoUrl) ? (
                    <>
                      <Image
                        src={photoProcessedUrl || photoUrl || ''}
                        alt="証明写真"
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={handleRemovePhoto}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {photoProcessedUrl && (
                        <span className="absolute bottom-1 left-1 bg-green-500 text-white text-[8px] px-1 rounded">
                          AI加工済
                        </span>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-2">
                      <Camera className="h-8 w-8 mx-auto text-gray-400" />
                      <span className="text-xs text-gray-500 mt-1 block">30×40mm</span>
                    </div>
                  )}
                  {isUploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex-1 space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    写真をアップロード
                  </Button>

                  {photoUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowIDPhotoModal(true)}
                      className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      AIで証明写真を作成
                    </Button>
                  )}

                  <p className="text-xs text-gray-500">
                    JPEG、PNG形式（5MB以下）
                  </p>
                  <p className="text-xs text-blue-600">
                    AIが背景を水色に変更し、スーツを合成します
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                基本情報
              </CardTitle>
              <CardDescription>
                履歴書に使用される基本情報を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    氏名
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="山田 太郎"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    氏名（カナ）
                  </label>
                  <Input
                    value={fullNameKana}
                    onChange={(e) => setFullNameKana(e.target.value)}
                    placeholder="ヤマダ タロウ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    生年月日
                  </label>
                  <Input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    性別
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">選択してください</option>
                    <option value="male">男性</option>
                    <option value="female">女性</option>
                    <option value="other">その他</option>
                    <option value="prefer_not_to_say">回答しない</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                住所
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    郵便番号
                  </label>
                  <Input
                    value={postalCode}
                    onChange={(e) => handlePostalCodeChange(e.target.value)}
                    placeholder="123-4567"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    住所
                  </label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="東京都渋谷区..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                連絡先
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  電話番号
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="090-1234-5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  メールアドレス
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} isLoading={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              保存する
            </Button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              ここで入力した情報は、AIチャットで履歴書を作成する際に自動的に使用されます。
              履歴書作成ページで詳細な職歴やスキルを追加できます。
            </p>
          </div>
        </div>
      </div>

      {/* ID Photo Generator Modal */}
      {showIDPhotoModal && photoUrl && (
        <IDPhotoGenerator
          photoUrl={photoUrl}
          resumeId={resume?.id}
          onComplete={handleIDPhotoComplete}
          onClose={() => setShowIDPhotoModal(false)}
        />
      )}
    </div>
  );
}
