import twilio from "twilio";
import { db } from "@/lib/db";

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!client) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
}

export async function sendWhatsApp(to: string, message: string): Promise<void> {
  if (!to) return;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!from || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn("[whatsapp] Twilio env vars not set — skipping");
    return;
  }
  try {
    await getClient().messages.create({
      from: `whatsapp:${from}`,
      to: `whatsapp:${to}`,
      body: message,
    });
  } catch (err) {
    console.error("[whatsapp] Failed to send to", to, err);
  }
}

export async function sendWhatsAppToUser(userId: string, message: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { phone: true, whatsappOptIn: true },
  });
  if (!user?.phone || !user.whatsappOptIn) return;
  await sendWhatsApp(user.phone, message);
}

export async function sendWhatsAppToStudentAndGuardians(studentId: string, message: string): Promise<void> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { userId: true, guardians: { select: { guardianId: true } } },
  });
  if (!student) return;

  const userIds = [
    ...(student.userId ? [student.userId] : []),
    ...student.guardians.map((g) => g.guardianId),
  ];

  await Promise.allSettled(userIds.map((uid) => sendWhatsAppToUser(uid, message)));
}

export async function sendWhatsAppToClassEnrollees(classId: string, message: string): Promise<void> {
  const enrollments = await db.enrollment.findMany({
    where: { classId, status: "ACTIVE" },
    select: {
      student: {
        select: {
          userId: true,
          guardians: { select: { guardianId: true } },
        },
      },
    },
  });

  const userIds = new Set<string>();
  for (const e of enrollments) {
    if (e.student.userId) userIds.add(e.student.userId);
    for (const g of e.student.guardians) userIds.add(g.guardianId);
  }

  await Promise.allSettled([...userIds].map((uid) => sendWhatsAppToUser(uid, message)));
}
