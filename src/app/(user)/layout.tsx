import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Toaster } from '@/components/ui/toast';
import { UserLayoutClient } from '@/components/layout/user-layout-client';

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <>
      <UserLayoutClient>{children}</UserLayoutClient>
      <Toaster />
    </>
  );
}
