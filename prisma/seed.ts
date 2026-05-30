import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const PASSWORD = "Dev1234!";

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10);

  // Teacher
  const teacher = await db.user.upsert({
    where: { email: "teacher@classsync.dev" },
    update: { registrationComplete: true },
    create: {
      email: "teacher@classsync.dev",
      name: "Alice Teacher",
      passwordHash: hash,
      role: "TEACHER",
      registrationComplete: true,
    },
  });

  // Guardian
  const guardian = await db.user.upsert({
    where: { email: "guardian@classsync.dev" },
    update: { registrationComplete: true },
    create: {
      email: "guardian@classsync.dev",
      name: "Bob Guardian",
      passwordHash: hash,
      role: "GUARDIAN",
      registrationComplete: true,
    },
  });

  // Co-guardian — linked to Carol only
  const coGuardian = await db.user.upsert({
    where: { email: "coguardian@classsync.dev" },
    update: { registrationComplete: true },
    create: {
      email: "coguardian@classsync.dev",
      name: "Eve Co-Guardian",
      passwordHash: hash,
      role: "GUARDIAN",
      registrationComplete: true,
    },
  });

  // Student user (has claimed their account)
  const studentUser = await db.user.upsert({
    where: { email: "student@classsync.dev" },
    update: { registrationComplete: true },
    create: {
      email: "student@classsync.dev",
      name: "Carol Student",
      passwordHash: hash,
      role: "STUDENT",
      registrationComplete: true,
    },
  });

  // Independent student — no guardian links
  const independentUser = await db.user.upsert({
    where: { email: "indie@classsync.dev" },
    update: { registrationComplete: true },
    create: {
      email: "indie@classsync.dev",
      name: "Frank Independent",
      passwordHash: hash,
      role: "STUDENT",
      registrationComplete: true,
    },
  });

  // Carol — guardian-linked student who has claimed her account
  const carol = await db.student.upsert({
    where: { id: "seed-student-carol" },
    update: { userId: studentUser.id },
    create: {
      id: "seed-student-carol",
      name: "Carol Student",
      userId: studentUser.id,
    },
  });

  // Link Carol to both guardians
  await db.studentGuardian.upsert({
    where: { studentId_guardianId: { studentId: carol.id, guardianId: guardian.id } },
    update: {},
    create: { studentId: carol.id, guardianId: guardian.id },
  });

  await db.studentGuardian.upsert({
    where: { studentId_guardianId: { studentId: carol.id, guardianId: coGuardian.id } },
    update: {},
    create: { studentId: carol.id, guardianId: coGuardian.id },
  });

  // Dave — unclaimed child linked to guardian only
  const dave = await db.student.upsert({
    where: { id: "seed-student-dave" },
    update: {},
    create: {
      id: "seed-student-dave",
      name: "Dave Unclaimed",
    },
  });

  await db.studentGuardian.upsert({
    where: { studentId_guardianId: { studentId: dave.id, guardianId: guardian.id } },
    update: {},
    create: { studentId: dave.id, guardianId: guardian.id },
  });

  // Frank — independent student, no guardian
  const frank = await db.student.upsert({
    where: { userId: independentUser.id },
    update: {},
    create: {
      id: "seed-student-frank",
      name: "Frank Independent",
      userId: independentUser.id,
    },
  });

  // Classes
  const mathGroup = await db.class.upsert({
    where: { id: "seed-class-math" },
    update: {},
    create: {
      id: "seed-class-math",
      name: "Math Group",
      subject: "mathematics",
      type: "GROUP",
      dayOfWeek: 1,
      startTime: "16:00",
      duration: 60,
      maxCapacity: 4,
      teacherId: teacher.id,
      isOpen: true,
    },
  });

  const englishPrivate = await db.class.upsert({
    where: { id: "seed-class-english" },
    update: {},
    create: {
      id: "seed-class-english",
      name: "English Private",
      subject: "english",
      type: "PRIVATE",
      dayOfWeek: 3,
      startTime: "17:00",
      duration: 45,
      teacherId: teacher.id,
      isOpen: true,
    },
  });

  // Enrollments
  await db.enrollment.upsert({
    where: { studentId_classId: { studentId: carol.id, classId: mathGroup.id } },
    update: {},
    create: { studentId: carol.id, classId: mathGroup.id, status: "ACTIVE" },
  });

  await db.enrollment.upsert({
    where: { studentId_classId: { studentId: dave.id, classId: englishPrivate.id } },
    update: {},
    create: { studentId: dave.id, classId: englishPrivate.id, status: "ACTIVE" },
  });

  // Frank has a pending request to join Math Group
  await db.enrollment.upsert({
    where: { studentId_classId: { studentId: frank.id, classId: mathGroup.id } },
    update: {},
    create: { studentId: frank.id, classId: mathGroup.id, status: "PENDING" },
  });

  console.log("Seed complete — all passwords:", PASSWORD);
  console.log("  teacher@classsync.dev     — TEACHER");
  console.log("  guardian@classsync.dev    — GUARDIAN (2 children: Carol + Dave)");
  console.log("  coguardian@classsync.dev  — GUARDIAN (co-guardian of Carol)");
  console.log("  student@classsync.dev     — STUDENT  (Carol, guardian-linked)");
  console.log("  indie@classsync.dev       — STUDENT  (Frank, independent)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
