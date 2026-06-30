import { db } from "../database/client.js";

export async function getDashboardStats(userId: string) {
  const [totalTasks, completedTasks, pendingTasks] = await Promise.all([
    db.todo.count({ where: { userId } }),
    db.todo.count({ where: { userId, done: true } }),
    db.todo.count({ where: { userId, done: false } }),
  ]);

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  return {
    tasks: totalTasks,
    members: 1,
    schedules: pendingTasks,
    upcoming: pendingTasks,
  };
}

export async function getRecentTasks(userId: string) {
  const tasks = await db.todo.findMany({
    where: { userId, done: true },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      updatedAt: true,
      done: true,
    },
  });

  return tasks.map((task) => ({
    EventName: task.title,
    EventDate: task.updatedAt.toISOString(),
    Status: "Done",
  }));
}

export async function getUpcomingTasks(userId: string) {
  const tasks = await db.todo.findMany({
    where: { userId, done: false },
    orderBy: { createdAt: "asc" },
    take: 5,
    select: {
      id: true,
      title: true,
      createdAt: true,
      user: {
        select: { name: true },
      },
    },
  });

  return tasks.map((task) => ({
    EventName: task.title,
    TaskDate: task.createdAt.toISOString().split("T")[0],
    TaskTime: task.createdAt.toISOString().split("T")[1].substring(0, 5),
    Username: task.user.name,
  }));
}
