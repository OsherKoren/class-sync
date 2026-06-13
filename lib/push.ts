import webpush from "web-push";
import { db } from "@/lib/db";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushToUser(userId: string, payload: { title: string; body: string }) {
  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err: unknown) {
        if ((err as { statusCode?: number }).statusCode === 410) {
          await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => null);
        } else {
          console.error("[push] Failed to send to", sub.endpoint, err);
        }
      }
    })
  );
}

export async function sendPushToStudentAndGuardians(
  studentId: string,
  payload: { title: string; body: string }
) {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { userId: true, guardians: { select: { guardianId: true } } },
  });

  if (!student) return;

  const userIds = [
    ...(student.userId ? [student.userId] : []),
    ...student.guardians.map((g) => g.guardianId),
  ];

  await Promise.allSettled(userIds.map((uid) => sendPushToUser(uid, payload)));
}

export async function sendPushToClassEnrollees(
  classId: string,
  payload: { title: string; body: string }
) {
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

  await Promise.allSettled([...userIds].map((uid) => sendPushToUser(uid, payload)));
}
