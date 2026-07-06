import { hashPassword } from "../utils/hash.js";
import { AppError } from "../utils/errors.js";
import { getCurrentUser } from "./auth.service.js";
import { createUser, listUsersByFamilyId } from "../database/queries/users.queries.js";
import { getFamilyMembers } from "../database/queries/families.queries.js";
import { prisma } from "../database/client.js";

export async function getFamilyDashboard(userId: string) {
  const user = await getCurrentUser(userId);
  if (!user.familyId) throw new AppError(404, "Family not found.");

  const [members, tasks, upcomingTasks] = await Promise.all([
    getFamilyMembers(user.familyId),
    prisma.todo.count({ where: { familyId: user.familyId } }),
    prisma.todo.count({ where: { familyId: user.familyId, done: false, dueDate: { not: null } } }),
  ]);

  return {
    family: user.family,
    members,
    stats: {
      members: members.length,
      tasks,
      schedules: upcomingTasks,
      upcoming: upcomingTasks,
    },
  };
}

export async function listFamilyMembers(userId: string) {
  const user = await getCurrentUser(userId);
  if (!user.familyId) throw new AppError(404, "Family not found.");
  return getFamilyMembers(user.familyId);
}

export async function listFamilySchedules(userId: string) {
  const user = await getCurrentUser(userId);
  if (!user.familyId) throw new AppError(404, "Family not found.");

  const schedules = await prisma.todo.findMany({
    where: { familyId: user.familyId, dueDate: { not: null }, status: { in: ["occupied", "unoccupied"] } },
    orderBy: { dueDate: "asc" },
    include: {
      user: { select: { id: true, username: true, role: true } },
      assignedToUser: { select: { id: true, username: true, role: true } },
    } as never,
  } as never);

  return schedules;
}

export async function createFamilyMember(
  userId: string,
  data: { username: string; email: string; password: string; role?: string },
) {
  const admin = await getCurrentUser(userId);
  if (admin.role !== "Admin") throw new AppError(403, "Only admins can add family members.");
  if (!admin.familyId) throw new AppError(404, "Family not found.");

  const password = await hashPassword(data.password);
  return createUser({
    username: data.username,
    email: data.email,
    password,
    role: data.role ?? "Member",
    familyId: admin.familyId,
    emailVerified: true,
  });
}

export async function listTenants() {
  const families = await prisma.family.findMany({
    include: {
      members: { select: { id: true, username: true, role: true, email: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return families.map((family) => {
    const admin = family.members.find((member) => member.role === "Admin") ?? family.members[0] ?? null;
    return {
      id: family.id,
      name: family.name,
      logoUrl: family.logoUrl,
      accentColor: family.accentColor,
      deletedAt: family.deletedAt,
      createdAt: family.createdAt,
      memberCount: family.members.length,
      adminUsername: admin?.username ?? "—",
      adminEmail: admin?.email ?? "—",
    };
  });
}
