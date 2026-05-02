import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function DashboardRedirect({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const start = Date.now();
    const session = await getServerSession(authOptions);
    console.log(`[DASHBOARD-REDIRECT] getServerSession took: ${Date.now() - start}ms`);

    const params = await searchParams;
    const queryStr = params && params.loggedIn ? '?loggedIn=true' : '';

    if (!session) {
        console.log('[DASHBOARD-REDIRECT] Session is null, redirecting back to /login');
        redirect('/login');
    }

    const role = (session.user as any)?.role;
    console.log('[DASHBOARD-REDIRECT] Session found for role:', role);

    if (role === 'admin') {
        redirect('/admin/dashboard' + queryStr);
    } else if (role === 'counselor') {
        redirect('/counselor/dashboard' + queryStr);
    } else {
        redirect('/student/dashboard' + queryStr);
    }
}
