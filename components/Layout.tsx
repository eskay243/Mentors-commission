'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import {
  GraduationCap,
  Users,
  BookOpen,
  DollarSign,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  BarChart3,
  FileText,
  TrendingUp,
  TrendingDown,
  Tag,
  UserCheck,
  UserPlus,
  Receipt
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const navigationItems = {
  ADMIN: [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Course Catalog', href: '/admin/courses', icon: BookOpen },
    { name: 'Student Enrollments', href: '/admin/enrollments', icon: GraduationCap },
    { name: 'Mentor Assignments', href: '/admin/assignments', icon: UserCheck },
    { name: 'Discounts', href: '/admin/discounts', icon: Tag },
    { name: 'Payments', href: '/admin/payments', icon: DollarSign },
    { name: 'Import', href: '/admin/import', icon: TrendingUp },
    { name: 'Reports', href: '/admin/reports', icon: FileText },
    { name: 'Expenses', href: '/admin/expenses', icon: TrendingDown },
    { name: 'Messages', href: '/admin/messages', icon: MessageSquare },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ],
  MENTOR: [
    { name: 'Dashboard', href: '/mentor/dashboard', icon: BarChart3 },
    { name: 'My Students', href: '/mentor/students', icon: Users },
    { name: 'Payments', href: '/mentor/payments', icon: DollarSign },
    { name: 'Receipts', href: '/mentor/receipts', icon: Receipt },
    { name: 'Messages', href: '/mentor/messages', icon: MessageSquare },
    { name: 'Profile', href: '/mentor/profile', icon: User },
  ],
  STUDENT: [
    { name: 'Dashboard', href: '/student/dashboard', icon: BarChart3 },
    { name: 'My Mentor', href: '/student/mentor', icon: User },
    { name: 'Payments', href: '/student/payments', icon: DollarSign },
    { name: 'Receipts', href: '/student/receipts', icon: Receipt },
    { name: 'Messages', href: '/student/messages', icon: MessageSquare },
    { name: 'Profile', href: '/student/profile', icon: User },
  ],
}

export default function Layout({ children }: LayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Show loading state while session is being fetched
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to sign in if no session
  if (status === 'unauthenticated' || !session) {
    router.push('/auth/signin')
    return null
  }

  const userRole = session.user.role as keyof typeof navigationItems
  const navigation = navigationItems[userRole] || []

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">EdTech Platform</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <item.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <GraduationCap className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">EdTech Platform</span>
          </div>
          <nav className="mt-8 flex-1 space-y-1 px-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <item.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <div className="ml-3">
                      <span className="text-sm text-gray-500">
                        Welcome back, {session.user.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700 capitalize">
                    {session.user.role.toLowerCase()}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
