import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { sendCounselorApprovedEmail } from '@/lib/email';
import { logAction } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        const { action } = await req.json(); // 'approve' | 'reject'
        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action. Use "approve" or "reject".' }, { status: 400 });
        }

        await connectDB();
        const counselor = await User.findById(id);

        if (!counselor) {
            return NextResponse.json({ error: 'Counselor not found' }, { status: 404 });
        }

        if (counselor.role !== 'counselor') {
            return NextResponse.json({ error: 'User is not a counselor' }, { status: 400 });
        }

        if (action === 'approve') {
            counselor.approvalStatus = 'approved';
            await counselor.save();

            // Send approval email to counselor
            try {
                await sendCounselorApprovedEmail({
                    counselorName: counselor.name,
                    counselorEmail: counselor.email,
                });
            } catch (emailErr) {
                console.error('[EMAIL ERROR] Failed to send approval email:', emailErr);
            }

            await logAction({
                userId: (session.user as any).id || 'admin',
                userName: session.user?.name || 'Admin',
                action: 'APPROVE_COUNSELOR',
                resource: 'USER',
                details: `Approved counselor account for ${counselor.name} (${counselor.email})`,
            });

            return NextResponse.json({ message: `Counselor ${counselor.name} approved successfully. Approval email sent.` });
        } else {
            // Reject: delete the pending account
            await User.findByIdAndDelete(id);

            await logAction({
                userId: (session.user as any).id || 'admin',
                userName: session.user?.name || 'Admin',
                action: 'REJECT_COUNSELOR',
                resource: 'USER',
                details: `Rejected and removed counselor account for ${counselor.name} (${counselor.email})`,
            });

            return NextResponse.json({ message: `Counselor ${counselor.name} rejected and removed.` });
        }
    } catch (err: any) {
        console.error('[APPROVE COUNSELOR ERROR]:', err);
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
