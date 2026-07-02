import { NextRequest, NextResponse } from 'next/server';
import { createRateLimiter } from '@/lib/rateLimit';

// 30 AI chat messages per IP per minute (protects Gemini API costs)
const chatLimiter = createRateLimiter({ limit: 30, windowMs: 60 * 1000 });

export async function POST(req: NextRequest) {
    const limited = chatLimiter(req);
    if (limited) return limited;

    try {
        const { messages } = await req.json();

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('[CHAT API] GEMINI_API_KEY is missing.');
            return NextResponse.json({ reply: "I'm sorry, my AI backend is not configured properly." });
        }

        // Format the conversation history for Gemini
        // We only take the last 10 messages to keep the payload reasonable
        const recentMessages = messages.slice(-15).filter((m: any) => m.type !== 'suggestion');
        
        const collapsedMessages: any[] = [];
        for (const msg of recentMessages) {
            const role = msg.sender === 'user' ? 'user' : 'model';
            const text = msg.text;
            if (collapsedMessages.length > 0 && collapsedMessages[collapsedMessages.length - 1].role === role) {
                collapsedMessages[collapsedMessages.length - 1].parts[0].text += '\n\n' + text;
            } else {
                collapsedMessages.push({ role, parts: [{ text }] });
            }
        }

        // Gemini API strictly requires the conversation history to start with a 'user' role and alternate
        if (collapsedMessages.length > 0 && collapsedMessages[0].role === 'model') {
            collapsedMessages.unshift({ role: 'user', parts: [{ text: 'Hi' }] });
        }

        const systemInstruction = {
            parts: [{
                text: "You are the Virtual KU Wellness System Assistant. Your role is to provide empathetic, supportive, and helpful responses to university students regarding mental health, career, and academic stress. You are warm, professional, and concise. Do NOT use markdown or complex formatting—keep it to plain text paragraphs. If the student explicitly wants to schedule or book a session, provide an empathetic response and append exactly the string `[ACTION:BOOK_SESSION]` at the very end of your message. This will trigger the booking UI for them."
            }]
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction,
                contents: collapsedMessages,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[CHAT API] Gemini API Error:', data);
            return NextResponse.json({ reply: "I'm having trouble connecting to my AI brain right now. Please try again later." });
        }

        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I didn't quite catch that.";
        
        // Remove markdown bolding formatting from Gemini's response for a cleaner chat look
        const cleanReply = replyText.replace(/\*\*/g, '').trim();

        return NextResponse.json({ reply: cleanReply });

    } catch (err) {
        console.error('[CHAT API]', err);
        return NextResponse.json({ reply: "An error occurred while processing your request." }, { status: 500 });
    }
}
