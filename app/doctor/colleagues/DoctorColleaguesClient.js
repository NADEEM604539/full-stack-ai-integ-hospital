'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Loader, AlertCircle, Phone, Mail, Stethoscope, Award } from 'lucide-react';

export default function DoctorColleaguesClient() {
  const [colleagues, setColleagues] = useState([]);
  const [filteredColleagues, setFilteredColleagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedColleagues, setDisplayedColleagues] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const LIMIT = 10;

  useEffect(() => {
    fetchColleagues();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredColleagues(colleagues);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredColleagues(
        colleagues.filter(c =>
          c.first_name.toLowerCase().includes(query) ||
          c.last_name.toLowerCase().includes(query) ||
          (c.specialization && c.specialization.toLowerCase().includes(query))
        )
      );
    }
    setOffset(0);
    setDisplayedColleagues([]);
  }, [searchQuery, colleagues]);

  useEffect(() => {
    if (displayedColleagues.length === 0 && filteredColleagues.length > 0) {
      const nextColleagues = filteredColleagues.slice(0, LIMIT);
      setDisplayedColleagues(nextColleagues);
      setHasMore(filteredColleagues.length > LIMIT);
    }
  }, [filteredColleagues]);

  const fetchColleagues = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/doctor/colleagues');
      if (!response.ok) {
        throw new Error('Failed to fetch colleagues');
      }

      const result = await response.json();
      setColleagues(result.data || []);
    } catch (err) {
      console.error('Error fetching colleagues:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSeeMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      const newOffset = offset + LIMIT;
      const nextColleagues = filteredColleagues.slice(0, newOffset + LIMIT);
      setDisplayedColleagues(nextColleagues);
      setOffset(newOffset);
      setHasMore(filteredColleagues.length > newOffset + LIMIT);
      setLoadingMore(false);
    }, 300);
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} color="#3B82F6" className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading colleagues...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }} className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold" style={{ color: '#1E40AF' }}>
          Colleagues
        </h1>
        <p style={{ color: '#3B82F6' }} className="text-sm mt-2">
          View and search colleague doctors in your department
        </p>
      </div>

      <div className="mb-8 max-w-2xl">
        <div className="relative">
          <Search size={20} style={{ color: '#9CA3AF' }} className="absolute left-4 top-4" />
          <input
            type="text"
            placeholder="Search by name or specialization..."
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
      </div>

      {error && (
        <div className="mb-8 p-6 rounded-2xl flex gap-4 border-l-4" style={{ backgroundColor: '#FFE4D6', borderColor: '#E74C3C' }}>
          <AlertCircle size={24} color="#E74C3C" />
          <div>
            <p className="font-bold" style={{ color: '#C0392B' }}>Error</p>
            <p style={{ color: '#922B21' }} className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {displayedColleagues.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: '#FFFFFF' }}>
          <Users size={48} color="#D1D5DB" className="mx-auto mb-4" />
          <p style={{ color: '#6B7280' }} className="text-lg font-semibold">No colleagues found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {displayedColleagues.map(colleague => (
              <div
                key={colleague.doctor_id}
                className="rounded-2xl p-6 transition-all hover:shadow-xl"
                style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}
              >
                <div className="mb-4 pb-4" style={{ borderBottom: '2px solid #E5E7EB' }}>
                  <div className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: '#EFF6FF' }}>
                    <Stethoscope size={28} color="#3B82F6" />
                  </div>
                  <h3 className="text-xl font-bold text-center" style={{ color: '#1E40AF' }}>
                    Dr. {colleague.first_name} {colleague.last_name}
                  </h3>
                  <p className="text-center text-xs font-semibold mt-1" style={{ color: '#3B82F6' }}>
                    {colleague.specialization}
                  </p>
                </div>

                <div className="mb-4">
                  <div className="flex items-start gap-3">
                    <Award size={18} style={{ color: '#F59E0B' }} className="mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Status</p>
                      <span
                        className="inline-block px-3 py-1 rounded-lg text-xs font-bold mt-1"
                        style={{
                          backgroundColor: colleague.status === 'Active' ? '#D1FAE5' : '#FEE2E2',
                          color: colleague.status === 'Active' ? '#065F46' : '#7F1D1D',
                        }}
                      >
                        {colleague.status}
                      </span>
                    </div>
                  </div>
                </div>

                {colleague.phone_number && (
                  <div className="mb-4">
                    <div className="flex items-start gap-3">
                      <Phone size={18} style={{ color: '#EC4899' }} className="mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Phone</p>
                        <p className="text-sm font-bold mt-1" style={{ color: '#1E40AF' }}>
                          {colleague.phone_number}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {colleague.email && (
                  <div>
                    <div className="flex items-start gap-3">
                      <Mail size={18} style={{ color: '#8B5CF6' }} className="mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Email</p>
                        <p className="text-xs mt-1 break-all" style={{ color: '#1E40AF' }}>
                          {colleague.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <button
                onClick={handleSeeMore}
                disabled={loadingMore}
                className="px-8 py-3 rounded-lg font-semibold transition-all hover:shadow-lg disabled:opacity-50"
                style={{
                  backgroundColor: '#3B82F6',
                  color: '#FFFFFF',
                }}
              >
                {loadingMore ? 'Loading...' : `See More (${filteredColleagues.length - displayedColleagues.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
