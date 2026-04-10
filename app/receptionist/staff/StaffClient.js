'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Loader, AlertCircle, Mail, Phone, Briefcase, Award } from 'lucide-react';

export default function StaffClient() {
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [offset, setOffset] = useState(0);
  const [displayedStaff, setDisplayedStaff] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const LIMIT = 10;

  // Fetch staff members
  useEffect(() => {
    fetchStaff();
  }, []);

  // Filter staff based on search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStaff(staff);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredStaff(
        staff.filter(s =>
          s.first_name.toLowerCase().includes(query) ||
          s.last_name.toLowerCase().includes(query) ||
          s.designation.toLowerCase().includes(query) ||
          (s.phone_number && s.phone_number.includes(query)) ||
          (s.email && s.email.toLowerCase().includes(query))
        )
      );
    }
    setOffset(0);
    setDisplayedStaff([]);
  }, [searchQuery, staff]);

  // Load initial staff
  useEffect(() => {
    loadMoreStaff();
  }, [filteredStaff]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/receptionist/staff');
      if (!response.ok) {
        throw new Error('Failed to fetch staff');
      }

      const result = await response.json();
      const staffList = result.data || result.staff || [];
      
      setStaff(staffList);
      setFilteredStaff(staffList);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreStaff = () => {
    if (displayedStaff.length === 0 && filteredStaff.length > 0) {
      // Initial load
      const nextStaff = filteredStaff.slice(0, LIMIT);
      setDisplayedStaff(nextStaff);
      setHasMore(filteredStaff.length > LIMIT);
    }
  };

  const handleSeeMore = () => {
    setLoadingMore(true);
    
    setTimeout(() => {
      const newOffset = offset + LIMIT;
      const nextStaff = filteredStaff.slice(0, newOffset + LIMIT);
      
      setDisplayedStaff(nextStaff);
      setOffset(newOffset);
      setHasMore(filteredStaff.length > newOffset + LIMIT);
      setLoadingMore(false);
    }, 300);
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} color="#10B981" className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading staff directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold" style={{ color: '#065F46' }}>
          Staff Directory
        </h1>
        <p style={{ color: '#10B981' }} className="text-sm mt-2">
          View and search staff members in your department
        </p>
      </div>

      {/* Search Section */}
      <div className="mb-8 max-w-2xl">
        <div className="relative">
          <Search size={20} style={{ color: '#9CA3AF' }} className="absolute left-4 top-4" />
          <input
            type="text"
            placeholder="Search by name, designation, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-3 rounded-lg border-2 outline-none"
            style={{
              borderColor: '#E5E7EB',
              backgroundColor: '#FFFFFF',
              color: '#1F2937',
            }}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: '#6B7280' }}>
          Showing {displayedStaff.length} of {filteredStaff.length} staff members
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-8 p-6 rounded-2xl flex gap-4 border-l-4" style={{ backgroundColor: '#FFE4D6', borderColor: '#E74C3C' }}>
          <AlertCircle size={24} color="#E74C3C" />
          <div>
            <p className="font-bold" style={{ color: '#C0392B' }}>Error</p>
            <p style={{ color: '#922B21' }} className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Staff Grid */}
      {displayedStaff.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: '#F9FAFB' }}>
          <Users size={48} color="#D1D5DB" className="mx-auto mb-4" />
          <p style={{ color: '#6B7280' }} className="text-lg font-semibold">No staff members found</p>
          <p style={{ color: '#9CA3AF' }} className="text-sm mt-2">Try adjusting your search criteria</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {displayedStaff.map(member => (
              <div
                key={member.staff_id}
                className="rounded-2xl p-6 transition-all hover:shadow-xl"
                style={{ backgroundColor: '#F9FAFB', border: '2px solid #E5E7EB' }}
              >
                {/* Header Section */}
                <div className="mb-4 pb-4" style={{ borderBottom: '2px solid #E5E7EB' }}>
                  <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#E8F8F5' }}>
                    <Users size={28} color="#10B981" />
                  </div>
                  <h3 className="text-xl font-bold text-center" style={{ color: '#065F46' }}>
                    {member.first_name} {member.last_name}
                  </h3>
                  <p className="text-center text-xs font-semibold mt-1" style={{ color: '#10B981' }}>
                    Employee ID: {member.employee_id}
                  </p>
                </div>

                {/* Designation */}
                <div className="mb-4">
                  <div className="flex items-start gap-3">
                    <Briefcase size={18} style={{ color: '#F59E0B' }} className="mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Designation</p>
                      <p className="text-sm font-bold mt-1" style={{ color: '#065F46' }}>
                        {member.designation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="mb-4">
                  <div className="flex items-start gap-3">
                    <Award size={18} style={{ color: '#3B82F6' }} className="mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Status</p>
                      <span
                        className="inline-block px-3 py-1 rounded-lg text-xs font-bold mt-1"
                        style={{
                          backgroundColor:
                            member.status === 'Active'
                              ? '#D1FAE5'
                              : member.status === 'On Leave'
                              ? '#FEF3C7'
                              : '#FEE2E2',
                          color:
                            member.status === 'Active'
                              ? '#065F46'
                              : member.status === 'On Leave'
                              ? '#92400E'
                              : '#7F1D1D',
                        }}
                      >
                        {member.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="mb-4">
                  <div className="flex items-start gap-3">
                    <Mail size={18} style={{ color: '#8B5CF6' }} className="mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Email</p>
                      <p className="text-xs mt-1 break-all" style={{ color: '#065F46' }}>
                        {member.email || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <div className="flex items-start gap-3">
                    <Phone size={18} style={{ color: '#EC4899' }} className="mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Phone</p>
                      <p className="text-sm font-bold mt-1" style={{ color: '#065F46' }}>
                        {member.phone_number}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hire Date */}
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
                  <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Joined</p>
                  <p className="text-xs mt-1" style={{ color: '#065F46' }}>
                    {new Date(member.hire_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* See More Button */}
          {hasMore && (
            <div className="flex justify-center">
              <button
                onClick={handleSeeMore}
                disabled={loadingMore}
                className="px-8 py-3 rounded-lg font-semibold transition-all hover:shadow-lg disabled:opacity-50"
                style={{
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                }}
              >
                {loadingMore ? (
                  <>
                    <Loader size={18} className="inline animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  `See More (${filteredStaff.length - displayedStaff.length} remaining)`
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
