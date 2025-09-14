import { auth } from '@clerk/nextjs/server'
import { UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    return null // This should be handled by middleware
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              UPI Payment Dashboard
            </h1>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Welcome to your Dashboard
              </h2>
              <p className="text-gray-600 mb-6">
                Your UPI payment system is ready to use.
              </p>
              <Button>Get Started</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}