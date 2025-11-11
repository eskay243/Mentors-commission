import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Layout from '@/components/Layout'
import { Save, RefreshCw, Globe, DollarSign, Users, Percent } from 'lucide-react'

export default async function AdminSettings() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/auth/signin')
  }

  // For now, we'll use default settings. In a real app, these would come from a settings table
  const defaultSettings = {
    platformName: 'EdTech Platform',
    currency: 'NGN',
    currencySymbol: '₦',
    mentorCommissionRate: 37.0,
    platformFeeRate: 3.0,
    defaultCourseDuration: 90,
    maxStudentsPerMentor: 10,
    emailNotifications: true,
    smsNotifications: false,
    maintenanceMode: false,
  }

  return (
    <Layout>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-600">Configure platform-wide settings and preferences</p>
        </div>

        <form className="space-y-8">
          {/* General Settings */}
          <div className="card">
            <div className="flex items-center mb-6">
              <Globe className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Platform Name</label>
                <input
                  type="text"
                  defaultValue={defaultSettings.platformName}
                  className="input"
                  placeholder="Enter platform name"
                />
              </div>
              
              <div>
                <label className="label">Currency</label>
                <select className="input" defaultValue={defaultSettings.currency}>
                  <option value="NGN">Nigerian Naira (₦)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="GBP">British Pound (£)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Financial Settings */}
          <div className="card">
            <div className="flex items-center mb-6">
              <DollarSign className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Financial Settings</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Mentor Commission Rate (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    defaultValue={defaultSettings.mentorCommissionRate}
                    className="input pr-8"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <Percent className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Default commission rate for mentors (currently {defaultSettings.mentorCommissionRate}%)
                </p>
              </div>
              
              <div>
                <label className="label">Platform Fee Rate (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    defaultValue={defaultSettings.platformFeeRate}
                    className="input pr-8"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <Percent className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Platform fee deducted from payments (currently {defaultSettings.platformFeeRate}%)
                </p>
              </div>
            </div>
          </div>

          {/* Course Settings */}
          <div className="card">
            <div className="flex items-center mb-6">
              <Users className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Course & Assignment Settings</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Default Course Duration (Days)</label>
                <input
                  type="number"
                  defaultValue={defaultSettings.defaultCourseDuration}
                  className="input"
                  min="1"
                  max="365"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Default duration for new courses
                </p>
              </div>
              
              <div>
                <label className="label">Max Students per Mentor</label>
                <input
                  type="number"
                  defaultValue={defaultSettings.maxStudentsPerMentor}
                  className="input"
                  min="1"
                  max="100"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Maximum number of students a mentor can handle
                </p>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="card">
            <div className="flex items-center mb-6">
              <RefreshCw className="h-6 w-6 text-orange-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                  <p className="text-sm text-gray-500">Send email notifications for important events</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={defaultSettings.emailNotifications}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">SMS Notifications</h3>
                  <p className="text-sm text-gray-500">Send SMS notifications for urgent events</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={defaultSettings.smsNotifications}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Maintenance Mode</h3>
                  <p className="text-sm text-gray-500">Put the platform in maintenance mode</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={defaultSettings.maintenanceMode}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Platform Version</label>
                <input
                  type="text"
                  value="1.0.0"
                  disabled
                  className="input bg-gray-50"
                />
              </div>
              
              <div>
                <label className="label">Database Status</label>
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Connected</span>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn btn-primary flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
