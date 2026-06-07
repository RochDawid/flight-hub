export type ChecklistItem = {
  id: string;
  action: string;
  confirmation?: string;
  note?: string;
};

export type FlightPhase = {
  id: string;
  title: string;
  summary: string;
  items: ChecklistItem[];
};

export type AircraftProfile = {
  id: string;
  name: string;
  variant: string;
  simulator: string;
  description: string;
  phases: FlightPhase[];
};
