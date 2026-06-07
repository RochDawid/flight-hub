import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  ExternalLink,
  Gauge,
  Info,
  ListChecks,
  Plane,
  RotateCcw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  aircraftProfiles,
  defaultAircraftProfile,
  findAircraftProfile,
} from "./data/profiles";
import type { AircraftProfile, FlightPhase } from "./types";

type Route =
  | {
      kind: "dashboard";
    }
  | {
      kind: "checklist";
      profileId: string;
    };

type ChecklistSession = {
  completed: Record<string, boolean>;
  activePhaseId: string;
  updatedAt?: string;
};

type PlanningLink = {
  label: string;
  description: string;
  href: string;
};

const planningLinks: PlanningLink[] = [
  {
    label: "MSFS Flight Planner",
    description: "Open the official Microsoft Flight Simulator web planner.",
    href: "https://planner.flightsimulator.com/",
  },
  {
    label: "SimBrief Dispatch",
    description: "Build an OFP, fuel plan, route, and performance notes.",
    href: "https://dispatch.simbrief.com/",
  },
  {
    label: "FlightAware",
    description: "Look up real-world route examples before flying.",
    href: "https://www.flightaware.com/",
  },
];

const routeAliases: Record<string, string> = {
  "737max": "boeing-737-max-8",
  "a320neo": "inibuilds-a320neo",
  "c172": "c172-skyhawk-g1000",
  "tbm930": "daher-tbm930",
};

function storageKeyFor(profileId: string): string {
  return `flight-hub:${profileId}:session:v1`;
}

