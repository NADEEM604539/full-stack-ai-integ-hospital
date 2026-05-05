'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [stats, setStats] = useState({
    doctors: 0,
    departments: 0,
    nurses: 0,
    pharmacists: 0,
  });

  useEffect(() => {
    if (!isLoaded) return;

    if (userId) {
      fetch('/api/auth/user')
        .then(res => res.json())
        .then(data => {
          if (data?.data?.role) {
            router.push(`/${data.data.role.toLowerCase()}/dashboard`);
          } else {
            setIsChecking(false);
          }
        })
        .catch(() => setIsChecking(false));
    } else {
      setIsChecking(false);
    }
  }, [isLoaded, userId, router]);

  useEffect(() => {
    fetch('/api/hospital/stats')
      .then(res => res.json())
      .then(data => {
        if (data?.data) setStats(data.data);
      });
  }, []);

  // 🔥 BEAUTIFUL CARD-BASED LOADER
  if (!isLoaded || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50 p-4">
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.3); }
            50% { box-shadow: 0 0 40px rgba(34, 197, 94, 0.6); }
          }
          @keyframes spin-slow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .float-animation { animation: float 3s ease-in-out infinite; }
          .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
          .spin-slow { animation: spin-slow 4s linear infinite; }
        `}</style>
        
        <div className="w-full max-w-md">
          {/* Main Loading Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-12 float-animation">
            <div className="text-center space-y-8">
              {/* Animated Heart Circle */}
              <div className="flex justify-center">
                <div className="relative w-32 h-32">
                  {/* Outer rotating ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-600 border-r-green-600 spin-slow"></div>
                  
                  {/* Middle pulsing circle */}
                  <div className="absolute inset-2 rounded-full border-2 border-green-200 pulse-glow"></div>
                  
                  {/* Center heart with glow */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl animate-pulse">♥️</span>
                  </div>
                </div>
              </div>

              {/* Loading Title */}
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  SNH Medsync
                </h2>
                <p className="text-lg text-green-600 font-semibold">
                  Initializing Hospital Systems
                </p>
              </div>

              {/* Loading Steps */}
              <div className="space-y-3 text-left bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-700">Connecting to hospital database...</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <span className="text-sm text-gray-700">Loading patient records & staff data...</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  <span className="text-sm text-gray-700">Initializing AI-powered features...</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
                  <span className="text-sm text-gray-700">Authenticating your session...</span>
                </div>
              </div>

              {/* Loading Description */}
              <div className="text-center space-y-2">
                <p className="text-gray-600 font-medium">
                  Preparing your hospital dashboard
                </p>
                <p className="text-sm text-gray-500">
                  This may take a few moments...
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full animate-pulse" style={{width: '65%'}}></div>
              </div>
            </div>
          </div>

          {/* Floating Status */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">Welcome to the future of healthcare</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-gray-800 overflow-hidden">
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes float-up {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .gradient-animated {
          background-size: 200% 200%;
          animation: gradient-shift 6s ease infinite;
        }
        .float-animation {
          animation: float-up 3s ease-in-out infinite;
        }
      `}</style>

      {/* HERO IMAGE SECTION - REDUCED HEIGHT */}
      <section className="relative h-96 md:h-[1000px] flex items-end justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/img.png" 
            alt="Hospital Background" 
            className="w-full h-250 object-cover"
          />
          {/* Premium Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/40 via-transparent to-transparent"></div>
        </div>

        {/* Bottom gradient fade to white */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-b from-transparent via-black/20 to-white z-10"></div>
      </section>
      <div className="flex justify-center gap-4 pt-8">
              <Link href="/sign-up" className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-12 py-4 rounded-full font-bold text-lg hover:shadow-2xl hover:scale-105 transition transform flex items-center gap-2 group shadow-lg">
                <span>Get Started</span>
                <span className="group-hover:translate-x-2 transition">→</span>
              </Link>
              <Link href="/sign-in" className="border-2 border-emerald-600 text-emerald-600 px-12 py-4 rounded-full font-bold text-lg hover:bg-emerald-50 transition bg-white shadow-lg hover:shadow-xl">
                Book Appointment
              </Link>
            </div>
      {/* HERO CONTENT SECTION - CLEAN WHITE BACKGROUND */}
      <section className="bg-white px-6 py-20 md:py-32">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-8 mb-20">
            <div className="inline-block bg-emerald-500/20 backdrop-blur-md text-emerald-600 px-5 py-2.5 rounded-full text-sm font-bold border border-emerald-400/50">
              <span className="mr-2">✨</span>Healthcare Revolution
            </div>
            <h1 className="text-6xl md:text-7xl font-black leading-tight text-gray-900">
              Transform Your
              <span className="bg-gradient-to-r from-emerald-600 via-cyan-600 to-green-600 bg-clip-text text-transparent"> Hospital Today</span>
            </h1>
            <p className="text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto font-medium">
              SNH Medsync is the AI-powered hospital management platform that revolutionizes patient care, streamlines operations, and empowers healthcare professionals with intelligent systems.
            </p>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 pt-8 max-w-2xl mx-auto">
              <div className="group bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-300 shadow-lg hover:shadow-xl transition transform hover:scale-105 cursor-pointer">
                <p className="text-4xl font-black text-emerald-600 group-hover:text-emerald-700 transition">{stats.doctors}+</p>
                <p className="text-sm text-gray-700 font-bold mt-2">Doctors</p>
              </div>
              <div className="group bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 rounded-2xl border border-cyan-300 shadow-lg hover:shadow-xl transition transform hover:scale-105 cursor-pointer">
                <p className="text-4xl font-black text-cyan-600 group-hover:text-cyan-700 transition">{stats.departments}+</p>
                <p className="text-sm text-gray-700 font-bold mt-2">Departments</p>
              </div>
              <div className="group bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-300 shadow-lg hover:shadow-xl transition transform hover:scale-105 cursor-pointer">
                <p className="text-4xl font-black text-green-600 group-hover:text-green-700 transition">24/7</p>
                <p className="text-sm text-gray-700 font-bold mt-2">Available</p>
              </div>
            </div>

            {/* CTA Buttons */}
            
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-8 mt-20 pt-20 border-t border-gray-200">
            {[
              { icon: '🏥', title: 'Hospital Dashboard', desc: 'Real-time operations and monitoring' },
              { icon: '👨‍⚕️', title: 'Multi-Role Support', desc: '6+ specialized roles & workflows' },
              { icon: '🤖', title: 'AI-Powered', desc: 'Intelligent automation & insights' },
              { icon: '🔐', title: 'Secure & Compliant', desc: 'HIPAA certified & bank-level encryption' },
            ].map((item, i) => (
              <div key={i} className="group flex gap-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 hover:border-emerald-400 hover:shadow-lg transition">
                <span className="text-4xl group-hover:scale-110 transition flex-shrink-0">{item.icon}</span>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-emerald-600 transition">{item.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ABOUT & OVERVIEW SECTION */}
      <section className="py-32 bg-gradient-to-b from-white via-green-50 to-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-6">
            <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold">Why Choose Us</div>
            <h2 className="text-6xl font-black text-gray-900">Why SNH Medsync Leads Healthcare</h2>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              The most comprehensive AI-powered hospital management platform designed for modern healthcare delivery
            </p>
          </div>

          {/* Mission & Vision Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            <div className="group relative bg-gradient-to-br from-green-600 to-emerald-700 p-10 rounded-3xl text-white shadow-2xl hover:shadow-3xl transition transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 rounded-3xl transition"></div>
              <div className="relative">
                <span className="text-5xl">🎯</span>
                <h3 className="text-3xl font-bold mt-4 mb-4">Our Mission</h3>
                <p className="text-lg leading-relaxed text-green-50">
                  Transform healthcare delivery by providing hospitals with cutting-edge AI-powered tools that streamline operations, enhance patient care, and enable healthcare professionals to save more lives.
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-emerald-600 to-teal-700 p-10 rounded-3xl text-white shadow-2xl hover:shadow-3xl transition transform hover:-translate-y-2">
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 rounded-3xl transition"></div>
              <div className="relative">
                <span className="text-5xl">💡</span>
                <h3 className="text-3xl font-bold mt-4 mb-4">Our Vision</h3>
                <p className="text-lg leading-relaxed text-emerald-50">
                  Create an integrated ecosystem where doctors, nurses, patients, and administrators work seamlessly together, supported by intelligent systems that reduce friction and maximize efficiency.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '👨‍⚕️', number: stats.doctors, label: 'Professional Doctors', desc: 'Specialized experts' },
              { icon: '👩‍⚕️', number: stats.nurses, label: 'Skilled Nurses', desc: '24/7 care support' },
              { icon: '🏢', number: stats.departments, label: 'Departments', desc: 'Full coverage' },
              { icon: '💊', number: stats.pharmacists, label: 'Pharmacists', desc: 'Medicine experts' },
            ].map((stat, i) => (
              <div key={i} className="group bg-white p-8 rounded-2xl border-2 border-green-200 shadow-lg hover:shadow-2xl hover:border-green-500 transition transform hover:-translate-y-1">
                <div className="text-5xl mb-4 group-hover:scale-110 transition">{stat.icon}</div>
                <p className="text-4xl font-black text-green-600 mb-2">{stat.number}+</p>
                <p className="font-bold text-gray-800 mb-1">{stat.label}</p>
                <p className="text-sm text-gray-500">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPREHENSIVE FEATURES SECTION */}
      <section className="py-32 bg-gradient-to-b from-white to-emerald-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-6">
            <div className="inline-block bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold">🚀 Powerful Features</div>
            <h2 className="text-6xl font-black text-gray-900">Advanced Features & Capabilities</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Everything you need to run a modern hospital efficiently</p>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "🤖 AI-Powered System",
                desc: "Intelligent automation for diagnosis assistance, treatment recommendations, and predictive analytics.",
                details: ["Smart diagnostics", "Predictive analytics", "ML-based insights"],
                gradient: "from-green-500 to-emerald-600"
              },
              {
                title: "🏥 Department Management",
                desc: "Organize and manage multiple departments with dedicated workflows and specialized tools.",
                details: ["Workflow automation", "Staff scheduling", "Resource allocation"],
                gradient: "from-emerald-500 to-teal-600"
              },
              {
                title: "⭐ Doctor Ratings",
                desc: "Patient feedback system enabling quality assessment and continuous improvement.",
                details: ["Patient ratings", "Performance tracking", "Quality metrics"],
                gradient: "from-teal-500 to-cyan-600"
              },
              {
                title: "📅 Online Appointments",
                desc: "Seamless appointment booking with real-time availability and automated confirmations.",
                details: ["Real-time scheduling", "Auto reminders", "Cancellation mgmt"],
                gradient: "from-green-600 to-green-700"
              },
              {
                title: "🔐 Secure Records",
                desc: "HIPAA-compliant secure storage with encrypted access control for sensitive data.",
                details: ["End-to-end encryption", "Access logs", "Data privacy"],
                gradient: "from-emerald-600 to-emerald-700"
              },
              {
                title: "💰 Finance & Billing",
                desc: "Complete billing management system with invoices, payment tracking, and reports.",
                details: ["Invoice management", "Payment tracking", "Financial reports"],
                gradient: "from-teal-600 to-teal-700"
              },
              {
                title: "💊 Pharmacy Management",
                desc: "Medicine inventory system with stock tracking and automated requisitions.",
                details: ["Stock management", "Requisitions", "Expiry tracking"],
                gradient: "from-cyan-500 to-blue-600"
              },
              {
                title: "👥 Staff Coordination",
                desc: "Unified platform for staff communication, scheduling, and collaborative care.",
                details: ["Team messaging", "Shift planning", "Task assignment"],
                gradient: "from-blue-500 to-indigo-600"
              },
              {
                title: "📊 Analytics Dashboard",
                desc: "Real-time insights into hospital operations with customizable reports.",
                details: ["Real-time metrics", "Custom reports", "Trend analysis"],
                gradient: "from-indigo-500 to-purple-600"
              },
            ].map((feature, i) => (
              <div key={i} className="group relative bg-white p-8 rounded-2xl border border-gray-200 shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2 cursor-pointer">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition`}></div>
                <div className="relative">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition">{feature.title}</h3>
                  <p className="text-gray-600 mb-5 leading-relaxed">{feature.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {feature.details.map((detail, j) => (
                      <span key={j} className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full border border-green-200">
                        {detail}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USER ROLES SECTION */}
      <section className="py-32 bg-gradient-to-b from-white via-teal-50 to-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-6">
            <div className="inline-block bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-sm font-bold">👥 For Everyone</div>
            <h2 className="text-6xl font-black text-gray-900">Built for Every Role</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Specialized dashboards tailored to each healthcare professional</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                role: "👨‍⚕️ Doctors",
                color: "from-blue-500 to-cyan-600",
                desc: "Manage appointments, view medical history, prescribe medications, and receive AI-assisted diagnostics.",
                features: ["Appointment management", "Patient history", "Prescription system", "AI diagnostics"]
              },
              {
                role: "👩‍⚕️ Nurses",
                color: "from-pink-500 to-rose-600",
                desc: "Track patient vitals, manage medications, document encounters, and coordinate care.",
                features: ["Vital tracking", "Medication management", "Patient encounters", "Team coordination"]
              },
              {
                role: "👔 Receptionist",
                color: "from-amber-500 to-orange-600",
                desc: "Handle appointments, manage registrations, maintain schedules, and facilitate check-ins.",
                features: ["Appointment booking", "Patient registration", "Schedule management", "Check-in system"]
              },
              {
                role: "💼 Admin",
                color: "from-purple-500 to-indigo-600",
                desc: "Oversee operations, manage staff, monitor departments, and access comprehensive analytics.",
                features: ["Staff management", "Department oversight", "Analytics dashboard", "System config"]
              },
              {
                role: "💊 Pharmacist",
                color: "from-green-500 to-emerald-600",
                desc: "Manage inventory, process prescriptions, track stock levels, and ensure availability.",
                features: ["Inventory management", "Prescription processing", "Stock tracking", "Supply ordering"]
              },
              {
                role: "💰 Finance",
                color: "from-lime-500 to-green-600",
                desc: "Process payments, generate invoices, track finances, and generate reports.",
                features: ["Payment processing", "Invoice generation", "Financial tracking", "Report generation"]
              },
            ].map((item, i) => (
              <div key={i} className={`group relative bg-gradient-to-br ${item.color} p-8 rounded-2xl text-white shadow-xl hover:shadow-2xl transition transform hover:-translate-y-2 cursor-pointer`}>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-2xl transition"></div>
                <div className="relative">
                  <h3 className="text-2xl font-bold mb-3">{item.role}</h3>
                  <p className="text-white/90 mb-6 leading-relaxed">{item.desc}</p>
                  <div className="space-y-2 bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                    {item.features.map((feature, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <span className="text-lg">✓</span>
                        <span className="text-sm font-semibold">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECHNOLOGY STACK */}
      <section className="py-32 bg-gradient-to-b from-white to-purple-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-6">
            <div className="inline-block bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-bold">⚙️ Modern Stack</div>
            <h2 className="text-6xl font-black text-gray-900">Enterprise Technology Stack</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Built with the latest and most reliable technologies</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group relative bg-gradient-to-br from-slate-50 to-slate-100 p-10 rounded-2xl border border-slate-200 hover:border-slate-400 hover:shadow-xl transition transform hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-400 opacity-10 rounded-full blur-2xl"></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8 relative">Frontend</h3>
              <ul className="space-y-4 relative">
                <li className="flex items-center gap-4 p-3 hover:bg-white/50 rounded-lg transition">
                  <span className="text-3xl">⚛️</span>
                  <div>
                    <p className="font-bold text-gray-900">Next.js 15+</p>
                    <p className="text-xs text-gray-600">App Router</p>
                  </div>
                </li>
                <li className="flex items-center gap-4 p-3 hover:bg-white/50 rounded-lg transition">
                  <span className="text-3xl">🎨</span>
                  <div>
                    <p className="font-bold text-gray-900">Tailwind CSS</p>
                    <p className="text-xs text-gray-600">Modern styling</p>
                  </div>
                </li>
                <li className="flex items-center gap-4 p-3 hover:bg-white/50 rounded-lg transition">
                  <span className="text-3xl">🔐</span>
                  <div>
                    <p className="font-bold text-gray-900">Clerk Auth</p>
                    <p className="text-xs text-gray-600">Secure authentication</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 p-10 rounded-2xl border border-emerald-200 hover:border-emerald-400 hover:shadow-xl transition transform hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-400 opacity-10 rounded-full blur-2xl"></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8 relative">Backend</h3>
              <ul className="space-y-4 relative">
                <li className="flex items-center gap-4 p-3 hover:bg-white/50 rounded-lg transition">
                  <span className="text-3xl">🚀</span>
                  <div>
                    <p className="font-bold text-gray-900">Next.js APIs</p>
                    <p className="text-xs text-gray-600">Powerful routes</p>
                  </div>
                </li>
                <li className="flex items-center gap-4 p-3 hover:bg-white/50 rounded-lg transition">
                  <span className="text-3xl">📦</span>
                  <div>
                    <p className="font-bold text-gray-900">Mysql2</p>
                    <p className="text-xs text-gray-600">Database layer</p>
                  </div>
                </li>
                <li className="flex items-center gap-4 p-3 hover:bg-white/50 rounded-lg transition">
                  <span className="text-3xl">🔄</span>
                  <div>
                    <p className="font-bold text-gray-900">RESTful APIs</p>
                    <p className="text-xs text-gray-600">Clean architecture</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="group relative bg-gradient-to-br from-purple-50 to-pink-50 p-10 rounded-2xl border border-purple-200 hover:border-purple-400 hover:shadow-xl transition transform hover:-translate-y-2">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 opacity-10 rounded-full blur-2xl"></div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8 relative">Database & AI</h3>
              <ul className="space-y-4 relative">
                <li className="flex items-center gap-4 p-3 hover:bg-white/50 rounded-lg transition">
                  <span className="text-3xl">🗄️</span>
                  <div>
                    <p className="font-bold text-gray-900">MYSQL</p>
                    <p className="text-xs text-gray-600">Reliable database</p>
                  </div>
                </li>
                <li className="flex items-center gap-4 p-3 hover:bg-white/50 rounded-lg transition">
                  <span className="text-3xl">🤖</span>
                  <div>
                    <p className="font-bold text-gray-900">AI Integration</p>
                    <p className="text-xs text-gray-600">Smart features</p>
                  </div>
                </li>
                <li className="flex items-center gap-4 p-3 hover:bg-white/50 rounded-lg transition">
                  <span className="text-3xl">☁️</span>
                  <div>
                    <p className="font-bold text-gray-900">Cloud Ready</p>
                    <p className="text-xs text-gray-600">Scalable deployment</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>


      {/* BENEFITS SECTION */}
      <section className="py-32 bg-gradient-to-b from-green-600 via-emerald-600 to-teal-600 text-white px-6 relative overflow-hidden">
        {/* Animated Background Shapes */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20 space-y-6">
            <h2 className="text-6xl font-black">Why Choose SNH Medsync?</h2>
            <p className="text-xl text-green-100 max-w-2xl mx-auto">Industry-leading benefits that transform healthcare delivery</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "⚡ Increased Efficiency",
                desc: "Reduce administrative burden by 60% with automated workflows and intelligent task management."
              },
              {
                title: "👥 Better Collaboration",
                desc: "Enable seamless communication between all hospital departments with integrated messaging."
              },
              {
                title: "📈 Improved Patient Care",
                desc: "Enhance patient outcomes through data-driven decisions and personalized treatment recommendations."
              },
              {
                title: "💰 Cost Optimization",
                desc: "Minimize operational costs and maximize resource utilization with advanced analytics."
              },
              {
                title: "📊 Real-Time Analytics",
                desc: "Access comprehensive dashboards with real-time insights into hospital operations."
              },
              {
                title: "24/7 Support",
                desc: "Round-the-clock technical support and regular updates ensure optimal system performance."
              },
            ].map((benefit, i) => (
              <div key={i} className="group bg-white/15 backdrop-blur-md p-8 rounded-2xl border border-white/30 hover:bg-white/25 hover:border-white/50 transition transform hover:-translate-y-1 cursor-pointer">
                <h3 className="text-2xl font-bold mb-3 group-hover:text-green-100 transition">{benefit.title}</h3>
                <p className="text-green-50 leading-relaxed">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROJECT HIGHLIGHTS */}
      <section className="py-32 bg-gradient-to-b from-white to-green-50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-6">
            <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold">🎯 Project Highlights</div>
            <h2 className="text-6xl font-black text-gray-900">Core Strengths</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">What makes SNH Medsync the leading hospital management platform</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Left Column */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-green-600 mb-8">🎯 Core Capabilities</h3>
              {[
                { icon: '✨', title: 'Multi-Role Auth', desc: 'Secure role-based access control for 6+ user types' },
                { icon: '📱', title: 'Responsive Design', desc: 'Works seamlessly on all devices and screen sizes' },
                { icon: '⚙️', title: 'Smart Automation', desc: 'Automated workflows for hospital operations' },
                { icon: '📞', title: 'Real-Time Alerts', desc: 'Instant notifications for critical updates' },
              ].map((item, i) => (
                <div key={i} className="group flex gap-4 p-6 bg-white rounded-xl border border-green-100 hover:border-green-400 hover:shadow-lg transition transform hover:-translate-x-1 cursor-pointer">
                  <div className="text-4xl group-hover:scale-110 transition flex-shrink-0">{item.icon}</div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-emerald-600 mb-8">🚀 Advanced Features</h3>
              {[
                { icon: '🤖', title: 'AI Integration', desc: 'Machine learning for diagnosis and recommendations' },
                { icon: '📊', title: 'Data Analytics', desc: 'Comprehensive reports and performance insights' },
                { icon: '🔄', title: 'Integration Ready', desc: 'APIs for connecting external medical devices' },
                { icon: '📈', title: 'Predictive Analytics', desc: 'AI-powered forecasting for patient outcomes' },
              ].map((item, i) => (
                <div key={i} className="group flex gap-4 p-6 bg-white rounded-xl border border-emerald-100 hover:border-emerald-400 hover:shadow-lg transition transform hover:-translate-x-1 cursor-pointer">
                  <div className="text-4xl group-hover:scale-110 transition flex-shrink-0">{item.icon}</div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* CALL TO ACTION - PREMIUM SECTION */}
      <section className="py-40 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white relative overflow-hidden px-6">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-pulse" style={{animationDelay: '4s'}}></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="space-y-8 mb-16">
            <h2 className="text-7xl font-black leading-tight">
              Ready to Transform Your Hospital?
            </h2>
            <p className="text-2xl text-green-100 leading-relaxed">
              Join hundreds of healthcare facilities delivering better patient care with SNH Medsync
            </p>
          </div>

          <div className="flex justify-center gap-6 flex-wrap mb-16">
            <Link href="/sign-up" className="bg-white text-green-700 px-12 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:scale-105 transition transform shadow-xl">
              🚀 Get Started Free
            </Link>
            <Link href="/sign-in" className="border-2 border-white text-white px-12 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition">
              Login to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER - HOSPITAL DATA */}
      <footer className="relative bg-gradient-to-b from-gray-950 via-gray-900 to-black text-gray-300 py-24 px-6 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500 rounded-full mix-blend-screen filter blur-3xl opacity-5"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-emerald-500 rounded-full mix-blend-screen filter blur-3xl opacity-5"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Top Section - Hospital Info */}
          <div className="mb-16 pb-16 border-b border-gray-800">
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🏥</span>
                  <div>
                    <h2 className="text-3xl font-black text-white">SNH Medsync Hospital</h2>
                    <p className="text-sm text-emerald-400 font-semibold">Smart Care. Seamless Sync. Better Outcomes.</p>
                  </div>
                </div>
                <div className="space-y-3 text-gray-300">
                  <p className="font-semibold">📍 Location</p>
                  <p className="text-sm">Metropolitan Medical Complex, Healthcare Avenue<br/>City, State 12345 • United States</p>
                  
                  <p className="font-semibold mt-4">📞 Contact Information</p>
                  <p className="text-sm">Main Reception: <span className="text-emerald-400 font-semibold">+1 (555) 123-4567</span></p>
                  <p className="text-sm">Emergency: <span className="text-red-400 font-semibold">+1 (555) 911-EMER (3376)</span></p>
                  <p className="text-sm">Email: <span className="text-emerald-400 font-semibold">info@snhmedsync.com</span></p>

                  <p className="font-semibold mt-4">🕐 Operating Hours</p>
                  <p className="text-sm">Emergency Department: <span className="text-emerald-400">24/7 Available</span></p>
                  <p className="text-sm">General Services: <span className="text-emerald-400">7:00 AM - 11:00 PM</span></p>
                </div>
              </div>

              {/* Newsletter & Quick Stats */}
              <div className="space-y-6">

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-emerald-500/20 p-4 rounded-lg text-center hover:border-emerald-500/50 transition">
                    <p className="text-2xl font-black text-emerald-400">{stats.doctors}+</p>
                    <p className="text-xs text-gray-400 font-medium mt-1">Expert Doctors</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-cyan-500/20 p-4 rounded-lg text-center hover:border-cyan-500/50 transition">
                    <p className="text-2xl font-black text-cyan-400">{stats.departments}+</p>
                    <p className="text-xs text-gray-400 font-medium mt-1">Departments</p>
                  </div>
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-green-500/20 p-4 rounded-lg text-center hover:border-green-500/50 transition">
                    <p className="text-2xl font-black text-green-400">7</p>
                    <p className="text-xs text-gray-400 font-medium mt-1">Roles</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Departments Section */}
          <div className="grid md:grid-cols-4 gap-8 mb-16 pb-16 border-b border-gray-800">
            <div>
              <h4 className="text-white text-lg font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-8 bg-gradient-to-b from-emerald-500 to-green-500 rounded-full"></span>
                Departments
              </h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition font-medium text-sm">🫀 Cardiology</a></li>
                <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition font-medium text-sm">🧠 Neurology</a></li>
                <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition font-medium text-sm">🏥 General Surgery</a></li>
                <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition font-medium text-sm">👶 Pediatrics</a></li>
                <li><a href="#" className="text-gray-400 hover:text-emerald-400 transition font-medium text-sm">🎂 Geriatrics</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-lg font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-teal-500 rounded-full"></span>
                Specialties
              </h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition font-medium text-sm">🦴 Orthopedics</a></li>
                <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition font-medium text-sm">👁️ Ophthalmology</a></li>
                <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition font-medium text-sm">🦷 Dentistry</a></li>
                <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition font-medium text-sm">🫁 Pulmonology</a></li>
                <li><a href="#" className="text-gray-400 hover:text-cyan-400 transition font-medium text-sm">🔬 Oncology</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-lg font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-8 bg-gradient-to-b from-teal-500 to-blue-500 rounded-full"></span>
                Services
              </h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-teal-400 transition font-medium text-sm">🚑 Emergency Care</a></li>
                <li><a href="#" className="text-gray-400 hover:text-teal-400 transition font-medium text-sm">🏥 ICU Services</a></li>
                <li><a href="#" className="text-gray-400 hover:text-teal-400 transition font-medium text-sm">💊 Pharmacy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-teal-400 transition font-medium text-sm">🔬 Diagnostics</a></li>
                <li><a href="#" className="text-gray-400 hover:text-teal-400 transition font-medium text-sm">🏥 Admission</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-lg font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
                Resources
              </h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition font-medium text-sm">📋 Patient Forms</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition font-medium text-sm">🏷️ Insurance Info</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition font-medium text-sm">📍 Directions</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition font-medium text-sm">👥 Staff Directory</a></li>
                <li><a href="#" className="text-gray-400 hover:text-blue-400 transition font-medium text-sm">📚 Health Library</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-center md:text-left">
                <p className="text-gray-300 font-semibold">© 2026 SNH Medsync Hospital Management System. All rights reserved.</p>
                <p className="text-gray-500 text-sm mt-2">Delivering Excellence in Healthcare | AI-Powered Hospital Solutions</p>
              </div>
            </div>

           
          </div>
        </div>
      </footer>
    </div>
  );
}