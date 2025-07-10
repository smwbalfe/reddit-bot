'use server'
import { Resend } from 'resend';
import WelcomeEmail from '@/src/lib/emails/welcome';
import { db } from '@/src/lib/db';
import { accounts } from '@/src/lib/db/schema';
import { eq } from 'drizzle-orm';
import env from '../env';

const resend = new Resend(env.RESEND_API_KEY);

type EmailData = {
    email: string;
    name: string;
    userId: string;
}

export async function sendWelcomeEmail(emailData: EmailData) {
    const { email, name, userId } = emailData;
    try {
        const [account] = await db.select()
            .from(accounts)
            .where(eq(accounts.userId, userId))
            .limit(1);

        if (!account) {
            return { success: false, error: 'Account not found' };
        }

        if (account.welcomeEmailSent) {
            console.log("Welcome email already sent to", email);
            return { success: true, data: null, alreadySent: true };
        }

        const fromEmail = env.RESEND_FROM

        if (!fromEmail) {
            return { success: false, error: 'Email not found' };
        }
        
        const data = await resend.emails.send({
            from: fromEmail,
            to: email,
            subject: 'Welcome to Our Platform',
            react: WelcomeEmail({ name })
        });
        
        await db.update(accounts)
            .set({ welcomeEmailSent: true })
            .where(eq(accounts.id, account.id));

        return { success: true, data };
    } catch (error) {
        console.error('Error sending email:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}