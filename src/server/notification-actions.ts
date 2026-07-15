"use server"

import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

async function getUserIdOrThrow() {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  return session.user.id
}

export async function getNotifications() {
  try {
    const userId = await getUserIdOrThrow()

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    const unreadCount = await db.notification.count({
      where: { userId, read: false },
    })

    return { notifications, unreadCount }
  } catch (error: any) {
    console.error("Fetch notifications error:", error)
    return { error: error.message || "Failed to fetch notifications" }
  }
}

export async function markNotificationReadAction(notificationId: string) {
  try {
    const userId = await getUserIdOrThrow()

    // Validate ownership
    const notif = await db.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notif || notif.userId !== userId) {
      throw new Error("Unauthorized")
    }

    const updated = await db.notification.update({
      where: { id: notificationId },
      data: { read: true },
    })

    return { success: true, notification: updated }
  } catch (error: any) {
    console.error("Mark notification read error:", error)
    return { error: error.message || "Failed to update notification" }
  }
}

export async function markAllNotificationsReadAction() {
  try {
    const userId = await getUserIdOrThrow()

    await db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    })

    return { success: true }
  } catch (error: any) {
    console.error("Mark all notifications read error:", error)
    return { error: error.message || "Failed to update notifications" }
  }
}
