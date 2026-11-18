import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

const feedbackSchema = z.object({
  name: z.string().trim().min(1).max(100).regex(/^[^\r\n]+$/),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(1).max(5000),
}).strict();

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données de feedback invalides." },
        { status: 400 }
      );
    }
    const { name, email, message } = parsed.data;

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: "L'envoi du feedback est indisponible." }, { status: 503 });
      }

      console.log('\\n--- NOUVEAU FEEDBACK (Mode Dev) ---');
      console.log(`De      : ${name} <${email}>`);
      console.log(`Message :\\n${message}\\n-----------------------------------\\n`);
      
      // On simule un petit délai réseau
      await new Promise(resolve => setTimeout(resolve, 800));
      return NextResponse.json({ success: true, mocked: true });
    }

    const resend = new Resend(resendApiKey);
    // Envoi réel avec Resend
    // Remarque : avec un compte gratuit, on utilise 'onboarding@resend.dev' comme expéditeur
    // L'email de destination doit être l'email associé au compte Resend.
    const { data, error } = await resend.emails.send({
      from: 'Feedback EasyLearn <onboarding@resend.dev>',
      to: 'edukits5@gmail.com',
      replyTo: email, // Permet de faire "Répondre" directement au client depuis la boîte mail
      subject: `Nouveau Feedback EasyLearn de ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #4f46e5; margin-top: 0;">Nouveau Feedback - EasyLearn</h2>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px 0;"><strong>Nom :</strong> ${escapeHtml(name)}</p>
            <p style="margin: 0;"><strong>Email :</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
          </div>
          <h3 style="color: #334155; margin-bottom: 10px;">Message du client :</h3>
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 15px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${escapeHtml(message)}</div>
          
          <p style="margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center;">
            Ce message a été envoyé automatiquement depuis la plateforme EasyLearn.
          </p>
        </div>
      `,
      text: `Nouveau feedback EasyLearn\nNom : ${name}\nEmail : ${email}\n\nMessage :\n${message}`,
    });

    if (error) {
      console.error("Erreur Resend :", error);
      return NextResponse.json({ error: "Impossible d'envoyer le feedback." }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error("Erreur API Feedback :", err);
    return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 });
  }
}
