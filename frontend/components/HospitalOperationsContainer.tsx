"use client";

import React, { useState, useMemo } from 'react';
import {
  ComposedChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea
} from 'recharts';
import {
  Activity, Users, Bed, Calendar, Stethoscope, User, Clock, Eye, EyeOff, GripHorizontal, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";

interface Props {
  id: number;
  serviceData: any[];
  patientData: any[];
  staffScheduleData: any[];
}

// 1. DEFINE COLORS FOR EVENTS
const EVENT_COLORS: Record<string, string> = {
  'flu': '#fee2e2',        // Red
  'donation': '#dcfce7',   // Green
  'strike': '#ffedd5',     // Orange
  'default': '#f1f5f9'     // Grey
};

export default function HospitalOperationsContainer({ id, serviceData, patientData, staffScheduleData }: Props) {
  // --- STATE ---
  const [dateRange, setDateRange] = useState([1, 52]);
  const [selectedService, setSelectedService] = useState<string>('all');

  // Visibility State
  const [visibleMetrics, setVisibleMetrics] = useState({
    capacity: true,
    admitted: true,
    refused: true
  });

  // --- HELPER: DATE TO WEEK CONVERSION ---
  // Calculates specific week number for 2025 to filter patients accurately
  const getWeekNumber = (dateString: string) => {
    if (!dateString) return -1;
    const date = new Date(dateString);
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const day = Math.floor(diff / oneDay);
    return Math.ceil((day + 1) / 7);
  };

  const calculateLOS = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // --- DATA PROCESSING ---
  const graphData = useMemo(() => {
    // 1. Filter by Service
    const filtered = serviceData.filter(d =>
      selectedService === 'all' || d.service === selectedService
    );

    // 2. Aggregate by Week
    const aggregated = filtered.reduce((acc: any[], curr) => {
      const existing = acc.find((i: any) => i.week === curr.week);
      if (existing) {
        existing.patients_admitted += curr.patients_admitted;
        existing.available_beds += curr.available_beds;
        existing.patients_refused += curr.patients_refused;
        existing.patient_satisfaction_sum += curr.patient_satisfaction;
        existing.staff_morale_sum += curr.staff_morale;
        existing.count += 1;
        if (curr.event && curr.event !== 'none') existing.event = curr.event;
      } else {
        acc.push({
          ...curr,
          patient_satisfaction_sum: curr.patient_satisfaction,
          staff_morale_sum: curr.staff_morale,
          count: 1
        });
      }
      return acc;
    }, []);

    // 3. Finalize Data
    return aggregated.map((item: any) => {
      const staffInWeek = staffScheduleData.filter(s =>
        s.week === item.week &&
        (selectedService === 'all' || s.service === selectedService) &&
        s.present === 1
      );

      const doctors = staffInWeek.filter((s: any) => s.role === 'doctor').length;
      const nurses = staffInWeek.filter((s: any) => s.role === 'nurse').length;

      return {
        ...item,
        patient_satisfaction: Math.round(item.patient_satisfaction_sum / item.count),
        staff_morale: Math.round(item.staff_morale_sum / item.count),
        doctor_count: doctors,
        nurse_count: nurses,
        active_patient_count: item.patients_admitted
      };
    })
    .sort((a: any, b: any) => a.week - b.week)
    .filter((item: any) => item.week >= dateRange[0] && item.week <= dateRange[1]);

  }, [serviceData, staffScheduleData, selectedService, dateRange]);


  // --- DETAIL LIST PROCESSING ---
  const details = useMemo(() => {
    // Filter Staff: Must be present in the selected week range
    const staff = staffScheduleData.filter(s =>
      s.week >= dateRange[0] && s.week <= dateRange[1] &&
      (selectedService === 'all' || s.service === selectedService) &&
      s.present === 1
    );

    // Filter Patients: Stay must OVERLAP with selected date range
    const patients = patientData.filter(p => {
        if (selectedService !== 'all' && p.service !== selectedService) return false;

        const arrivalWeek = getWeekNumber(p.arrival_date);
        const departureWeek = getWeekNumber(p.departure_date);

        // Check overlap logic: (StartA <= EndB) and (EndA >= StartB)
        const overlaps = arrivalWeek <= dateRange[1] && departureWeek >= dateRange[0];

        return overlaps;
    }); // We remove slice here to show all relevant patients, or keep a high limit

    return { staff, patients };
  }, [dateRange, selectedService, staffScheduleData, patientData]);

  // --- HANDLER ---
  const toggleMetric = (key: keyof typeof visibleMetrics) => {
    setVisibleMetrics(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="w-full space-y-6 p-6 bg-slate-50/50 rounded-xl border border-slate-200 shadow-sm">

      {/* --- HEADER --- */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Activity className="text-blue-600 w-5 h-5" />
            Operational View #{id}
          </h2>
          <p className="text-slate-400 text-xs font-medium">
             Analyzing <span className="text-slate-600 font-bold">Week {dateRange[0]} - {dateRange[1]}</span> • {selectedService === 'all' ? 'All Services' : selectedService}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-center w-full xl:w-auto">
          {/* Slider Control */}
          <div className="w-full md:w-64 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
             <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
               <span>Wk {dateRange[0]}</span>
               <span>Wk {dateRange[1]}</span>
             </div>
             <Slider
               defaultValue={[1, 52]}
               min={1}
               max={52}
               step={1}
               value={dateRange}
               onValueChange={setDateRange}
               className="py-1"
             />
          </div>

          {/* Service Filter Buttons */}
          <div className="flex flex-wrap bg-slate-100 p-1 rounded-lg">
            {['all', 'emergency', 'surgery', 'ICU', 'general_medicine'].map(s => (
              <button
                key={s}
                onClick={() => setSelectedService(s)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                  selectedService === s 
                  ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* --- LEFT COLUMN: CHARTS --- */}
        <div className="xl:col-span-2 space-y-6">

          {/* CHART 1: BED CAPACITY */}
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="py-3 px-5 border-b border-slate-50 flex flex-row items-center justify-between bg-white">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Bed className="w-4 h-4 text-blue-500" /> Bed Capacity
              </CardTitle>

              <div className="flex gap-2">
                <Toggle pressed={visibleMetrics.capacity} onPressedChange={() => toggleMetric('capacity')} size="sm" className="h-6 px-2 text-[10px] font-medium gap-1.5 rounded-full data-[state=on]:bg-blue-50 data-[state=on]:text-blue-700 data-[state=on]:border-blue-100 border border-transparent">
                  {visibleMetrics.capacity ? <Eye className="w-3 h-3"/> : <EyeOff className="w-3 h-3"/>} Cap
                </Toggle>
                <Toggle pressed={visibleMetrics.admitted} onPressedChange={() => toggleMetric('admitted')} size="sm" className="h-6 px-2 text-[10px] font-medium gap-1.5 rounded-full data-[state=on]:bg-blue-50 data-[state=on]:text-blue-700 data-[state=on]:border-blue-100 border border-transparent">
                  {visibleMetrics.admitted ? <Eye className="w-3 h-3"/> : <EyeOff className="w-3 h-3"/>} Adm
                </Toggle>
                <Toggle pressed={visibleMetrics.refused} onPressedChange={() => toggleMetric('refused')} size="sm" className="h-6 px-2 text-[10px] font-medium gap-1.5 rounded-full data-[state=on]:bg-red-50 data-[state=on]:text-red-700 data-[state=on]:border-red-100 border border-transparent">
                  {visibleMetrics.refused ? <Eye className="w-3 h-3"/> : <EyeOff className="w-3 h-3"/>} Ref
                </Toggle>
              </div>
            </CardHeader>
            <CardContent className="h-[350px] p-0 bg-white">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={graphData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="capacityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>

                  {/* BACKGROUND EVENTS */}
                  {graphData.map((d: any) => {
                     if (!d.event || d.event === 'none') return null;
                     const color = EVENT_COLORS[d.event.toLowerCase()] || EVENT_COLORS.default;
                     return (
                       <ReferenceArea
                          key={`event-${d.week}`}
                          x1={d.week}
                          x2={d.week}
                          y1={0}
                          y2="auto"
                          fill={color}
                          fillOpacity={0.6}
                          ifOverflow="extendDomain"
                       />
                     );
                  })}

                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="week"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tickCount={dateRange[1]-dateRange[0]+1}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px', paddingBottom: '10px' }} />

                  {visibleMetrics.capacity && (
                    <Area type="monotone" dataKey="available_beds" fill="url(#capacityFill)" stroke="#3b82f6" strokeWidth={2} name="Capacity" activeDot={{ r: 4, strokeWidth: 0 }} />
                  )}
                  {visibleMetrics.admitted && (
                    <Bar dataKey="patients_admitted" stackId="a" fill="#93c5fd" name="Admitted" barSize={12} radius={[0,0,2,2]} />
                  )}
                  {visibleMetrics.refused && (
                    <Bar dataKey="patients_refused" stackId="a" fill="#fca5a5" name="Refused" barSize={12} radius={[2,2,0,0]} />
                  )}
                  <Line yAxisId="right" type="monotone" dataKey="patient_satisfaction" stroke="#10b981" strokeWidth={2} dot={false} name="Pat. Sat." />
                  <Line yAxisId="right" type="monotone" dataKey="staff_morale" stroke="#f59e0b" strokeWidth={2} dot={false} name="Staff Morale" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* CHART 2: STAFF & PATIENT MORALE */}
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardHeader className="py-3 px-5 border-b border-slate-50 bg-white">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" /> Staffing & Morale Trends
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] p-0 bg-white">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={graphData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                  />

                  {/* Left Axis: Counts */}
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />

                  {/* Right Axis: Scores */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />

                  <Tooltip cursor={{ fill: '#f8fafc' }} content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px', paddingBottom: '10px' }} />

                  <Bar yAxisId="left" dataKey="active_patient_count" fill="#e2e8f0" name="Pat. Vol" barSize={24} radius={[4,4,0,0]} />
                  <Bar yAxisId="left" dataKey="doctor_count" stackId="staff" fill="#6366f1" name="Doctors" barSize={24} />
                  <Bar yAxisId="left" dataKey="nurse_count" stackId="staff" fill="#a5b4fc" name="Nurses" barSize={24} radius={[4,4,0,0]} />

                  <Line yAxisId="right" type="monotone" dataKey="patient_satisfaction" stroke="#10b981" strokeWidth={2} dot={false} name="Pat. Sat." />
                  <Line yAxisId="right" type="monotone" dataKey="staff_morale" stroke="#f59e0b" strokeWidth={2} dot={false} name="Staff Morale" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* --- RIGHT COLUMN: DETAILS LIST --- */}
        <div className="xl:col-span-1 h-full">
          <Card className="h-full border-slate-200 flex flex-col overflow-hidden shadow-sm bg-white">
            <div className="bg-slate-50/80 p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-blue-500" />
                Detail Breakdown
              </h3>
              <div className="flex gap-2 mt-3">
                <Badge variant="outline" className="bg-white text-slate-500 font-normal px-2.5 py-1">
                  {details.staff.length} Staff Shifts
                </Badge>
                <Badge variant="outline" className="bg-white text-slate-500 font-normal px-2.5 py-1">
                  {details.patients.length} Active Patients
                </Badge>
              </div>
            </div>

            <Tabs defaultValue="patients" className="flex-1 flex flex-col overflow-hidden">
              <div className="px-5 pt-3 bg-slate-50/80 border-b border-slate-100">
                <TabsList className="w-full bg-slate-200/50 p-1">
                  <TabsTrigger value="patients" className="flex-1 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Patients</TabsTrigger>
                  <TabsTrigger value="staff" className="flex-1 text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Staff</TabsTrigger>
                </TabsList>
              </div>

              {/* Flex-1 ensures it takes remaining height, avoiding overflow or double scrollbars */}
              <TabsContent value="patients" className="flex-1 p-0 m-0 overflow-hidden relative">
                <ScrollArea className="h-[700px] xl:h-[650px] w-full">
                   <div className="divide-y divide-slate-100">
                     {details.patients.map((p: any, idx: number) => {
                       const los = calculateLOS(p.arrival_date, p.departure_date);
                       return (
                         <div key={idx} className="p-4 hover:bg-slate-50 transition-colors group">
                           <div className="flex justify-between items-start mb-1">
                              <div>
                                  <p className="text-sm font-bold text-slate-700">{p.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="secondary" className="text-[10px] py-0 h-5 px-1.5 bg-slate-100 text-slate-500 capitalize font-medium border border-slate-200 shadow-none">
                                          {p.service.replace('_', ' ')}
                                      </Badge>
                                      <span className="text-[10px] text-slate-400 font-medium">{p.age} yrs</span>
                                  </div>
                              </div>
                              <div className="text-right">
                                  <span className={`text-xs font-bold ${p.satisfaction > 80 ? 'text-green-600' : 'text-amber-600'}`}>
                                      {p.satisfaction}%
                                  </span>
                                  <p className="text-[10px] text-slate-400 mt-0.5">Satisfaction</p>
                              </div>
                           </div>

                           {/* Enhanced Dates & LOS */}
                           <div className="mt-3 bg-slate-50/50 rounded border border-slate-100/50 p-2">
                               <div className="flex justify-between items-center mb-2">
                                  <div className="flex flex-col">
                                      <span className="text-[9px] uppercase tracking-wide text-slate-400 font-bold">Arrival</span>
                                      <span className="text-[10px] font-medium text-slate-600">{p.arrival_date}</span>
                                  </div>
                                  <ArrowRight className="w-3 h-3 text-slate-300" />
                                  <div className="flex flex-col text-right">
                                      <span className="text-[9px] uppercase tracking-wide text-slate-400 font-bold">Departure</span>
                                      <span className="text-[10px] font-medium text-slate-600">{p.departure_date}</span>
                                  </div>
                               </div>
                               <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
                                   <Clock className="w-3 h-3 text-blue-500" />
                                   <span className="text-[10px] font-bold text-slate-600">Length of Stay: <span className="text-blue-600">{los} Days</span></span>
                               </div>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="staff" className="flex-1 p-0 m-0 overflow-hidden relative">
                <ScrollArea className="h-[700px] xl:h-[650px] w-full">
                  <div className="divide-y divide-slate-100">
                    {details.staff.map((s: any, idx: number) => (
                      <div key={idx} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                        <div className={`w-9 h-9 flex items-center justify-center rounded-full border ${s.role === 'doctor' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-purple-50 border-purple-100 text-purple-600'}`}>
                          {s.role === 'doctor' ? <Stethoscope className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-0.5">
                            <p className="text-sm font-bold text-slate-700">{s.staff_name}</p>
                            <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Wk {s.week}</span>
                          </div>
                          <p className="text-xs text-slate-500 capitalize">{s.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Polished Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const eventName = data.event && data.event !== 'none' ? data.event : null;

    return (
      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-xl text-xs z-50 min-w-[140px]">
        <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-2">
            <p className="font-bold text-slate-800">Week {label}</p>
            {eventName && (
                 <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border border-red-100">
                    {eventName}
                 </span>
            )}
        </div>
        <div className="space-y-1.5">
          {payload.map((entry: any, idx: number) => (
            <div key={idx} className="flex justify-between gap-4 items-center">
              <span className="text-slate-500 capitalize flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-slate-700">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};