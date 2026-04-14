'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Loader2, AlertCircle } from 'lucide-react';

const SummaryPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: ''
  });

  useEffect(() => {
    fetchSummary();
  }, []);

  const convertToNumbers = (obj) => {
    const numericFields = [
      'total_revenue', 'total_paid', 'total_outstanding', 'total_invoices',
      'paid_invoices', 'unpaid_invoices', 'partial_invoices', 'overdue_count', 'overdue_amount'
    ];
    const converted = { ...obj };
    numericFields.forEach(field => {
      if (field in converted) {
        converted[field] = Number(converted[field] || 0);
      }
    });
    return converted;
  };

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`/api/finance/summary?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setSummary(convertToNumbers(data.data));
      } else {
        setError(data.error || 'Failed to fetch summary');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    fetchSummary();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 size={40} style={{ color: '#10B981' }} className="animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold" style={{ color: '#065F46' }}>
          📊 Financial Summary & Reports
        </h1>
        <div
          style={{ backgroundColor: '#FEE2E2', borderLeft: '4px solid #EF4444' }}
          className="p-4 rounded"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={20} style={{ color: '#DC2626' }} />
            <p style={{ color: '#DC2626' }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = summary || {};

  // Calculate percentages
  const paidPercentage = stats.total_revenue
    ? ((stats.total_paid / stats.total_revenue) * 100).toFixed(1)
    : 0;
  const outstandingPercentage = stats.total_revenue
    ? ((stats.total_outstanding / stats.total_revenue) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: '#065F46' }}>
          📊 Financial Summary & Reports
        </h1>
        <p style={{ color: '#10B981' }} className="mt-2">
          Comprehensive financial analysis and reporting
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px'
        }}
        className="p-6"
      >
        <h2 style={{ color: '#065F46' }} className="font-bold text-lg mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label style={{ color: '#6B7280' }} className="block text-sm font-medium mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              style={{ borderColor: '#E5E7EB' }}
            />
          </div>
          <div>
            <label style={{ color: '#6B7280' }} className="block text-sm font-medium mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              style={{ borderColor: '#E5E7EB' }}
            />
          </div>
          <div>
            <label style={{ color: '#6B7280' }} className="block text-sm font-medium mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              style={{ borderColor: '#E5E7EB' }}
            >
              <option value="">All</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial">Partial</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleApplyFilters}
              className="w-full px-4 py-2 rounded-lg font-medium text-white"
              style={{ backgroundColor: '#10B981' }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '2px solid #10B981',
            borderRadius: '12px'
          }}
          className="p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: '#065F46' }} className="font-bold text-lg">Total Revenue</h3>
            <TrendingUp size={32} style={{ color: '#10B981' }} />
          </div>
          <p style={{ color: '#10B981' }} className="text-4xl font-bold">
            ${(stats.total_revenue || 0).toFixed(2)}
          </p>
          <p style={{ color: '#6B7280' }} className="text-sm mt-2">
            From all invoices
          </p>
        </div>

        {/* Total Paid */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '2px solid #059669',
            borderRadius: '12px'
          }}
          className="p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: '#065F46' }} className="font-bold text-lg">Total Paid</h3>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#D1FAE5' }}>
              ✓
            </div>
          </div>
          <p style={{ color: '#059669' }} className="text-4xl font-bold">
            ${(stats.total_paid || 0).toFixed(2)}
          </p>
          <p style={{ color: '#6B7280' }} className="text-sm mt-2">
            {paidPercentage}% of total revenue
          </p>
        </div>

        {/* Outstanding Balance */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '2px solid #F59E0B',
            borderRadius: '12px'
          }}
          className="p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: '#065F46' }} className="font-bold text-lg">Outstanding</h3>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
              ◐
            </div>
          </div>
          <p style={{ color: '#F59E0B' }} className="text-4xl font-bold">
            ${(stats.total_outstanding || 0).toFixed(2)}
          </p>
          <p style={{ color: '#6B7280' }} className="text-sm mt-2">
            {outstandingPercentage}% pending payment
          </p>
        </div>
      </div>

      {/* Invoice Breakdown */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px'
        }}
        className="p-6"
      >
        <h2 style={{ color: '#065F46' }} className="font-bold text-lg mb-6">Invoice Breakdown</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Total Invoices */}
          <div style={{ backgroundColor: '#F9FAFB', borderRadius: '8px' }} className="p-4 text-center">
            <p style={{ color: '#6B7280' }} className="text-sm font-medium">Total Invoices</p>
            <p style={{ color: '#065F46' }} className="text-3xl font-bold mt-2">{stats.total_invoices || 0}</p>
          </div>

          {/* Paid Invoices */}
          <div style={{ backgroundColor: '#D1FAE5', borderRadius: '8px' }} className="p-4 text-center">
            <p style={{ color: '#059669' }} className="text-sm font-medium">Paid</p>
            <p style={{ color: '#065F46' }} className="text-3xl font-bold mt-2">{stats.paid_invoices || 0}</p>
          </div>

          {/* Unpaid Invoices */}
          <div style={{ backgroundColor: '#FEE2E2', borderRadius: '8px' }} className="p-4 text-center">
            <p style={{ color: '#DC2626' }} className="text-sm font-medium">Unpaid</p>
            <p style={{ color: '#991B1B' }} className="text-3xl font-bold mt-2">{stats.unpaid_invoices || 0}</p>
          </div>

          {/* Partial Invoices */}
          <div style={{ backgroundColor: '#FEF3C7', borderRadius: '8px' }} className="p-4 text-center">
            <p style={{ color: '#D97706' }} className="text-sm font-medium">Partial</p>
            <p style={{ color: '#92400E' }} className="text-3xl font-bold mt-2">{stats.partial_invoices || 0}</p>
          </div>

          {/* Overdue Invoices */}
          <div style={{ backgroundColor: '#FBCCCC', borderRadius: '8px' }} className="p-4 text-center">
            <p style={{ color: '#991B1B' }} className="text-sm font-medium">Overdue</p>
            <p style={{ color: '#7F1D1D' }} className="text-3xl font-bold mt-2">{stats.overdue_count || 0}</p>
          </div>
        </div>
      </div>

      {/* Overdue Summary */}
      {stats.overdue_count > 0 && (
        <div
          style={{
            backgroundColor: '#FEE2E2',
            borderLeft: '4px solid #EF4444',
            borderRadius: '8px'
          }}
          className="p-6"
        >
          <h2 style={{ color: '#991B1B' }} className="font-bold text-lg mb-2">⚠️ Overdue Invoices</h2>
          <p style={{ color: '#DC2626' }} className="text-2xl font-bold">
            {stats.overdue_count} invoice{stats.overdue_count !== 1 ? 's' : ''} overdue
          </p>
          <p style={{ color: '#7F1D1D' }} className="mt-2">
            Total overdue amount: <span className="font-bold">${(stats.overdue_amount || 0).toFixed(2)}</span>
          </p>
        </div>
      )}

      {/* Financial Health */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px'
        }}
        className="p-6"
      >
        <h2 style={{ color: '#065F46' }} className="font-bold text-lg mb-6">Financial Health Metrics</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Collection Rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p style={{ color: '#6B7280' }} className="font-medium">Collection Rate</p>
              <p style={{ color: '#065F46' }} className="font-bold">{paidPercentage}%</p>
            </div>
            <div style={{ backgroundColor: '#E5E7EB', borderRadius: '8px', height: '32px' }} className="overflow-hidden">
              <div
                style={{
                  backgroundColor: '#10B981',
                  width: `${paidPercentage}%`,
                  height: '100%',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <p style={{ color: '#6B7280' }} className="text-xs mt-2">
              Amount collected vs total revenue
            </p>
          </div>

          {/* Outstanding Rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p style={{ color: '#6B7280' }} className="font-medium">Outstanding Rate</p>
              <p style={{ color: '#F59E0B' }} className="font-bold">{outstandingPercentage}%</p>
            </div>
            <div style={{ backgroundColor: '#E5E7EB', borderRadius: '8px', height: '32px' }} className="overflow-hidden">
              <div
                style={{
                  backgroundColor: '#F59E0B',
                  width: `${outstandingPercentage}%`,
                  height: '100%',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
            <p style={{ color: '#6B7280' }} className="text-xs mt-2">
              Pending payments vs total revenue
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPage;
