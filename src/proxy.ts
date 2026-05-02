import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;

        // Admin-only routes
        if (path.startsWith('/admin') && token?.role !== 'admin') {
            return NextResponse.redirect(new URL('/login?error=Unauthorized', req.url));
        }

        // Counselor-only routes
        if (path.startsWith('/counselor') && token?.role !== 'counselor' && token?.role !== 'admin') {
            return NextResponse.redirect(new URL('/login?error=Unauthorized', req.url));
        }

        // Student routes — allow students + admin
        if (path.startsWith('/student') && token?.role !== 'student' && token?.role !== 'admin') {
            return NextResponse.redirect(new URL('/login?error=Unauthorized', req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: ['/student/:path*', '/counselor/:path*', '/admin/:path*'],
};
