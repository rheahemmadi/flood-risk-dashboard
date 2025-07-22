import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { generateMockAlerts } from '@/lib/utils';

export default function Home() {
  const mockAlerts = generateMockAlerts(10);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header currentPage="home" />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Flood Risk Dashboard
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real-time flood risk monitoring and visualization using data from GloFAS and Google Flood Hub for better decision making
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <Button variant="primary" size="lg">
              <a href="/map">View Live Map</a>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm font-semibold">H</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">High Risk Alerts</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {mockAlerts.filter(alert => alert.riskLevel === 'red').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-sm font-semibold">M</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Medium Risk Alerts</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {mockAlerts.filter(alert => alert.riskLevel === 'amber').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-semibold">L</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Low Risk Alerts</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {mockAlerts.filter(alert => alert.riskLevel === 'green').length}
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
