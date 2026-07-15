"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import {
  getNotifications,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/server/notification-actions"

interface NotificationItem {
  id: string
  message: string
  read: boolean
  createdAt: Date
}

export default function Header() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const loadNotifications = async () => {
    if (status !== "authenticated") return
    const res = await getNotifications()
    if (res.notifications) {
      setNotifications(res.notifications as any)
      setUnreadCount(res.unreadCount || 0)
    }
  }

  // Poll notifications every 30 seconds for live updates
  useEffect(() => {
    if (status === "authenticated") {
      loadNotifications()
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [status])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleMarkAllRead = async () => {
    await markAllNotificationsReadAction()
    loadNotifications()
  }

  const handleNotificationClick = async (notifId: string) => {
    await markNotificationReadAction(notifId)
    loadNotifications()
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  const getLinkClass = (href: string) => {
    const isActive = pathname === href
    return isActive
      ? "text-sm font-semibold text-forest cursor-pointer"
      : "text-sm text-forest-soft hover:text-forest cursor-pointer transition-colors"
  }

  return (
    <nav className="border-b border-line bg-sage">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center space-x-1">
              <span className="font-serif text-2xl font-bold tracking-tight text-forest">
                resum<span className="text-moss italic">o</span>
              </span>
            </Link>

            {/* Navigation links based on role */}
            {status === "authenticated" && (
              <div className="hidden md:flex items-center space-x-6">
                {session?.user?.role === "CANDIDATE" ? (
                  <>
                    <Link
                      href="/dashboard/candidate"
                      className={getLinkClass("/dashboard/candidate")}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/jobs"
                      className={getLinkClass("/jobs")}
                    >
                      Find jobs
                    </Link>
                    <Link
                      href="/dashboard/candidate/applications"
                      className={getLinkClass("/dashboard/candidate/applications")}
                    >
                      My Applications
                    </Link>
                  </>
                ) : session?.user?.role === "RECRUITER" ? (
                  <>
                    <Link
                      href="/dashboard/recruiter"
                      className={getLinkClass("/dashboard/recruiter")}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/recruiter/jobs"
                      className={getLinkClass("/dashboard/recruiter/jobs")}
                    >
                      Manage Jobs
                    </Link>
                    <Link
                      href="/dashboard/recruiter/company"
                      className={getLinkClass("/dashboard/recruiter/company")}
                    >
                      Company Settings
                    </Link>
                  </>
                ) : null}
              </div>
            )}
          </div>

          {/* Right menu tools */}
          <div className="flex items-center gap-4">
            {status === "authenticated" ? (
              <>
                {/* Notification Dropdown Bell */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(!isOpen)
                      if (!isOpen) loadNotifications()
                    }}
                    className="relative p-2 text-forest-soft hover:text-forest focus:outline-none hover:bg-sage-2 rounded-full border border-line transition-colors"
                  >
                    <span className="sr-only">Notifications</span>
                    {/* Bell Icon */}
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
                      />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-bold leading-none text-white bg-coral rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {isOpen && (
                    <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-line bg-sage-2 p-4 shadow-none focus:outline-none z-55">
                      <div className="flex items-center justify-between pb-2 border-b border-line">
                        <span className="text-xs font-semibold text-forest">Recent Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] font-bold text-moss-dark hover:text-moss focus:outline-none"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="mt-2 max-h-60 overflow-y-auto space-y-2">
                        {notifications.length === 0 ? (
                          <p className="text-center py-6 text-xs text-forest-soft font-sans">
                            No notifications yet
                          </p>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleNotificationClick(n.id)}
                              className={`p-2.5 rounded-[10px] border transition-colors cursor-pointer ${
                                !n.read
                                  ? "bg-sage border-line text-forest"
                                  : "bg-sage-2 border-transparent text-forest-soft"
                              }`}
                            >
                              <div className="font-semibold">{n.message}</div>
                              <span className="text-[10px] text-forest-soft mt-1 block">
                                {new Date(n.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Name & Signout */}
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-forest">
                    {session?.user?.name || "User"}
                  </span>
                  <span className="text-[10px] font-semibold text-forest-soft uppercase tracking-wider">
                    {session?.user?.role}
                  </span>
                </div>

                <button
                  onClick={handleSignOut}
                  className="px-4 py-1.5 text-xs font-medium border border-forest hover:bg-sage-2 text-forest rounded-full transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-1.5 text-xs font-medium border border-forest hover:bg-sage-2 text-forest rounded-full transition-colors text-center"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-2 text-xs font-medium text-white bg-moss border border-moss hover:bg-moss-dark rounded-full transition-colors text-center"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
