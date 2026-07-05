import { prisma } from "../database/client.js";
import { deleteFamilyById, listExpiredDeletedFamilies } from "../database/queries/families.queries.js";
import { deleteUsersByFamilyId } from "../database/queries/users.queries.js";

export async function purgeExpiredDeletedAccounts(now = new Date()) {
  const families = await listExpiredDeletedFamilies(now);

  let purgedFamilies = 0;
  let purgedUsers = 0;

  for (const family of families) {
    const familyUsers = await deleteUsersByFamilyId(family.id);
    purgedUsers += familyUsers.count;
    await deleteFamilyById(family.id);
    purgedFamilies += 1;
  }

  const standaloneUsers = await prisma.user.deleteMany({
    where: { deletedAt: { not: null }, purgeAt: { lte: now }, familyId: null },
  });
  purgedUsers += standaloneUsers.count;

  return { purgedFamilies, purgedUsers };
}

export function startCleanupScheduler() {
  const run = () => purgeExpiredDeletedAccounts().catch((err) => {
    console.error("Cleanup job failed:", err);
  });

  void run();
  return setInterval(run, 60 * 60 * 1000);
}
