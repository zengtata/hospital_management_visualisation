export interface Patient {
  patient_id: string;
  name: string;
  age: number;
  arrival_date: string;
  departure_date: string;
  service: "emergency" | "surgery" | "general_medicine" | "ICU";
  satisfaction: number;
}

export interface Staff {
  staff_id: string;
  staff_name: string;
  role: string;
  service: string;
}

export interface ServiceMetric {
  week: number;
  month: number;
  service: string;
  available_beds: number;
  patients_request: number;
  patients_admitted: number;
  patients_refused: number;
  patient_satisfaction: number; // This is the aggregated weekly score
  staff_morale: number;
  event: string | null;
}

export interface DashboardStats {
  total_patients: number;
  avg_satisfaction: number;
  total_admitted: number;
  avg_staff_morale: number;
}