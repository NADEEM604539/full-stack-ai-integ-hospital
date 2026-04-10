'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Loader, AlertCircle, Check, X, Edit2, Save } from 'lucide-react';

const dayEmojis = {
  Monday: '📅',
  Tuesday: '📚',
  Wednesday: '📖',
  Thursday: '📝',
  Friday: '🎯',
  Saturday: '🎉',
  Sunday: '☀️',
};

export default function DoctorScheduleClient() {
  const [schedule, setSchedule] = useState([]);
  const [editedSchedule, setEditedSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/doctor/schedule');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch schedule');
      }

      const result = await response.json();
      const scheduleData = result.data || [];
      setSchedule(scheduleData);
      setEditedSchedule(JSON.parse(JSON.stringify(scheduleData)));
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit - reset to original
      setEditedSchedule(JSON.parse(JSON.stringify(schedule)));
    }
    setIsEditMode(!isEditMode);
    setError(null);
  };

  const handleTimeChange = (index, field, value) => {
    const updated = [...editedSchedule];
    updated[index] = { ...updated[index], [field]: value };
    setEditedSchedule(updated);
  };

  const handleToggleWorking = (index) => {
    const updated = [...editedSchedule];
    updated[index] = { ...updated[index], is_working: !updated[index].is_working };
    setEditedSchedule(updated);
  };

  // Helper function to round time to nearest 30-minute increment
  const roundToNearestThirty = (timeString) => {
    const [hours, mins] = timeString.split(':').map(Number);
    let minutes = mins;

    // Round to nearest 30
    if (minutes < 15) {
      minutes = 0;
    } else if (minutes < 45) {
      minutes = 30;
    } else {
      minutes = 0;
      return `${String((hours + 1) % 24).padStart(2, '0')}:00`;
    }

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  // Show notification toast
  const showNotification = (message, type = 'warning') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);
      setError(null);

      // Auto-mark days with empty end times as "Day Off"
      let scheduleToSave = editedSchedule.map(item => {
        if (item.is_working) {
          const start = (item.shift_start_time || '').trim();
          const end = (item.shift_end_time || '').trim();
          
          // If end time is empty/incomplete, mark as day off
          if (!end || end.includes('--')) {
            return { ...item, is_working: false };
          }
        }
        return item;
      });

      // Auto-correct times to 30-minute increments and validate
      let correctedDays = [];
      scheduleToSave = scheduleToSave.map(item => {
        if (item.is_working) {
          const startTime = item.shift_start_time.trim();
          const endTime = item.shift_end_time.trim();
          
          // Validate time format (HH:MM)
          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            throw new Error(`⚠️ Invalid time format on ${item.day_of_week}`);
          }

          // Auto-correct times to 30-minute increments
          let correctedStart = startTime;
          let correctedEnd = endTime;
          
          const [startHour, startMin] = startTime.split(':').map(Number);
          const [endHour, endMin] = endTime.split(':').map(Number);
          
          if (startMin % 30 !== 0) {
            correctedStart = roundToNearestThirty(startTime);
            correctedDays.push(item.day_of_week);
          }
          if (endMin % 30 !== 0) {
            correctedEnd = roundToNearestThirty(endTime);
            if (!correctedDays.includes(item.day_of_week)) {
              correctedDays.push(item.day_of_week);
            }
          }

          const startTotalMin = correctedStart.split(':').map(Number).reduce((h, m) => h * 60 + m);
          const endTotalMin = correctedEnd.split(':').map(Number).reduce((h, m) => h * 60 + m);

          // Check if times are valid (must allow overnight shifts)
          if (startTotalMin >= endTotalMin) {
            const minutesDifference = startTotalMin - endTotalMin;
            
            // Same time
            if (minutesDifference === 0) {
              throw new Error(`⚠️ Cannot set same start and end time for ${item.day_of_week}`);
            }
            
            // If difference is less than 12 hours, end time is before start time
            if (minutesDifference < 12 * 60) {
              throw new Error(`⚠️ ${item.day_of_week}: End time before start time. Use overnight format like 22:00 → 04:00?`);
            }
          }
          
          return { ...item, shift_start_time: correctedStart, shift_end_time: correctedEnd };
        }
        return item;
      });

      // Show notification if times were corrected
      if (correctedDays.length > 0) {
        showNotification(`⏰ Times on ${correctedDays.join(', ')} rounded to nearest 30-minute interval`, 'warning');
      }

      const response = await fetch('/api/doctor/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: scheduleToSave }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save schedule');
      }

      const result = await response.json();
      setSchedule(editedSchedule);
      setIsEditMode(false);
      showNotification('✅ Schedule updated successfully!', 'success');
    } catch (err) {
      console.error('Error saving schedule:', err);
      showNotification(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }} className="p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader size={64} color="#3B82F6" className="animate-spin mx-auto mb-4" />
          <p style={{ color: '#6B7280' }} className="text-lg">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh' }} className="p-8">
      {/* Header with Edit Button */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold" style={{ color: '#1E40AF' }}>
            📅 My Schedule
          </h1>
          <p style={{ color: '#6B7280' }} className="text-sm mt-2">
            {isEditMode ? 'Edit your working hours' : 'View your working hours and availability'}
          </p>
        </div>
        <button
          onClick={handleEditToggle}
          disabled={saving}
          className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all hover:shadow-md"
          style={{
            backgroundColor: isEditMode ? '#EF4444' : '#3B82F6',
            color: 'white',
          }}
        >
          {isEditMode ? (
            <>
              <X size={18} />
              Cancel
            </>
          ) : (
            <>
              <Edit2 size={18} />
              Edit Schedule
            </>
          )}
        </button>
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

      {notification && (
        <div className={`mb-8 p-4 rounded-lg flex items-start gap-3 fixed top-4 right-4 max-w-sm shadow-lg z-50 ${
          notification.type === 'error' ? 'bg-red-50 border border-red-200' : 
          notification.type === 'success' ? 'bg-green-50 border border-green-200' :
          'bg-amber-50 border border-amber-200'
        }`}>
          <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
            notification.type === 'error' ? 'text-red-500' : 
            notification.type === 'success' ? 'text-green-600' :
            'text-amber-600'
          }`} />
          <p className={`text-sm ${
            notification.type === 'error' ? 'text-red-700' : 
            notification.type === 'success' ? 'text-green-700' :
            'text-amber-700'
          }`}>{notification.message}</p>
        </div>
      )}

      {schedule.length === 0 ? (
        <div className="flex items-center justify-center py-16 rounded-2xl" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="text-center">
            <Calendar size={64} color="#D1D5DB" className="mx-auto mb-4" />
            <p style={{ color: '#6B7280' }} className="text-lg font-semibold">No schedule set yet</p>
            <p style={{ color: '#9CA3AF' }} className="text-sm mt-2">Contact your administrator to set up your working hours</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {(isEditMode ? editedSchedule : schedule).map((item, index) => (
              <div
                key={item.availability_id}
                className="rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderLeft: item.is_working ? '4px solid #10B981' : '4px solid #EF4444',
                }}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{dayEmojis[item.day_of_week] || '📅'}</span>
                    <div>
                      <p className="font-bold text-lg" style={{ color: '#1E40AF' }}>
                        {item.day_of_week}
                      </p>
                    </div>
                  </div>
                  {isEditMode && (
                    <button
                      onClick={() => handleToggleWorking(index)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
                      style={{
                        backgroundColor: item.is_working ? '#DCFCE7' : '#FEE2E2',
                      }}
                    >
                      {item.is_working ? (
                        <>
                          <Check size={18} color="#15803D" />
                          <span className="text-sm font-semibold" style={{ color: '#15803D' }}>
                            Working
                          </span>
                        </>
                      ) : (
                        <>
                          <X size={18} color="#DC2626" />
                          <span className="text-sm font-semibold" style={{ color: '#DC2626' }}>
                            Day Off
                          </span>
                        </>
                      )}
                    </button>
                  )}
                  {!isEditMode && (
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{
                        backgroundColor: item.is_working ? '#DCFCE7' : '#FEE2E2',
                      }}
                    >
                      {item.is_working ? (
                        <>
                          <Check size={18} color="#15803D" />
                          <span className="text-sm font-semibold" style={{ color: '#15803D' }}>
                            Working
                          </span>
                        </>
                      ) : (
                        <>
                          <X size={18} color="#DC2626" />
                          <span className="text-sm font-semibold" style={{ color: '#DC2626' }}>
                            Day Off
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Time Display or Edit */}
                {item.is_working ? (
                  isEditMode ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold" style={{ color: '#6B7280' }}>
                          Start Time
                        </label>
                        <input
                          type="time"
                          step="1800"
                          value={editedSchedule[index].shift_start_time}
                          onChange={(e) => handleTimeChange(index, 'shift_start_time', e.target.value)}
                          className="w-full mt-1 p-2 border rounded-lg text-sm"
                          style={{ borderColor: '#D1D5DB', color: '#1F2937' }}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold" style={{ color: '#6B7280' }}>
                          End Time
                        </label>
                        <input
                          type="time"
                          step="1800"
                          value={editedSchedule[index].shift_end_time}
                          onChange={(e) => handleTimeChange(index, 'shift_end_time', e.target.value)}
                          className="w-full mt-1 p-2 border rounded-lg text-sm"
                          style={{ borderColor: '#D1D5DB', color: '#1F2937' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2" style={{ color: '#4B5563' }}>
                      <Clock size={18} color="#3B82F6" />
                      <span className="text-sm">
                        <span className="font-semibold">{item.shift_start_time}</span>
                        <span className="mx-2" style={{ color: '#9CA3AF' }}>→</span>
                        <span className="font-semibold">{item.shift_end_time}</span>
                      </span>
                    </div>
                  )
                ) : (
                  <p style={{ color: '#9CA3AF' }} className="text-sm italic">No shift scheduled</p>
                )}
              </div>
            ))}
          </div>

          {/* Summary and Save Button */}
          {schedule.length > 0 && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl" style={{ backgroundColor: '#FFFFFF' }}>
                <h3 className="font-bold text-lg mb-4" style={{ color: '#1E40AF' }}>
                  📊 Weekly Summary
                </h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <p style={{ color: '#6B7280' }} className="text-sm">Working Days</p>
                    <p className="text-3xl font-bold" style={{ color: '#10B981' }}>
                      {(isEditMode ? editedSchedule : schedule).filter(s => s.is_working).length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p style={{ color: '#6B7280' }} className="text-sm">Days Off</p>
                    <p className="text-3xl font-bold" style={{ color: '#EF4444' }}>
                      {(isEditMode ? editedSchedule : schedule).filter(s => !s.is_working).length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p style={{ color: '#6B7280' }} className="text-sm">Total Days</p>
                    <p className="text-3xl font-bold" style={{ color: '#3B82F6' }}>
                      {(isEditMode ? editedSchedule : schedule).length}
                    </p>
                  </div>
                </div>
              </div>

              {isEditMode && (
                <button
                  onClick={handleSaveSchedule}
                  disabled={saving}
                  className="w-full py-3 px-6 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg"
                  style={{
                    backgroundColor: saving ? '#94A3B8' : '#10B981',
                    color: 'white',
                  }}
                >
                  {saving ? (
                    <>
                      <Loader size={20} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Save Schedule
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
