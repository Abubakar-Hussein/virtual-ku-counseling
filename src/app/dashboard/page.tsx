import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function DashboardRedirect() {
    const start = Date.now();
    const session = await getServerSession(authOptions);
    console.log(`[DASHBOARD-REDIRECT] getServerSession took: ${Date.now() - start}ms`);

    if (!session) {
        redirect('/login');
    }

    const role = (session.user as any).role;

    if (role === 'admin') {
        redirect('/admin/dashboard');
    } else if (role === 'counselor') {
        redirect('/counselor/dashboard');
    } else {
        redirect('/student/dashboard');
    }
}
