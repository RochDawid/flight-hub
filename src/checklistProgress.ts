import type { AircraftProfile, FlightPhase } from "./types";

export type ChecklistSession = {
  completed: Record<string, boolean>;
  activePhaseId: string;
  updatedAt?: string;
};

export function createSession(profile: AircraftProfile): ChecklistSession {
  return {
    completed: {},
    activePhaseId: profile.phases[0]?.id ?? "",
  };
}

export function getAllItemIds(aircraft: AircraftProfile): string[] {
  return aircraft.phases.flatMap((phase) => phase.items.map((item) => item.id));
}

export function getPhaseCompletion(
  phase: FlightPhase,
  completed: Record<string, boolean>,
) {
  const done = phase.items.filter((item) => completed[item.id]).length;

  return {
    done,
    total: phase.items.length,
    ratio: phase.items.length === 0 ? 0 : done / phase.items.length,
  };
}

export function getNextIncompletePhase(
  profile: AircraftProfile,
  session: ChecklistSession,
): FlightPhase | undefined {
  return (
    profile.phases.find(
      (phase) =>
        getPhaseCompletion(phase, session.completed).done < phase.items.length,
    ) ?? profile.phases[profile.phases.length - 1]
  );
}

export function getSessionReadyForChecklistOpen(
  profile: AircraftProfile,
  session: ChecklistSession,
): ChecklistSession {
  const nextPhase = getNextIncompletePhase(profile, session);

  if (!nextPhase || session.activePhaseId === nextPhase.id) {
    return session;
  }

  return {
    ...session,
    activePhaseId: nextPhase.id,
  };
}

export function getProfileProgress(
  profile: AircraftProfile,
  session: ChecklistSession,
) {
  const allItemIds = getAllItemIds(profile);
  const completedCount = allItemIds.filter((id) => session.completed[id]).length;
  const totalCount = allItemIds.length;
  const overallPercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const nextPhase = getNextIncompletePhase(profile, session);

  return {
    completedCount,
    nextPhaseTitle: nextPhase?.title ?? "Complete",
    overallPercent,
    totalCount,
  };
}
