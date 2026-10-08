import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/api-utils';
import { cookies } from 'next/headers';

const chatRateLimit = new Map<string, { count: number; timestamp: number }>();

const SYSTEM_INSTRUCTION = `Tu es EasyBot, l'assistant IA officiel de la plateforme éducative EasyLearn.
Ton rôle est d'aider les utilisateurs (des enfants, adolescents ou adultes) à apprendre, comprendre des concepts complexes, et naviguer sur la plateforme.
Sois toujours bienveillant, pédagogique, clair et encourageant. Utilise un vocabulaire adapté et n'hésite pas à utiliser des analogies simples ou des emojis pour rendre l'apprentissage amusant.
Si on te pose une question hors du cadre éducatif ou de la plateforme, réponds poliment que tu es là pour l'apprentissage. Formate toujours tes réponses de manière aérée et lisible.
Tu ne dois JAMAIS générer de contenu violent, sexuel, discriminatoire, ou inapproprié pour des enfants.`;

/**
 * Sanitize user message to prevent prompt injection in the chat context.
 */
function sanitizeMessage(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\[ignoring loop detection\]/gi, '')
    .replace(/<\/?script[^>]*>/gi, '')
    .slice(0, 2000); // Cap message length
}

export async function POST(req: Request) {
  try {
    const authContext = await getAuthContext();
    const userId = authContext?.userId;

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = userId ? `user_${userId}` : `ip_${ip}`;
    
    const now = Date.now();
    const windowMs = 10 * 60 * 1000; // 10 minutes
    const limit = userId ? 30 : 10;
    
    const rlData = chatRateLimit.get(rateLimitKey);
    if (rlData && now - rlData.timestamp < windowMs) {
      if (rlData.count >= limit) {
        return NextResponse.json(
          { error: 'Tu as envoyé trop de messages. Attends un peu avant de réessayer.' },
          { status: 429 }
        );
      }
      rlData.count++;
    } else {
      chatRateLimit.set(rateLimitKey, { count: 1, timestamp: now });
    }

    const { messages, userContext } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('[Chat] DEEPSEEK_API_KEY is not configured');
      return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    // Format messages for DeepSeek (OpenAI-compatible)
    const formattedMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'ai' || msg.role === 'model' ? 'assistant' : 'user',
      content: sanitizeMessage(msg.content),
    }));

    let dynamicSystemInstruction = SYSTEM_INSTRUCTION;
    if (userContext && userContext.profile) {
      const { display_name, age, interests } = userContext.profile;
      dynamicSystemInstruction += `\n\nContexte de l'utilisateur actuel:
- Prénom/Pseudo : ${sanitizeMessage(display_name || 'Inconnu')}
- Âge : ${typeof age === 'number' ? age : 'Inconnu'} ans
- Centres d'intérêt : ${Array.isArray(interests) ? interests.slice(0, 10).join(', ') : 'Non spécifiés'}
Adapte ton discours à cet âge et ces centres d'intérêt si pertinent.`;
    }

    const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

    // Add timeout via AbortController
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s for chat

    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: dynamicSystemInstruction,
            },
            ...formattedMessages,
          ],
          temperature: 0.7,
          max_tokens: 1500, // Chat responses don't need to be huge
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Chat] DeepSeek API Error:', response.status, errorText);

        if (response.status === 429) {
          return NextResponse.json(
            { error: 'Le service est temporairement surchargé. Réessaie dans quelques instants.' },
            { status: 429 }
          );
        }

        return NextResponse.json({ error: 'Échec de la génération de réponse.' }, { status: 500 });
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || 'Désolé, je n\'ai pas pu formuler de réponse.';

      return NextResponse.json({ reply });
    } catch (fetchError: unknown) {
      clearTimeout(timeout);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Le temps de réponse a été dépassé. Réessaie.' },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('[Chat] API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
