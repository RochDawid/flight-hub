import type { AircraftProfile } from "../types";

export const a320neoProfile: AircraftProfile = {
  id: "inibuilds-a320neo",
  name: "iniBuilds A320neo",
  variant: "Airbus A320neo",
  simulator: "Microsoft Flight Simulator 2024",
  description:
    "A sim-practical flow for getting the iniBuilds A320neo from cold aircraft to destination gate with a clean ILS-focused first approach path.",
  phases: [
    {
      id: "cold-dark-start",
      title: "Cold & Dark Start",
      summary: "Wake up the aircraft, establish power, and start alignment.",
      items: [
        {
          id: "batteries-on",
          action: "Batteries 1 and 2 - ON",
          confirmation: "Battery voltage available",
        },
        {
          id: "external-power",
          action: "External power or APU - Available",
          confirmation: "Aircraft on stable electrical power",
          note: "Use external power at the gate when available; use APU when you need self-contained power.",
        },
        {
          id: "adirs-nav",
          action: "ADIRS knobs - NAV",
          confirmation: "Alignment started",
          note: "Alignment time depends on aircraft state and simulator settings.",
        },
        {
          id: "fuel-pumps",
          action: "Fuel pumps - ON",
          confirmation: "No low-pressure messages expected with fuel on board",
        },
        {
          id: "nav-logo-lights",
          action: "Navigation and logo lights - ON",
          confirmation: "Aircraft visible at the stand",
        },
        {
          id: "displays-brightness",
          action: "Displays and flood lighting - Set",
          confirmation: "Cockpit readable for current lighting",
        },
      ],
    },
    {
      id: "preflight-setup",
      title: "Preflight Setup",
      summary: "Load the plan, weights, performance, and first departure targets.",
      items: [
        {
          id: "efb-payload-fuel",
          action: "EFB payload and fuel - Set",
          confirmation: "Weights match the planned flight",
        },
        {
          id: "mcdu-init",
          action: "MCDU INIT - Complete",
          confirmation: "Departure, arrival, flight number, cost index, and cruise level entered",
        },
        {
          id: "flight-plan-check",
          action: "MCDU flight plan - Reviewed",
          confirmation: "No route discontinuities blocking the departure path",
        },
        {
          id: "performance-takeoff",
          action: "Takeoff performance - Entered",
          confirmation: "V-speeds, flex temperature, flaps, and trim are available",
        },
        {
          id: "fcu-initial",
          action: "FCU initial altitude and heading - Set",
          confirmation: "Initial clearance targets are visible",
        },
        {
          id: "baro-qnh",
          action: "Baro reference - Set",
          confirmation: "QNH matches the departure airport",
        },
      ],
    },
    {
      id: "pushback-engine-start",
      title: "Pushback & Engine Start",
      summary: "Prepare the aircraft for movement and bring both engines online.",
      items: [
        {
          id: "doors-closed",
          action: "Doors and jetway - Closed / removed",
          confirmation: "Aircraft ready for pushback",
        },
        {
          id: "beacon-on",
          action: "Beacon - ON",
          confirmation: "Engine start warning active",
        },
        {
          id: "apu-bleed",
          action: "APU bleed - ON",
          confirmation: "Bleed air available for start",
        },
        {
          id: "engine-mode-start",
          action: "Engine mode selector - IGN / START",
          confirmation: "Engine start mode active",
        },
        {
          id: "engine-two",
          action: "Engine 2 master - ON",
          confirmation: "Engine 2 stabilized",
        },
        {
          id: "engine-one",
          action: "Engine 1 master - ON",
          confirmation: "Engine 1 stabilized",
        },
        {
          id: "apu-after-start",
          action: "APU bleed and APU - OFF when no longer needed",
          confirmation: "Engines supplying aircraft systems",
        },
      ],
    },
    {
      id: "taxi",
      title: "Taxi",
      summary: "Configure for ground movement and verify controls before departure.",
      items: [
        {
          id: "taxi-light",
          action: "Nose light - TAXI",
          confirmation: "Taxi path illuminated",
        },
        {
          id: "brake-check",
          action: "Brake check - Complete",
          confirmation: "Aircraft slows correctly after initial movement",
        },
        {
          id: "flight-controls",
          action: "Flight controls - Full and free",
          confirmation: "Side stick, rudder, and spoilers respond correctly",
        },
        {
          id: "flaps-set",
          action: "Flaps - Set for takeoff",
          confirmation: "ECAM flap indication matches performance entry",
        },
        {
          id: "trim-set",
          action: "Pitch trim - Set",
          confirmation: "Trim matches takeoff performance",
        },
        {
          id: "takeoff-config-test",
          action: "Takeoff config - Test",
          confirmation: "No unexpected warning",
        },
      ],
    },
    {
      id: "before-takeoff",
      title: "Before Takeoff",
      summary: "Final runway checks before entering or lining up.",
      items: [
        {
          id: "cabin-ready",
          action: "Cabin and doors - Ready",
          confirmation: "No open-door or cabin messages",
        },
        {
          id: "spoilers-autobrake",
          action: "Spoilers armed and autobrake MAX - Set",
          confirmation: "Rejected takeoff protection configured",
        },
        {
          id: "lights-takeoff",
          action: "Landing lights and strobes - ON",
          confirmation: "Aircraft configured for runway entry",
        },
        {
          id: "transponder",
          action: "Transponder / TCAS - Active",
          confirmation: "Traffic system ready",
        },
        {
          id: "fma-check",
          action: "FMA and FCU targets - Checked",
          confirmation: "Modes and initial clearance make sense",
        },
        {
          id: "memo-no-blue",
          action: "ECAM takeoff memo - No blue items",
          confirmation: "Aircraft is ready for takeoff",
        },
      ],
    },
    {
      id: "takeoff",
      title: "Takeoff",
      summary: "Launch, rotate, and establish the initial climb.",
      items: [
        {
          id: "thrust-set",
          action: "Thrust levers - FLEX / MCT or TOGA",
          confirmation: "Takeoff thrust set and engines stable",
        },
        {
          id: "fma-takeoff",
          action: "FMA - Announce and monitor",
          confirmation: "Expected takeoff modes shown",
        },
        {
          id: "rotate",
          action: "Rotate at VR - Smooth pitch up",
          confirmation: "Positive climb established",
        },
        {
          id: "gear-up",
          action: "Landing gear - UP",
          confirmation: "Gear retracted",
        },
        {
          id: "thrust-climb",
          action: "Thrust levers - CL when prompted",
          confirmation: "Climb thrust active",
        },
      ],
    },
    {
      id: "after-takeoff-climb",
      title: "After Takeoff / Climb",
      summary: "Clean up the aircraft and settle into managed climb.",
      items: [
        {
          id: "flaps-retract",
          action: "Flaps - Retract on schedule",
          confirmation: "Aircraft clean above acceleration altitude",
        },
        {
          id: "autopilot-as-needed",
          action: "Autopilot - ON when desired",
          confirmation: "Aircraft following intended lateral and vertical path",
        },
        {
          id: "climb-modes",
          action: "Managed climb and navigation - Verified",
          confirmation: "FMA matches the planned climb",
        },
        {
          id: "lights-climb",
          action: "Landing lights - OFF above 10,000 ft",
          confirmation: "Exterior lighting set for climb",
        },
        {
          id: "standard-baro",
          action: "Baro - STD above transition altitude",
          confirmation: "Both sides use standard pressure",
        },
      ],
    },
    {
      id: "cruise",
      title: "Cruise",
      summary: "Monitor the aircraft, fuel, route, and arrival timing.",
      items: [
        {
          id: "systems-normal",
          action: "ECAM and system pages - Checked",
          confirmation: "No unexpected warnings",
        },
        {
          id: "fuel-check",
          action: "Fuel prediction - Checked",
          confirmation: "Arrival fuel remains comfortable",
        },
        {
          id: "route-progress",
          action: "MCDU progress - Reviewed",
          confirmation: "Next waypoints and top of descent make sense",
        },
        {
          id: "weather-arrival",
          action: "Destination weather - Reviewed",
          confirmation: "Expected runway and approach still suitable",
        },
      ],
    },
    {
      id: "descent-preparation",
      title: "Descent Preparation",
      summary: "Prepare arrival data before the airplane needs to go down.",
      items: [
        {
          id: "arrival-atis",
          action: "Arrival weather / ATIS - Checked",
          confirmation: "Runway, wind, QNH, and temperature known",
        },
        {
          id: "arrival-procedure",
          action: "Arrival and approach - Selected in MCDU",
          confirmation: "STAR, transition, and ILS approach loaded",
        },
        {
          id: "approach-performance",
          action: "PERF APPR page - Completed",
          confirmation: "QNH, temperature, wind, minima, and VAPP entered",
        },
        {
          id: "descent-altitude",
          action: "FCU altitude - Set for cleared descent",
          confirmation: "Aircraft has a valid descent target",
        },
        {
          id: "brief-approach",
          action: "Approach brief - Complete",
          confirmation: "ILS frequency, course, minima, and missed approach understood",
        },
      ],
    },
    {
      id: "approach-setup",
      title: "Approach Setup",
      summary: "Configure the aircraft for the terminal area and ILS intercept.",
      items: [
        {
          id: "ls-display",
          action: "LS display - ON",
          confirmation: "Localizer and glideslope scales visible",
        },
        {
          id: "ils-ident",
          action: "ILS frequency and course - Verified",
          confirmation: "Correct runway guidance displayed",
        },
        {
          id: "approach-phase",
          action: "MCDU approach phase - Activated when appropriate",
          confirmation: "Managed speed targets are approach-ready",
        },
        {
          id: "qnh-set",
          action: "Baro reference - QNH",
          confirmation: "Altimeters set for destination",
        },
        {
          id: "autobrake-landing",
          action: "Autobrake - LOW or MED",
          confirmation: "Landing deceleration selected",
        },
      ],
    },
    {
      id: "ils-approach",
      title: "ILS Approach",
      summary: "Capture localizer and glideslope, then stabilize the aircraft.",
      items: [
        {
          id: "loc-arm",
          action: "LOC - Armed or captured",
          confirmation: "Aircraft tracking runway centerline",
        },
        {
          id: "appr-arm",
          action: "APPR - Armed",
          confirmation: "Glideslope capture available",
        },
        {
          id: "gear-down",
          action: "Landing gear - DOWN",
          confirmation: "Three green",
        },
        {
          id: "flaps-landing",
          action: "Flaps - FULL or selected landing config",
          confirmation: "Landing configuration complete",
        },
        {
          id: "landing-memo",
          action: "ECAM landing memo - No blue items",
          confirmation: "Aircraft stable and configured",
        },
        {
          id: "stable-check",
          action: "Stable approach - Confirm",
          confirmation: "On path, on speed, landing checklist complete",
        },
      ],
    },
    {
      id: "landing",
      title: "Landing",
      summary: "Touch down, decelerate, and safely vacate the runway.",
      items: [
        {
          id: "disconnect-as-needed",
          action: "Autopilot - OFF when hand flying",
          confirmation: "Manual control established",
        },
        {
          id: "flare-idle",
          action: "Flare and thrust idle - Execute",
          confirmation: "Main gear touchdown",
        },
        {
          id: "reverse",
          action: "Reverse thrust - As needed",
          confirmation: "Aircraft decelerating",
        },
        {
          id: "manual-brake",
          action: "Manual braking - As required",
          confirmation: "Safe taxi speed achieved",
        },
        {
          id: "vacate-runway",
          action: "Vacate runway - Complete",
          confirmation: "Aircraft clear of active runway",
        },
      ],
    },
    {
      id: "after-landing",
      title: "After Landing",
      summary: "Clean up the aircraft after runway exit.",
      items: [
        {
          id: "spoilers-disarm",
          action: "Spoilers - Disarm",
          confirmation: "Spoiler lever stowed",
        },
        {
          id: "flaps-up",
          action: "Flaps - UP",
          confirmation: "Aircraft clean for taxi",
        },
        {
          id: "lights-after-landing",
          action: "Strobes and landing lights - OFF",
          confirmation: "Taxi lighting remains as needed",
        },
        {
          id: "radar-off",
          action: "Weather radar - OFF",
          confirmation: "Radar no longer transmitting",
        },
        {
          id: "apu-start-arrival",
          action: "APU - Start if needed for gate power",
          confirmation: "APU available before engine shutdown",
        },
      ],
    },
    {
      id: "taxi-gate-shutdown",
      title: "Taxi to Gate / Shutdown",
      summary: "Park, secure the aircraft, and end the checklist session.",
      items: [
        {
          id: "parking-brake",
          action: "Parking brake - Set",
          confirmation: "Aircraft stopped at stand",
        },
        {
          id: "external-power-arrival",
          action: "External power or APU - Available",
          confirmation: "Electrical source ready before shutdown",
        },
        {
          id: "engine-masters-off",
          action: "Engine masters 1 and 2 - OFF",
          confirmation: "Engines shutting down",
        },
        {
          id: "beacon-off",
          action: "Beacon - OFF after engines stop",
          confirmation: "Shutdown complete",
        },
        {
          id: "fuel-pumps-off",
          action: "Fuel pumps - OFF",
          confirmation: "Fuel system secured",
        },
        {
          id: "adirs-off",
          action: "ADIRS - OFF when ending the flight",
          confirmation: "Aircraft secured for the next session",
        },
      ],
    },
  ],
};
