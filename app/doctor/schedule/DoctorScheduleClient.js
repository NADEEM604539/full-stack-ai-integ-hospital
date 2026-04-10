'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Loader, AlertCircle } from 'lucide-react';

export default function DoctorScheduleClient() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/doctor/schedule');
      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }

      const result = await response.json();
      setSchedule(result.data || []);
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={48} color="#3B82F6" className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }}>Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }} className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold" style={{ color: '#1E40AF' }}>
          My Schedule
        </h1>
        <p style={{ color: '#3B82F6' }} className="text-sm mt-2">
          View your working hours and availability
        </p>
      </div>

      {error && (
        <div className="p-6 rounded-2xl flex gap-4 border-l-4" style={{ backgroundColor: '#FFE4D6', borderColor: '#E74C3C' }}>
          <AlertCircle size={24} color="#E74C3C" />
          <div>
            <p className="font-bold" style={{ color: '#C0392B' }}>Error</p>
            <p style={{ color: '#922B21' }} className="text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {schedule.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ backgroundColor: '#FFFFFF' }}>
          <Calendar size={48} color="#D1D5DB" className="mx-auto mb-4" />
          <p style={{ color: '#6B7280' }} className="text-lg font-semibold">No schedule set</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {schedule.map((item, idx) => (
            <div key={idx} className="p-6 rounded-lg" style={{ backgroundColor: '#FFFFFF', border: '2px solid #E5E7EB' }}>
              <p className="font-bold text-lg" style={{ color: '#1E40AF' }}>{item.day_of_week}</p>
              <p style={{ color: '#6B7280' }} className="text-sm">
                {item.shift_start_time} - {item.shift_end_time}
              </p>
              <span
                className="inline-block mt-2 px-3 py-1 rounded-lg text-xs font-bold"
                style={{
                  backgroundColor: item.is_working ? '#D1FAE5' : '#FEE2E2',
                  color: item.is_working ? '#065F46' : '#7F1D1D',
                }}
              >
                {item.is_working ? 'Working' : 'Off'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
