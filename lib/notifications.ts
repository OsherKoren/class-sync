import { sendPushToUser, sendPushToStudentAndGuardians, sendPushToClassEnrollees } from "@/lib/push";
import {
  sendWhatsAppToUser,
  sendWhatsAppToStudentAndGuardians,
  sendWhatsAppToClassEnrollees,
} from "@/lib/whatsapp";

export async function notifyUser(
  userId: string,
  push: { title: string; body: string },
  whatsapp: string
): Promise<void> {
  await Promise.allSettled([
    sendPushToUser(userId, push),
    sendWhatsAppToUser(userId, whatsapp),
  ]);
}

export async function notifyStudentAndGuardians(
  studentId: string,
  push: { title: string; body: string },
  whatsapp: string
): Promise<void> {
  await Promise.allSettled([
    sendPushToStudentAndGuardians(studentId, push),
    sendWhatsAppToStudentAndGuardians(studentId, whatsapp),
  ]);
}

export async function notifyClassEnrollees(
  classId: string,
  push: { title: string; body: string },
  whatsapp: string
): Promise<void> {
  await Promise.allSettled([
    sendPushToClassEnrollees(classId, push),
    sendWhatsAppToClassEnrollees(classId, whatsapp),
  ]);
}
