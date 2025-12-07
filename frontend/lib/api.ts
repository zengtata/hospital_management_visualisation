const API_URL = "http://localhost:5000/api";

export async function fetchStats() {
  const res = await fetch(`${API_URL}/dashboard/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function fetchPatients() {
  const res = await fetch(`${API_URL}/patients`);
  if (!res.ok) throw new Error("Failed to fetch patients");
  return res.json();
}

export async function fetchStaffSchedule() {
  const res = await fetch(`${API_URL}/staff/schedule`);
  if (!res.ok) throw new Error("Failed to fetch staff schedule");
  return res.json();
}

export async function fetchServiceMetrics() {
  const res = await fetch(`${API_URL}/services/weekly`);
  if (!res.ok) throw new Error("Failed to fetch service metrics");
  return res.json();
}