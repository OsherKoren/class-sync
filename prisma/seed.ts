import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const PASSWORD = "Dev1234!";

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10);

  // Teacher
  const teacher = await db.user.upsert({
    where: { email: "teacher@classsync.dev" },
    update: {},
    create: {
      email: "teacher@classsync.dev",
      name: "Alice Teacher",
      passwordHash: hash,
      role: "TEACHER",
    },
  });

  // Guardian
  const guardian = await db.user.upsert({
    where: { email: "guardian@classsync.dev" },
    update: {},
    create: {
      email: "guardian@classsync.dev",
      name: "Bob Guardian",
      passwordHash: hash,
      role: "GUARDIAN",
    },
  });

  // Student user (has claimed their account)
  const studentUser = await db.user.upsert({
    where: { email: "student@classsync.dev" },
    update: {},
    create: {
      email: "student@classsync.dev",
      name: "Carol Student",
      passwordHash: hash,
      role: "STUDENT",
    },
  });

  // Student profile linked to Bob (guardian) — Carol has claimed hers; Dave is unclaimed
  const carol = await db.student.upsert({
    where: { id: "seed-student-carol" },
    update: { userId: studentUser.id },
    create: {
      id: "seed-student-carol",
      name: "Carol Student",
      userId: studentUser.id,
      guardians: { create: { guardianId: guardian.id } },
    },
  });

  await db.student.upsert({
    where: { id: "seed-student-dave" },
    update: {},
    create: {
      id: "seed-student-dave",
      name: "Dave Unclaimed",
      guardians: { create: { guardianId: guardian.id } },
    },
  });

  // Classes
  const mathGroup = await db.class.upsert({
    where: { id: "seed-class-math" },
    update: {},
    create: {
      id: "seed-class-math",
      name: "Math Group",
      subject: "Mathematics",
      type: "GROUP",
      dayOfWeek: 1,
      startTime: "16:00",
      duration: 60,
      teacherId: teacher.id,
      isOpen: true,
    },
  });

  await db.class.upsert({
    where: { id: "seed-class-english" },
    update: {},
    create: {
      id: "seed-class-english",
      name: "English Private",
      subject: "English",
      type: "PRIVATE",
      dayOfWeek: 3,
      startTime: "17:00",
      duration: 45,
      teacherId: teacher.id,
      isOpen: false,
    },
  });

  // Carol is actively enrolled in Math Group
  await db.enrollment.upsert({
    where: { studentId_classId: { studentId: carol.id, classId: mathGroup.id } },
    update: {},
    create: { studentId: carol.id, classId: mathGroup.id, status: "ACTIVE" },
  });

  console.log("Seed complete — all passwords:", PASSWORD);
  console.log("  teacher@classsync.dev");
  console.log("  guardian@classsync.dev");
  console.log("  student@classsync.dev");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
