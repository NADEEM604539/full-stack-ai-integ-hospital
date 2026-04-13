'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

/**
 * Pharmacist Dashboard
 * Shows:
 * - KPI cards (pending orders, approved, rejected, low stock alerts)
 * - Recent medicine orders
 * - Low stock medicines
 * - Expiring medicines
 * - Quick actions
 */
export default function PharmacistDashboardPage() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState({ lowStock: [], expiring: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const response = await fetch('/api/pharmacist/dashboard');
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard (${response.status})`);
      }
      const data = await response.json();
      setStats(data.data.stats);
      setAlerts(data.data.alerts);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading pharmacist dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Pharmacy Admin</h1>
        <p className="text-gray-600">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Pending Orders Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold uppercase">Pending Orders</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {stats?.pending_count || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Total: ${(Number(stats?.pending_total) || 0).toFixed(2)}
              </p>
            </div>
            <div className="text-yellow-500 text-4xl">📋</div>
          </div>
        </div>

        {/* Approved Orders Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold uppercase">Approved Today</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {stats?.accepted_count || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Worth: ${(Number(stats?.today_approved_total) || 0).toFixed(2)}
              </p>
            </div>
            <div className="text-green-500 text-4xl">✅</div>
          </div>
        </div>

        {/* Low Stock Alert Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold uppercase">Low Stock</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {stats?.low_stock_count || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Medicines need reordering</p>
            </div>
            <div className="text-red-500 text-4xl">⚠️</div>
          </div>
        </div>

        {/* Expiring Soon Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-semibold uppercase">Expiring Soon</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">
                {stats?.expiring_count || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Within 30 days</p>
            </div>
            <div className="text-orange-500 text-4xl">⏰</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Low Stock Medicines */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              Low Stock Medicines
            </h2>
            {alerts.lowStock && alerts.lowStock.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-2 px-2 font-semibold text-gray-700">Medicine</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-700">Current</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-700">Reorder Level</th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-700">Shortage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.lowStock.map((med) => (
                      <tr key={med.item_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-semibold text-gray-700">{med.item_name}</p>
                            <p className="text-xs text-gray-500">{med.sku}</p>
                          </div>
                        </td>
                        <td className="py-3 px-2 font-bold text-gray-700">
                          {med.quantity_in_stock}
                        </td>
                        <td className="py-3 px-2 text-gray-600">{med.reorder_level}</td>
                        <td className="py-3 px-2">
                          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                            {med.shortage}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-6">✅ All medicines are well stocked</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/pharmacist/medicines"
              className="block bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg transition-all text-center"
            >
              📋 Review Orders ({stats?.pending_count || 0})
            </Link>
            <Link
              href="/pharmacist/inventory"
              className="block bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg transition-all text-center"
            >
              💊 Manage Inventory
            </Link>
            <button
              onClick={fetchDashboardData}
              className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold py-3 px-4 rounded-lg hover:shadow-lg transition-all"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Expiring Medicines */}
      {alerts.expiring && alerts.expiring.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <span className="text-orange-500 mr-2">⏰</span>
            Medicines Expiring Within 30 Days
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.expiring.map((med) => (
              <div
                key={med.item_id}
                className="bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-orange-500 p-4 rounded-lg"
              >
                <p className="font-bold text-gray-800">{med.item_name}</p>
                <p className="text-xs text-gray-600 my-2">SKU: {med.sku}</p>
                <div className="grid grid-cols-2 gap-2 text-sm my-2">
                  <div>
                    <p className="text-gray-600">Expiry Date</p>
                    <p className="font-semibold text-gray-800">
                      {format(new Date(med.expiration_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Days Left</p>
                    <p className={`font-semibold ${
                      med.days_until_expiry <= 7 ? 'text-red-600' : 'text-orange-600'
                    }`}>
                      {med.days_until_expiry} days
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600">Stock: {med.quantity_in_stock} units</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}