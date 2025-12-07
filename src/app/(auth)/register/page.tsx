'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from '@/components/ui/toast';

type Step = 'account' | 'profile';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountType = searchParams.get('type') || 'user';

  const [step, setStep] = useState<Step>('account');

  // Account info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Profile info (for individual users)
  const [fullName, setFullName] = useState('');
  const [fullNameKana, setFullNameKana] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  // Company info
  const [companyName, setCompanyName] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('パスワードが一致しません');
      return;
    }

    if (password.length < 8) {
      toast.error('パスワードは8文字以上で入力してください');
      return;
    }

    if (accountType === 'company') {
      // Companies go directly to registration
      handleRegister();
    } else {
      // Users need to fill profile info
      setStep('profile');
    }
  };

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setIsLoading(true);

    try {
      const supabase = createClient();

      // Sign up with metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: accountType,
            full_name: accountType === 'user' ? fullName : undefined,
            full_name_kana: accountType === 'user' ? fullNameKana : undefined,
            birth_date: accountType === 'user' ? birthDate : undefined,
            postal_code: accountType === 'user' ? postalCode : undefined,
            address: accountType === 'user' ? address : undefined,
            phone: accountType === 'user' ? phone : undefined,
            company_name: accountType === 'company' ? companyName : undefined,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      // If user signed up successfully, update profile with additional info
      if (data.user && accountType === 'user') {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            display_name: fullName,
            phone: phone,
          })
          .eq('id', data.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }

        // Create initial resume with basic info
        const { error: resumeError } = await supabase
          .from('resumes')
          .insert({
            user_id: data.user.id,
            full_name: fullName,
            full_name_kana: fullNameKana,
            birth_date: birthDate,
            postal_code: postalCode,
            address: address,
            phone: phone,
            email: email,
          });

        if (resumeError) {
          console.error('Resume creation error:', resumeError);
        }
      }

      toast.success('登録が完了しました！');
      router.push('/dashboard');
    } catch {
      toast.error('登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch {
      toast.error('Googleログインに失敗しました');
    }
  };

  // Postal code auto-fill
  const handlePostalCodeChange = async (value: string) => {
    setPostalCode(value);

    // Format: 123-4567 or 1234567
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {accountType === 'company' ? '企業アカウント登録' : '新規登録'}
          </CardTitle>
          <CardDescription>
            {accountType === 'company'
              ? '候補者へスカウトを送信できます'
              : step === 'account'
                ? 'AIで履歴書を作成しましょう'
                : '基本情報を入力してください'}
          </CardDescription>
          {accountType === 'user' && (
            <div className="flex justify-center gap-2 mt-4">
              <div className={`w-3 h-3 rounded-full ${step === 'account' ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`w-3 h-3 rounded-full ${step === 'profile' ? 'bg-blue-600' : 'bg-gray-300'}`} />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {step === 'account' ? (
            <>
              <form onSubmit={handleNextStep} className="space-y-4">
                {accountType === 'company' && (
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                      会社名
                    </label>
                    <Input
                      id="companyName"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="株式会社〇〇"
                      required
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    パスワード
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8文字以上"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    パスワード（確認）
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="もう一度入力"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" isLoading={isLoading}>
                  {accountType === 'company' ? '登録' : '次へ'}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">または</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignUp}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Googleで登録
              </Button>
            </>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    氏名
                  </label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="山田 太郎"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="fullNameKana" className="block text-sm font-medium text-gray-700 mb-1">
                    氏名（カナ）
                  </label>
                  <Input
                    id="fullNameKana"
                    type="text"
                    value={fullNameKana}
                    onChange={(e) => setFullNameKana(e.target.value)}
                    placeholder="ヤマダ タロウ"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
                  生年月日
                </label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                    郵便番号
                  </label>
                  <Input
                    id="postalCode"
                    type="text"
                    value={postalCode}
                    onChange={(e) => handlePostalCodeChange(e.target.value)}
                    placeholder="123-4567"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    住所
                  </label>
                  <Input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="東京都渋谷区..."
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  電話番号
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="090-1234-5678"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('account')}
                >
                  戻る
                </Button>
                <Button type="submit" className="flex-1" isLoading={isLoading}>
                  登録完了
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Link
            href="/login"
            className="text-sm text-blue-600 hover:underline"
          >
            既にアカウントをお持ちの方はこちら
          </Link>
          {accountType === 'user' ? (
            <Link
              href="/register?type=company"
              className="text-sm text-gray-600 hover:underline"
            >
              企業アカウントの登録はこちら
            </Link>
          ) : (
            <Link
              href="/register"
              className="text-sm text-gray-600 hover:underline"
            >
              個人アカウントの登録はこちら
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
