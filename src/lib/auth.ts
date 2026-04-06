import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from './mongodb';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'KU Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                const start = Date.now();
                console.log('[AUTH] Starting authorization for:', credentials?.email);

                if (!credentials?.email || !credentials?.password) return null;

                const dbStart = Date.now();
                await connectDB();
                console.log(`[AUTH] Database connection took: ${Date.now() - dbStart}ms`);

                const findStart = Date.now();
                const user = await User.findOne({ email: credentials.email });
                console.log(`[AUTH] User findOne took: ${Date.now() - findStart}ms`);

                if (!user) {
                    console.log('[AUTH] User not found');
                    return null;
                }

                const bcryptStart = Date.now();
                const isValid = await bcrypt.compare(credentials.password, user.password);
                console.log(`[AUTH] Bcrypt compare took: ${Date.now() - bcryptStart}ms`);

                if (!isValid) {
                    console.log('[AUTH] Invalid password');
                    return null;
                }

                console.log(`[AUTH] Total authorization took: ${Date.now() - start}ms`);

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    image: user.profileImage ?? null,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
            }
            return session;
        },
    },
    session: { strategy: 'jwt' },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
