"use client";

import React, { useState, useEffect } from 'react';
import { Activity, Plus, LayoutDashboard } from 'lucide-react';
import { fetchServiceMetrics, fetchPatients, fetchStaffSchedule } from '@/lib/api';
import HospitalOperationsContainer from '@/components/HospitalOperationsContainer';

export default function HospitalDashboard() {
  const [loading, setLoading] = useState(true);

  // Data Stores
  const [serviceData, setServiceData] = useState([]);
  const [patientData, setPatientData] = useState([]);
  const [staffData, setStaffData] = useState([]);

  // Manage multiple views
  const [views, setViews] = useState([1]);

  useEffect(() => {
    async function loadAllData() {
      try {
        // Parallel fetching for speed
        const [services, patients, staff] = await Promise.all([
          fetchServiceMetrics(),
          fetchPatients(),
          fetchStaffSchedule()
        ]);

        setServiceData(services);
        setPatientData(patients);
        setStaffData(staff);
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, []);

  const addView = () => {
    const newId = views.length > 0 ? Math.max(...views) + 1 : 1;
    setViews([...views, newId]);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-500 gap-4">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-medium animate-pulse">Synchronizing Hospital Data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">

      {/* GLOBAL HEADER */}
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <p className="text-4xl font-extrabold text-slate-900 flex items-center gap-3">
            <LayoutDashboard className="text-blue-600 w-10 h-10" />
            Executive Command Center
          </p>
          <p className="text-slate-500 mt-2 text-lg">
            Real-time analysis of hospital throughput, capacity, and human resources.
          </p>
        </div>

        <button
          onClick={addView}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-slate-900/20 transition-all hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          New Operational View
        </button>
      </header>

      {/* RENDER DYNAMIC CONTAINERS */}
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {views.map((id) => (
          <HospitalOperationsContainer
            key={id}
            id={id}
            serviceData={serviceData}
            patientData={patientData}
            staffScheduleData={staffData}
          />
        ))}
      </div>

    </div>
  );
}