function readRoute(): Route {
  const hash = window.location.hash.replace(/^#/, "");
  const profileId = routeAliases[hash] ?? hash;
  const profile = profileId ? findAircraftProfile(profileId) : undefined;

  if (!profile) {
    return { kind: "dashboard" };
  }

  return {
    kind: "checklist",
    profileId: profile.id,
  };
}

function createSession(profile: AircraftProfile): ChecklistSession {
  return {
    completed: {},
    activePhaseId: profile.phases[0]?.id ?? "",
  };
}

function loadSession(profile: AircraftProfile): ChecklistSession {
  try {
    const raw = window.localStorage.getItem(storageKeyFor(profile.id));

    if (!raw) {
      return createSession(profile);
    }

    const parsed = JSON.parse(raw) as Partial<ChecklistSession>;
    const activePhaseExists = profile.phases.some(
      (phase) => phase.id === parsed.activePhaseId,
    );

    return {
      completed: parsed.completed ?? {},
      activePhaseId: activePhaseExists
        ? parsed.activePhaseId!
        : profile.phases[0]?.id ?? "",
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return createSession(profile);
  }
}

function loadSessions(): Record<string, ChecklistSession> {
  return Object.fromEntries(
    aircraftProfiles.map((profile) => [profile.id, loadSession(profile)]),
  );
}

function formatUpdatedAt(value?: string): string {
  if (!value) {
    return "Not started yet";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getAllItemIds(aircraft: AircraftProfile): string[] {
  return aircraft.phases.flatMap((phase) => phase.items.map((item) => item.id));
}

function getPhaseCompletion(
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

function getProfileProgress(
  profile: AircraftProfile,
  session: ChecklistSession,
) {
  const allItemIds = getAllItemIds(profile);
  const completedCount = allItemIds.filter((id) => session.completed[id]).length;
  const totalCount = allItemIds.length;
  const overallPercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const nextPhase =
    profile.phases.find(
      (phase) =>
        getPhaseCompletion(phase, session.completed).done < phase.items.length,
    ) ?? profile.phases[profile.phases.length - 1];

  return {
    completedCount,
    nextPhaseTitle: nextPhase?.title ?? "Complete",
    overallPercent,
    totalCount,
  };
}

function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  const [sessions, setSessions] =
    useState<Record<string, ChecklistSession>>(loadSessions);
  const [recentlyCheckedItemId, setRecentlyCheckedItemId] = useState<
    string | null
  >(null);

  const activeProfile =
    route.kind === "checklist"
      ? findAircraftProfile(route.profileId) ?? defaultAircraftProfile
      : defaultAircraftProfile;
  const session =
    sessions[activeProfile.id] ?? createSession(activeProfile);
  const allItemIds = useMemo(
    () => getAllItemIds(activeProfile),
    [activeProfile],
  );
  const completedCount = allItemIds.filter((id) => session.completed[id]).length;
  const totalCount = allItemIds.length;
  const overallPercent =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const activePhase =
    activeProfile.phases.find((phase) => phase.id === session.activePhaseId) ??
    activeProfile.phases[0];
  const routeKey =
    route.kind === "checklist" ? `${route.kind}:${route.profileId}` : route.kind;

  useEffect(() => {
    const handleHashChange = () => setRoute(readRoute());

    window.addEventListener("hashchange", handleHashChange);

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [routeKey]);

  useEffect(() => {
    setRecentlyCheckedItemId(null);
  }, [activeProfile.id]);

  useEffect(() => {
    if (!recentlyCheckedItemId) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setRecentlyCheckedItemId(null);
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [recentlyCheckedItemId]);

  function updateSession(
    profileId: string,
    updater: (current: ChecklistSession) => ChecklistSession,
  ) {
    const profile = findAircraftProfile(profileId);

    if (!profile) {
      return;
    }

    setSessions((current) => {
      const currentSession = current[profileId] ?? createSession(profile);
      const nextSession = updater(currentSession);

      window.localStorage.setItem(
        storageKeyFor(profileId),
        JSON.stringify(nextSession),
      );

      return {
        ...current,
        [profileId]: nextSession,
      };
    });
  }

  function openChecklist(profileId: string) {
    const profile = findAircraftProfile(profileId);

    if (!profile) {
      return;
    }

    window.location.hash = profile.id;
    setRoute({ kind: "checklist", profileId: profile.id });
  }

  function openDashboard() {
    window.history.pushState("", document.title, window.location.pathname);
    setRoute({ kind: "dashboard" });
  }

  function setActivePhase(activePhaseId: string) {
    updateSession(activeProfile.id, (current) => ({
      ...current,
      activePhaseId,
      updatedAt: new Date().toISOString(),
    }));

    if (window.matchMedia("(max-width: 920px)").matches) {
      window.setTimeout(() => {
        document
          .querySelector(".phase-panel")
          ?.scrollIntoView({ block: "start", behavior: "auto" });
      }, 0);
    }
  }

  function toggleItem(itemId: string) {
    const willBeChecked = !session.completed[itemId];

    if (willBeChecked) {
      setRecentlyCheckedItemId(itemId);
    } else if (recentlyCheckedItemId === itemId) {
      setRecentlyCheckedItemId(null);
    }

    updateSession(activeProfile.id, (current) => ({
      ...current,
      completed: {
        ...current.completed,
        [itemId]: !current.completed[itemId],
      },
      updatedAt: new Date().toISOString(),
    }));
  }

  function resetSession() {
    const confirmed = window.confirm(
      `Reset the ${activeProfile.name} checklist session for a new flight?`,
    );

    if (!confirmed) {
      return;
    }

    const nextSession = createSession(activeProfile);
    window.localStorage.removeItem(storageKeyFor(activeProfile.id));
    setRecentlyCheckedItemId(null);
    setSessions((current) => ({
      ...current,
      [activeProfile.id]: nextSession,
    }));
  }

  if (route.kind === "checklist" && activePhase) {
    return (
      <ChecklistPage
        activePhase={activePhase}
        completedCount={completedCount}
        onBack={openDashboard}
        onPhaseSelect={setActivePhase}
        onReset={resetSession}
        onToggleItem={toggleItem}
        overallPercent={overallPercent}
        profile={activeProfile}
        recentlyCheckedItemId={recentlyCheckedItemId}
        session={session}
        totalCount={totalCount}
      />
    );
  }

  return (
    <DashboardPage
      onOpenChecklist={openChecklist}
      profiles={aircraftProfiles}
      sessions={sessions}
    />
  );
}

type DashboardProps = {
  onOpenChecklist: (profileId: string) => void;
  profiles: AircraftProfile[];
  sessions: Record<string, ChecklistSession>;
};

function DashboardPage({
  onOpenChecklist,
  profiles,
  sessions,
}: DashboardProps) {
  return (
    <main className="app-shell dashboard-shell">
      <TopBar />

      <section className="dashboard-grid">
        <div className="intro-panel">
          <p className="eyebrow">MSFS 2024 checklist companion</p>
          <h1>Flight Hub</h1>
          <p className="intro-copy">
            A minimalist aircraft checklist hub for running a clean simulator
            flight from stand to destination gate. Pick an aircraft profile,
            keep the useful planning tools nearby, and tick through each phase
            beside the sim.
          </p>

          <div className="notice">
            <Info size={18} aria-hidden="true" />
            <span>
              Simulator-only guidance. This is not real-world aviation
              instruction.
            </span>
          </div>
        </div>

        <div className="aircraft-list" aria-label="Aircraft profiles">
          {profiles.map((profile) => {
            const session = sessions[profile.id] ?? createSession(profile);
            const progress = getProfileProgress(profile, session);

            return (
              <AircraftCard
                completedCount={progress.completedCount}
                key={profile.id}
                nextPhaseTitle={progress.nextPhaseTitle}
                onOpenChecklist={() => onOpenChecklist(profile.id)}
                overallPercent={progress.overallPercent}
                profile={profile}
                session={session}
                totalCount={progress.totalCount}
              />
            );
          })}
        </div>
      </section>

      <section className="planning-section" aria-labelledby="planning-title">
        <div className="section-heading">
          <p className="eyebrow">Planning links</p>
          <h2 id="planning-title">Open the tools, keep this page focused</h2>
        </div>

        <div className="planning-links">
          {planningLinks.map((link) => (
            <a
              className="planning-link"
              href={link.href}
              key={link.href}
              rel="noreferrer"
              target="_blank"
            >
              <span>
                <strong>{link.label}</strong>
                <small>{link.description}</small>
              </span>
              <ExternalLink size={18} aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

type AircraftCardProps = {
  completedCount: number;
  nextPhaseTitle: string;
  onOpenChecklist: () => void;
  overallPercent: number;
  profile: AircraftProfile;
  session: ChecklistSession;
  totalCount: number;
};

function AircraftCard({
  completedCount,
  nextPhaseTitle,
  onOpenChecklist,
  overallPercent,
  profile,
  session,
  totalCount,
}: AircraftCardProps) {
  return (
    <article className="aircraft-card">
      <div className="aircraft-card-header">
        <div>
          <p className="eyebrow">Aircraft profile</p>
          <h2>{profile.name}</h2>
          <p>{profile.variant}</p>
        </div>
        <div
          aria-label={`${overallPercent}% complete`}
          className="progress-dial"
          style={{ "--progress": `${overallPercent}%` } as CSSProperties}
        >
          <span>{overallPercent}%</span>
        </div>
      </div>

      <p className="profile-description">{profile.description}</p>

      <div className="stats-grid">
        <Stat
          icon={<ListChecks size={18} aria-hidden="true" />}
          label="Checklist"
          value={`${completedCount}/${totalCount}`}
        />
        <Stat
          icon={<Gauge size={18} aria-hidden="true" />}
          label="Next phase"
          value={nextPhaseTitle}
        />
        <Stat
          icon={<ClipboardCheck size={18} aria-hidden="true" />}
          label="Updated"
          value={formatUpdatedAt(session.updatedAt)}
        />
      </div>

      <button
        className="primary-action"
        onClick={onOpenChecklist}
        type="button"
      >
        Open checklist
      </button>
    </article>
  );
}

type StatProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function Stat({ icon, label, value }: StatProps) {
  return (
    <div className="stat">
      {icon}
      <span>
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </div>
  );
}

type ChecklistProps = {
  activePhase: FlightPhase;
  completedCount: number;
  onBack: () => void;
  onPhaseSelect: (phaseId: string) => void;
  onReset: () => void;
  onToggleItem: (itemId: string) => void;
  overallPercent: number;
  profile: AircraftProfile;
  recentlyCheckedItemId: string | null;
  session: ChecklistSession;
  totalCount: number;
};

function ChecklistPage({
  activePhase,
  completedCount,
  onBack,
  onPhaseSelect,
  onReset,
  onToggleItem,
  overallPercent,
  profile,
  recentlyCheckedItemId,
  session,
  totalCount,
}: ChecklistProps) {
  const activeCompletion = getPhaseCompletion(activePhase, session.completed);

  return (
    <main className="app-shell checklist-shell">
      <TopBar />

      <section className="checklist-header">
        <button className="ghost-action" onClick={onBack} type="button">
          <ArrowLeft size={18} aria-hidden="true" />
          Dashboard
        </button>

        <div className="checklist-title">
          <p className="eyebrow">{profile.simulator}</p>
          <h1>{profile.name}</h1>
          <p>
            {completedCount} of {totalCount} checklist items complete.
          </p>
        </div>

        <button className="ghost-action danger" onClick={onReset} type="button">
          <RotateCcw size={18} aria-hidden="true" />
          Reset flight
        </button>
      </section>

      <div className="overall-progress" aria-label={`${overallPercent}% complete`}>
        <span style={{ width: `${overallPercent}%` }} />
      </div>

      <section className="checklist-layout">
        <nav className="phase-rail" aria-label="Flight phases">
          {profile.phases.map((phase, index) => {
            const completion = getPhaseCompletion(phase, session.completed);
            const isActive = phase.id === activePhase.id;
            const isComplete =
              completion.total > 0 && completion.done === completion.total;

            return (
              <button
                aria-current={isActive ? "step" : undefined}
                aria-label={`${index + 1}. ${phase.title}, ${completion.done} of ${completion.total} complete`}
                className={isActive ? "phase-button active" : "phase-button"}
                key={phase.id}
                onClick={() => onPhaseSelect(phase.id)}
                type="button"
              >
                <span className={isComplete ? "phase-number done" : "phase-number"}>
                  {isComplete ? <Check size={14} aria-hidden="true" /> : index + 1}
                </span>
                <span>
                  <strong>{phase.title}</strong>
                  <small>
                    {completion.done}/{completion.total} complete
                  </small>
                </span>
              </button>
            );
          })}
        </nav>

        <article className="phase-panel">
          <div className="phase-panel-header">
            <div>
              <p className="eyebrow">Active phase</p>
              <h2>{activePhase.title}</h2>
              <p>{activePhase.summary}</p>
            </div>

            <div className="phase-count">
              <strong>
                {activeCompletion.done}/{activeCompletion.total}
              </strong>
              <span>complete</span>
            </div>
          </div>

          <div className="item-list">
            {activePhase.items.map((item) => {
              const checked = Boolean(session.completed[item.id]);
              const itemClassName = [
                "check-item",
                checked ? "done" : "",
                recentlyCheckedItemId === item.id ? "just-checked" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <label className={itemClassName} key={item.id}>
                  <input
                    checked={checked}
                    onChange={() => onToggleItem(item.id)}
                    type="checkbox"
                  />
                  <span className="check-mark" aria-hidden="true">
                    <Check size={16} />
                  </span>
                  <span className="item-copy">
                    <strong>{item.action}</strong>
                    {item.confirmation ? <small>{item.confirmation}</small> : null}
                    {item.note ? <em>{item.note}</em> : null}
                  </span>
                </label>
              );
            })}
          </div>
        </article>
      </section>
    </main>
  );
}

function TopBar() {
  return (
    <header className="topbar">
      <a className="brand" href="/">
        <Plane size={20} aria-hidden="true" />
        <span>Flight Hub</span>
      </a>
      <span className="sim-badge">MSFS 2024</span>
    </header>
  );
}

export default App;
