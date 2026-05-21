import { auth } from '@/auth';
import { redirect } from 'next/navigation';

// Full-screen layout — no admin sidebar so the designer has maximum canvas space
export default async function DesignerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen" style={{ background: '#F0F5FF' }}>
      {children}
    </div>
  );
}
