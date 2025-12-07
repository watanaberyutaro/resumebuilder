import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Toaster } from '@/components/ui/toast';
import { CompanyHeader } from '@/components/layout/company-header';

export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify user is a company
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'company') {
    redirect('/dashboard');
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <CompanyHeader />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
