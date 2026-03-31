// components/Layout.tsx or directly in your route
export default function SumoDashboard() {
  return (
    <div class="min-h-screen bg- text-gray-100 flex">
      {/* Sidebar - Desktop Only */}
      <aside class="hidden md:flex flex-col w-64 bg-gray-400 border-r border-gray-600 p-6">
        <h1 class="text-2xl font-bold text-red-600 mb-8">SumoFantasy</h1>
        <nav class="space-y-4">
          <a href="#" class="block hover:text-red-800">
            Tournament Standings
          </a>
          <a href="#" class="block hover:text-red-800">My Stable</a>
          <a href="#" class="block hover:text-red-800">Wrestler Database</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main class="flex-1 p-4 md:p-8">
        {/* Header Ticker */}
        <div class="bg-red-600/40 border border-red-900 rounded-lg p-3 mb-6 flex justify-between items-center">
          <span class="font-bold">LIVE: Haru Basho Day 10</span>
          <span class="text-sm">Next Match: Terunofuji vs. Kirishima</span>
        </div>

        {/* Stats Grid */}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-gray-400 rounded-xl p-6 border border-gray-800">
            <h2 class="text-xl font-bold mb-4">Ranked Rikishi</h2>
            {/* Your SQLite data mapping would go here */}
            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead class="border-b border-gray-400 text-gray-40 text-sm">
                  <tr>
                    <th class="pb-2">Wrestler</th>
                    <th class="pb-2">Rank</th>
                    <th class="pb-2 text-right">Points</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b border-gray-400/50">
                    <td class="py-3">Hoshoryu</td>
                    <td>Ozeki</td>
                    <td class="text-right font-mono">142.5</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="bg-gray-400 rounded-xl p-6 border border-gray-800">
            <h2 class="text-xl font-bold mb-4">Your Points</h2>
            <div class="text-4xl font-bold text-red-600">1,240</div>
            <p class="text-gray-100 text-sm">Ranked #14 in Dublin, OH</p>
          </div>
        </div>
      </main>
    </div>
  );
}
