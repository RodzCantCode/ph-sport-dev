import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import React from "react";
import {
  Html,
  Body,
  Head,
  Heading,
  Container,
  Preview,
  Section,
  Text,
  Button,
  Hr,
  Img,
  Link,
  Font,
  Tailwind,
} from "@react-email/components";
import { render } from "@react-email/render";

// Environment Variables
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "noreply@phsport.app";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface NotificationPayload {
  id: string;
  user_id: string;
  type: string; // 'assignment' | 'comment' | 'deadline' | 'status_change'
  title: string;
  message: string | null;
  link: string | null;
  created_at: string;
}

interface NotificationPreferences {
  email: Record<string, boolean>;
  in_app: Record<string, boolean>;
}

// --- Components ---

const EmailLayout = ({
  preview,
  children,
}: {
  preview: string;
  children: React.ReactNode;
}) => (
  <Html>
    <Head>
      <Font
        fontFamily="Outfit"
        fallbackFontFamily="Arial"
        webFont={{
          url: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap",
          format: "woff2",
        }}
        fontWeight={400}
        fontStyle="normal"
      />
    </Head>
    <Preview>{preview}</Preview>
    <Tailwind
      config={{
        theme: {
          extend: {
            colors: {
              primary: "#FC4F00", // PH Sport Orange
              gray: {
                50: "#FAFAFA",
                100: "#F5F5F5",
                200: "#E5E5E5",
                500: "#737373",
                800: "#171717",
                900: "#0A0A0A",
              },
            },
          },
        },
      }}
    >
      <Body className="bg-gray-50 my-auto mx-auto font-sans">
        <Container className="border border-solid border-gray-200 rounded-[12px] my-[40px] mx-auto p-[28px] max-w-[520px] bg-white text-gray-800 shadow-sm">
          <Section className="mb-[20px]">
            <div className="h-[4px] w-full rounded-full bg-primary" />
          </Section>
          <Section className="mt-[4px] mb-[18px] text-center">
            <Img
              src="https://phsport.app/images/logo-full-orange.png"
              width="200"
              alt="PH Sport"
              className="mx-auto"
              style={{ height: "auto" }}
            />
          </Section>
          
          {children}

          <Hr className="border border-solid border-gray-200 my-[26px] mx-0 w-full" />
          
          <Text className="text-gray-500 text-[12px] leading-[20px] text-center">
            Estas recibiendo este correo porque tienes notificaciones activas en tu cuenta de PH Sport.
          </Text>
          <Text className="text-gray-500 text-[12px] leading-[20px] text-center">
            PH Sport, todos los derechos reservados.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

const AssignmentTemplate = ({ notification }: { notification: NotificationPayload }) => (
  <EmailLayout preview={`Nueva asignacion: ${notification.title}`}>
    <Section className="mt-[32px] text-center">
      <Heading className="text-[24px] font-semibold text-center p-0 my-[20px] mx-0">
        Nueva <strong>Asignacion</strong>
      </Heading>
      <Text className="text-[18px] font-semibold leading-[28px] text-gray-900 mt-2 mb-6">
        {notification.title}
      </Text>
      {notification.message && (
        <Text className="text-[14px] leading-[24px] text-gray-500 mb-8">
          {notification.message}
        </Text>
      )}
      <Section className="text-center mt-[32px] mb-[32px]">
        <Button
          className="bg-primary rounded text-white text-[13px] font-semibold no-underline text-center px-6 py-3"
          href={`https://phsport.app${notification.link || '/dashboard'}`}
        >
          Ver Asignacion
        </Button>
      </Section>
    </Section>
  </EmailLayout>
);

const CommentTemplate = ({ notification }: { notification: NotificationPayload }) => (
  <EmailLayout preview={`Nuevo comentario en: ${notification.title}`}>
    <Section className="mt-[32px]">
      <Heading className="text-[24px] font-semibold text-center p-0 my-[20px] mx-0">
        Nuevo <strong>Comentario</strong>
      </Heading>
      <Text className="text-[18px] font-semibold leading-[28px] text-gray-900 mt-2 mb-4 text-center">
        {notification.title}
      </Text>
      
      {/* Quote Component for Comment */}
      {notification.message && (
        <Section className="bg-gray-50 p-4 rounded-md border-l-4 border-primary my-6">
          <Text className="text-gray-500 text-[14px] italic m-0">
            "{notification.message}"
          </Text>
        </Section>
      )}

      <Section className="text-center mt-[32px] mb-[32px]">
        <Button
          className="bg-primary rounded text-white text-[13px] font-semibold no-underline text-center px-6 py-3"
          href={`https://phsport.app${notification.link || '/dashboard'}`}
        >
          Responder
        </Button>
      </Section>
    </Section>
  </EmailLayout>
);

const DeadlineTemplate = ({ notification }: { notification: NotificationPayload }) => (
  <EmailLayout preview={`Vence pronto: ${notification.title}`}>
    <Section className="mt-[32px] text-center">
      <Heading className="text-[24px] font-semibold text-center p-0 my-[20px] mx-0 text-[#b45309]">
        <strong>Fecha Limite Proxima</strong>
      </Heading>
      
      <Section className="bg-yellow-50 border border-yellow-200 rounded p-4 my-6">
        <Text className="text-[18px] font-bold text-gray-900 m-0">
          {notification.title}
        </Text>
        {notification.message && (
          <Text className="text-gray-600 text-[14px] mt-2 mb-0">
            {notification.message}
          </Text>
        )}
      </Section>

      <Section className="text-center mt-[32px] mb-[32px]">
        <Button
          className="bg-[#b45309] rounded text-white text-[13px] font-semibold no-underline text-center px-6 py-3"
          href={`https://phsport.app${notification.link || '/dashboard'}`}
        >
          Ver Detalles
        </Button>
      </Section>
    </Section>
  </EmailLayout>
);

const DefaultTemplate = ({ notification }: { notification: NotificationPayload }) => (
  <EmailLayout preview={`Notificacion: ${notification.title}`}>
    <Section className="mt-[32px] text-center">
      <Heading className="text-[24px] font-semibold text-center p-0 my-[20px] mx-0">
        Nueva <strong>Notificacion</strong>
      </Heading>
      <Text className="text-[14px] leading-[24px] text-gray-800">
        {notification.title}
      </Text>
      {notification.message && (
        <Text className="text-gray-500 text-[14px]">
          {notification.message}
        </Text>
      )}
      <Section className="text-center mt-[32px] mb-[32px]">
      <Button
          className="bg-primary rounded text-white text-[13px] font-semibold no-underline text-center px-6 py-3"
          href={`https://phsport.app${notification.link || '/dashboard'}`}
        >
          Ir al Dashboard
        </Button>
      </Section>
    </Section>
  </EmailLayout>
);

// --- Main Handler ---

Deno.serve(async (req: Request) => {
  try {
    const notification: NotificationPayload = await req.json();
    console.log("Received notification:", notification);

    if (!RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY");
      return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY" }), { status: 500 });
    }

    // Initialize Supabase Client (Service Role for Admin Access)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Get User Email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(notification.user_id);
    if (userError || !userData?.user?.email) {
      console.error("Error getting user email:", userError);
      return new Response(JSON.stringify({ error: "User or Email not found" }), { status: 404 });
    }
    const userEmail = userData.user.email;

    // 2. Get User Preferences
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("notification_preferences")
      .eq("id", notification.user_id)
      .single();

    if (profileError) {
      console.error("Error getting preferences:", profileError);
      // Fallback to sending if profile fetch fails? Better safe than noisy: abort.
      return new Response(JSON.stringify({ error: "Profile/Preferences not found" }), { status: 404 });
    }

    // Defaults for notification preferences
    const defaultEmailPrefs: Record<string, boolean> = {
      assignment: true,
      comment: true,
      deadline: true,
      status_change: true,
    };

    const preferences: NotificationPreferences = profile.notification_preferences || {
      email: { ...defaultEmailPrefs },
      in_app: { assignment: true, comment: true, deadline: true, status_change: true },
    };

    // Ensure email preferences object exists and merge with defaults
    if (!preferences.email) {
      preferences.email = { ...defaultEmailPrefs };
    }

    // 3. Check Logic: Is email enabled for this type?
    const type = notification.type;
    // Fallback to true if key doesn't exist (backwards compatible)
    const isEnabled = preferences.email[type] ?? defaultEmailPrefs[type] ?? true;

    if (!isEnabled) {
      console.log(`Email skipped: User disabled emails for type '${type}'`);
      return new Response(JSON.stringify({ skipped: true, reason: "User preference" }), { status: 200 });
    }

    // 4. Select Template & Render HTML
    let emailHtml = "";
    let subject = "";

    switch (type) {
      case "assignment":
        subject = `Nueva asignacion: ${notification.title}`;
        emailHtml = await render(<AssignmentTemplate notification={notification} />);
        break;
      case "comment":
        subject = `Nuevo comentario en: ${notification.title}`;
        emailHtml = await render(<CommentTemplate notification={notification} />);
        break;
      case "deadline":
        subject = `Vence pronto: ${notification.title}`;
        emailHtml = await render(<DeadlineTemplate notification={notification} />);
        break;
      default:
        subject = `Notificacion: ${notification.title}`;
        emailHtml = await render(<DefaultTemplate notification={notification} />);
    }
    subject = subject.replace(/[\r\n]+/g, " ").trim();

    // 5. Send via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [userEmail],
        subject: subject,
        html: emailHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API Error:", resendData);
      return new Response(JSON.stringify({ error: resendData }), { status: 400 });
    }

    console.log("Email sent successfully:", resendData);
    return new Response(JSON.stringify({ success: true, id: resendData.id }), { status: 200 });

  } catch (error) {
    console.error("Edge Function Exception:", error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
});
