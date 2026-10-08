import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialisation de Resend (la clé est optionnelle pour le dev local)
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Tous les champs sont obligatoires." },
        { status: 400 }
      );
    }

    // Si on n'a pas de clé API (ex: dev local), on simule l'envoi
    if (!resend) {
      console.log('\\n--- NOUVEAU FEEDBACK (Mode Dev) ---');
      console.log(`De      : ${name} <${email}>`);
      console.log(`Message :\\n${message}\\n-----------------------------------\\n`);
      
      // On simule un petit délai réseau
      await new Promise(resolve => setTimeout(resolve, 800));
      return NextResponse.json({ success: true, mocked: true });
    }

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
            <p style="margin: 0 0 10px 0;"><strong>👤 Nom :</strong> ${name}</p>
            <p style="margin: 0;"><strong>✉️ Email :</strong> <a href="mailto:${email}">${email}</a></p>
          </div>
          <h3 style="color: #334155; margin-bottom: 10px;">Message du client :</h3>
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 15px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${message}</div>
          
          <p style="margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center;">
            Ce message a été envoyé automatiquement depuis la plateforme EasyLearn.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Erreur Resend :", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error("Erreur API Feedback :", err);
    return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 });
  }
}
