'use client';

import { Calendar, Clock, Users, Stethoscope, Phone, FileText, Bell, Settings, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ReceptionistDashboard() {
  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Decorative blurred shapes - Green, Pink, Gold */}
      <div 
        className="absolute top-20 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: '#10B981' }}
      />
      <div 
        className="absolute top-40 right-1/3 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: '#F5DEB3' }}
      />
      <div 
        className="absolute bottom-20 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: '#FFD699' }}
      />
      <div 
        className="absolute bottom-40 left-1/4 w-72 h-72 rounded-full mix-blend-multiply filter blur-3xl opacity-12 pointer-events-none"
        style={{ backgroundColor: '#F59E0B' }}
      />
      {/* Gradient Header - Green dominant with gold accents */}
      <div 
        className="relative border-b backdrop-blur-md"
        style={{
          background: 'linear-gradient(135deg, #047857 0%, #10B981 40%, #059669 100%)',
          borderColor: 'rgba(245, 158, 11, 0.2)',
          borderBottomWidth: '2px',
        }}
      >
        <div 
          className="absolute top-0 right-0 w-96 h-96 opacity-10 mix-blend-screen pointer-events-none"
          style={{
            background: 'radial-gradient(circle, #F59E0B, transparent)',
            filter: 'blur(40px)',
          }}
        />
        <div className="max-w-7xl mx-auto px-8 py-10 relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">
                Welcome back, Sarah
              </h1>
              <p className="text-green-50 flex items-center gap-2">
                <Clock size={16} />
                Thursday, April 10, 2026 • 9:45 AM
              </p>
            </div>
            <div className="flex gap-3">
              <button
                className="px-7 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:scale-105"
                style={{ 
                  backgroundColor: '#F9D5A1',
                  color: '#065F46',
                }}
              >
                + New Appointment
              </button>
              <button
                className="p-3 rounded-xl transition-all hover:shadow-lg"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <Settings size={20} />
              </button>
              <button
                className="p-3 rounded-xl transition-all hover:shadow-lg relative"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <Bell size={20} />
                <span 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold text-white"
                  style={{ backgroundColor: '#F9D5A1', color: '#065F46' }}
                >
                  3
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12 relative z-20">
        {/* Quick Stats - Premium Cards with Gold & Pink */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          {[
            { label: "Today's Appointments", value: '12', icon: Calendar, color: '#10B981', bgColor: '#E8F8F5' },
            { label: 'Checked In', value: '8', icon: CheckCircle2, color: '#059669', bgColor: '#FFE4F5' },
            { label: 'In Progress', value: '3', icon: Clock, color: '#F59E0B', bgColor: '#FFD9E8' },
            { label: 'Completed', value: '5', icon: Stethoscope, color: '#10B981', bgColor: '#FFE4D6' },
          ].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl transition-all hover:shadow-xl hover:scale-105 relative overflow-hidden group"
                style={{
                  backgroundColor: stat.bgColor,
                  border: `1.5px solid rgba(16, 185, 129, 0.15)`,
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.08)',
                }}
              >
                <div 
                  className="absolute top-0 right-0 w-32 h-32 opacity-5 mix-blend-multiply rounded-full"
                  style={{
                    backgroundColor: '#F59E0B',
                    filter: 'blur(20px)',
                  }}
                />
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p style={{ color: '#10B981' }} className="text-sm font-semibold tracking-wide">
                      {stat.label}
                    </p>
                    <p className="text-4xl font-bold mt-3" style={{ color: '#065F46' }}>
                      {stat.value}
                    </p>
                  </div>
                  <div 
                    className="p-3 rounded-xl border"
                    style={{ 
                      backgroundColor: `${stat.color}15`,
                      borderColor: `${stat.color}30`,
                    }}
                  >
                    <Icon size={24} color={stat.color} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Appointments Section */}
          <div className="col-span-2">
            <div
              className="p-8 rounded-2xl relative overflow-hidden"
              style={{
                backgroundColor: '#F0FDF4',
                border: '1.5px solid rgba(16, 185, 129, 0.15)',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.08)',
              }}
            >
              <div 
                className="absolute top-0 right-0 w-40 h-40 opacity-5 rounded-full"
                style={{
                  backgroundColor: '#F59E0B',
                  filter: 'blur(30px)',
                }}
              />
              <div className="flex justify-between items-center mb-7 relative z-10">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: '#065F46' }}>
                    Today's Schedule
                  </h2>
                  <p style={{ color: '#D97706' }} className="text-sm mt-1 font-semibold">4 appointments remaining</p>
                </div>
                <a
                  href="#"
                  className="text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all px-4 py-2 rounded-lg"
                  style={{ color: '#10B981', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
                >
                  View all <ArrowRight size={16} />
                </a>
              </div>

              {/* Appointment List */}
              <div className="space-y-3 relative z-10">
                {[
                  {
                    time: '09:00 AM',
                    patient: 'John Doe',
                    doctor: 'Dr. Smith',
                    status: 'Checked In',
                    statusColor: '#10B981',
                    bgColor: '#FFFFFF',
                  },
                  {
                    time: '09:30 AM',
                    patient: 'Jane Wilson',
                    doctor: 'Dr. Johnson',
                    status: 'In Progress',
                    statusColor: '#059669',
                    bgColor: '#FFE4F5',
                  },
                  {
                    time: '10:00 AM',
                    patient: 'Robert Brown',
                    doctor: 'Dr. Williams',
                    status: 'Waiting',
                    statusColor: '#F59E0B',
                    bgColor: '#FFD9E8',
                  },
                  {
                    time: '10:30 AM',
                    patient: 'Emily Davis',
                    doctor: 'Dr. Martinez',
                    status: 'Scheduled',
                    statusColor: '#10B981',
                    bgColor: '#FFFFFF',
                  },
                ].map((apt, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl border transition-all hover:shadow-lg group"
                    style={{
                      borderColor: apt.status === 'Waiting' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.15)',
                      backgroundColor: apt.bgColor,
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: apt.status === 'Waiting' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                          }}
                        >
                          <Clock size={20} color={apt.status === 'Waiting' ? '#F59E0B' : '#10B981'} />
                        </div>
                        <div>
                          <p className="font-bold" style={{ color: '#065F46' }}>
                            {apt.patient}
                          </p>
                          <p style={{ color: apt.status === 'Waiting' ? '#D97706' : '#10B981' }} className="text-sm">
                            {apt.time} • {apt.doctor}
                          </p>
                        </div>
                      </div>
                      <span
                        className="px-4 py-2 rounded-full text-xs font-bold text-white whitespace-nowrap ml-4"
                        style={{ 
                          backgroundColor: apt.statusColor,
                          color: apt.status === 'Waiting' ? '#065F46' : '#FFFFFF'
                        }}
                      >
                        {apt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div
              className="p-7 rounded-2xl relative overflow-hidden"
              style={{
                backgroundColor: '#FFE4F5',
                border: '1.5px solid rgba(245, 158, 11, 0.15)',
                boxShadow: '0 4px 20px rgba(245, 158, 11, 0.08)',
              }}
            >
              <div 
                className="absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full"
                style={{
                  backgroundColor: '#F59E0B',
                  filter: 'blur(20px)',
                }}
              />
              <h3 className="text-lg font-bold mb-5 relative z-10" style={{ color: '#065F46' }}>
                Quick Actions
              </h3>
              <div className="space-y-3 relative z-10">
                {[
                  { label: 'Register Patient', icon: Users, color: '#10B981', bgBtn: '#FFFFFF' },
                  { label: 'Schedule Visit', icon: Calendar, color: '#F59E0B', bgBtn: '#FFD9E8' },
                  { label: 'Call Doctor', icon: Phone, color: '#059669', bgBtn: '#FFFFFF' },
                  { label: 'View Documents', icon: FileText, color: '#F59E0B', bgBtn: '#FFE4D6' },
                ].map((action, idx) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={idx}
                      className="w-full p-4 rounded-xl flex items-center gap-3 transition-all hover:shadow-md border group"
                      style={{
                        backgroundColor: action.bgBtn,
                        borderColor: action.bgBtn === '#FFFFFF' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      }}
                    >
                      <div
                        className="p-2 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: `${action.color}15` }}
                      >
                        <Icon size={18} color={action.color} />
                      </div>
                      <span style={{ color: '#065F46' }} className="font-medium text-sm">
                        {action.label}
                      </span>
                      <ArrowRight size={14} color={action.color} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Alert Card - Premium with Pink & Gold */}
            <div
              className="p-6 rounded-2xl border-l-4 relative overflow-hidden"
              style={{ 
                backgroundColor: '#FFD9E8',
                borderColor: '#F59E0B',
                borderLeftWidth: '4px',
              }}
            >
              <div 
                className="absolute top-0 right-0 w-24 h-24 opacity-10 rounded-full"
                style={{
                  backgroundColor: '#F59E0B',
                  filter: 'blur(15px)',
                }}
              />
              <div className="flex gap-3 relative z-10">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#F9D5A115' }}
                >
                  <Bell size={18} color="#D97706" />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: '#065F46' }}>
                    Pending Verifications
                  </p>
                  <p style={{ color: '#D97706' }} className="text-sm mt-1">
                    2 patients need insurance approval
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}