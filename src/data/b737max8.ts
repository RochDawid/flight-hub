import type { AircraftProfile } from "../types";

export const b737Max8Profile: AircraftProfile = {
  id: "boeing-737-max-8",
  name: "Boeing 737 MAX 8",
  variant: "Twin-engine narrow-body airliner",
  simulator: "Microsoft Flight Simulator 2024",
  description:
    "A Boeing-style airline flow for the default 737 MAX 8, from cold aircraft setup through an ILS-focused arrival and shutdown.",
  phases: [
    {
      id: "electrical-irs",
      title: "Electrical & IRS",
      summary: "Wake the aircraft, establish power, and start navigation alignment.",
      items: [
        {
          id: "parking-brake-set",
          action: "Parking brake - SET",
          confirmation: "Aircraft secure at the stand",
        },
        {
          id: "battery-on",
          action: "Battery and standby power - ON / AUTO",
          confirmation: "Basic electrical power available",
        },
        {
          id: "external-power",
          action: "External power or APU generator - ON",
          confirmation: "Aircraft on stable electrical power",
        },
        {
          id: "irs-nav",
          action: "IRS selectors - NAV",
          confirmation: "Alignment started",
          note: "Alignment timing depends on simulator state and settings.",
        },
        {
          id: "position-initialize",
          action: "FMC position initialization - Complete",
          confirmation: "IRS position accepted",
        },
      ],
    },
    {
      id: "preflight-setup",
      title: "Preflight Setup",
      summary: "Build the FMC route and set the first clearance targets.",
      items: [
        {
          id: "payload-fuel",
          action: "Payload and fuel - Set",
          confirmation: "Weights match the planned flight",
        },
        {
          id: "fmc-route",
          action: "FMC route - Entered and activated",
          confirmation: "Origin, destination, route, and runway make sense",
        },
        {
          id: "fmc-performance",
          action: "FMC performance and takeoff pages - Completed",
          confirmation: "V-speeds, thrust setting, flaps, and trim available",
        },
        {
          id: "mcp-initial",
          action: "MCP heading, altitude, and speed - Set",
          confirmation: "Initial clearance targets visible",
        },
        {
          id: "baro-set",
          action: "Baro reference - Set",
          confirmation: "Altimeters match departure airport",
        },
      ],
    },
    {
      id: "before-pushback",
      title: "Before Pushback",
      summary: "Close the aircraft and configure systems for engine start.",
      items: [
        {
          id: "doors-jetway",
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
          id: "packs-off",
          action: "Packs - OFF for engine start",
          confirmation: "Bleed air prioritized for start",
        },
        {
          id: "pushback-clearance",
          action: "Pushback path - Clear",
          confirmation: "Aircraft ready to move",
        },
      ],
    },
    {
      id: "engine-start",
      title: "Engine Start",
      summary: "Start both engines and return systems to normal.",
      items: [
        {
          id: "start-switch-right",
          action: "Right engine start switch - GND",
          confirmation: "N2 increasing",
        },
        {
          id: "right-start-lever",
          action: "Right start lever - IDLE at stable start speed",
          confirmation: "Right engine stabilizes",
        },
        {
          id: "start-switch-left",
          action: "Left engine start switch - GND",
          confirmation: "N2 increasing",
        },
        {
          id: "left-start-lever",
          action: "Left start lever - IDLE at stable start speed",
          confirmation: "Left engine stabilizes",
        },
        {
          id: "generators-packs",
          action: "Generators and packs - Normal after start",
          confirmation: "Engines supplying aircraft systems",
        },
        {
          id: "apu-off",
          action: "APU - OFF when no longer needed",
          confirmation: "APU shutdown started",
        },
      ],
    },
    {
      id: "taxi",
      title: "Taxi",
      summary: "Configure for ground movement and complete departure checks.",
      items: [
        {
          id: "taxi-light-on",
          action: "Taxi light - ON",
          confirmation: "Taxi path illuminated",
        },
        {
          id: "brake-check",
          action: "Brake check - Complete",
          confirmation: "Aircraft slows correctly",
        },
        {
          id: "flight-controls",
          action: "Flight controls - Full and free",
          confirmation: "Yoke, rudder, and spoilers respond correctly",
        },
        {
          id: "flaps-set",
          action: "Flaps - Set for takeoff",
          confirmation: "Flap indication matches FMC takeoff page",
        },
        {
          id: "trim-set",
          action: "Stabilizer trim - Set",
          confirmation: "Trim matches FMC takeoff page",
        },
        {
          id: "autobrake-rto",
          action: "Autobrake - RTO",
          confirmation: "Rejected takeoff braking armed",
        },
      ],
    },
    {
      id: "before-takeoff",
      title: "Before Takeoff",
      summary: "Final runway configuration and mode checks.",
      items: [
        {
          id: "cabin-ready",
          action: "Cabin and doors - Ready",
          confirmation: "No open-door messages",
        },
        {
          id: "lights-takeoff",
          action: "Landing lights and strobes - ON",
          confirmation: "Aircraft configured for runway entry",
        },
        {
          id: "transponder-ta-ra",
          action: "Transponder / TCAS - TA/RA",
          confirmation: "Traffic system active",
        },
        {
          id: "lnav-vnav",
          action: "LNAV / VNAV or heading / level change - Armed as planned",
          confirmation: "Flight director modes match the departure plan",
        },
        {
          id: "takeoff-config",
          action: "Takeoff configuration - Checked",
          confirmation: "No unexpected warning",
        },
      ],
    },
    {
      id: "takeoff",
      title: "Takeoff",
      summary: "Set takeoff thrust, rotate, and establish initial climb.",
      items: [
        {
          id: "thrust-set",
          action: "Thrust - Advance and set takeoff power",
          confirmation: "Engines stable and takeoff thrust set",
        },
        {
          id: "airspeed-modes",
          action: "Airspeed and FMA - Monitor",
          confirmation: "Expected takeoff modes shown",
        },
        {
          id: "rotate",
          action: "Rotate at VR - Smooth pitch up",
          confirmation: "Positive rate established",
        },
        {
          id: "gear-up",
          action: "Landing gear - UP",
          confirmation: "Gear retracted",
        },
        {
          id: "climb-modes",
          action: "Climb modes - Verify",
          confirmation: "Aircraft following intended lateral and vertical path",
        },
      ],
    },
    {
      id: "climb-cruise",
      title: "Climb & Cruise",
      summary: "Clean up, monitor systems, and cruise toward the arrival.",
      items: [
        {
          id: "flaps-retract",
          action: "Flaps - Retract on schedule",
          confirmation: "Aircraft clean above acceleration altitude",
        },
        {
          id: "landing-lights-off",
          action: "Landing lights - OFF above 10,000 ft",
          confirmation: "Exterior lighting set for climb",
        },
        {
          id: "standard-baro",
          action: "Baro - STD above transition altitude",
          confirmation: "Standard pressure set",
        },
        {
          id: "fuel-progress",
          action: "Fuel and route progress - Checked",
          confirmation: "Arrival fuel and next waypoints make sense",
        },
        {
          id: "systems-normal",
          action: "Systems and alerts - Reviewed",
          confirmation: "No unexpected warnings",
        },
      ],
    },
    {
      id: "descent-preparation",
      title: "Descent Preparation",
      summary: "Load the arrival and prepare the aircraft before top of descent.",
      items: [
        {
          id: "arrival-weather",
          action: "Arrival weather / ATIS - Checked",
          confirmation: "Runway, wind, QNH, and temperature known",
        },
        {
          id: "arrival-approach",
          action: "FMC arrival and approach - Loaded",
          confirmation: "STAR, transition, and approach reviewed",
        },
        {
          id: "descent-altitude",
          action: "MCP altitude - Set for cleared descent",
          confirmation: "Aircraft has a valid descent target",
        },
        {
          id: "landing-data",
          action: "Landing data - Set",
          confirmation: "Flaps, VREF, and autobrake selected",
        },
        {
          id: "approach-brief",
          action: "Approach brief - Complete",
          confirmation: "ILS frequency, course, minima, and missed approach understood",
        },
      ],
    },
    {
      id: "approach",
      title: "Approach",
      summary: "Configure for the terminal area and capture final guidance.",
      items: [
        {
          id: "qnh-set",
          action: "Baro reference - QNH",
          confirmation: "Destination altimeters set",
        },
        {
          id: "ils-nav",
          action: "ILS frequency and course - Verified",
          confirmation: "Correct runway guidance displayed",
        },
        {
          id: "approach-mode",
          action: "APP - Armed when cleared",
          confirmation: "Localizer and glideslope capture available",
        },
        {
          id: "speedbrake-arm",
          action: "Speedbrake - Armed",
          confirmation: "Landing spoilers armed",
        },
        {
          id: "gear-down",
          action: "Landing gear - DOWN",
          confirmation: "Three green",
        },
        {
          id: "flaps-landing",
          action: "Flaps - Landing configuration",
          confirmation: "Landing checklist complete",
        },
      ],
    },
    {
      id: "landing",
      title: "Landing",
      summary: "Stabilize, land, decelerate, and clear the runway.",
      items: [
        {
          id: "stable-approach",
          action: "Stable approach - Confirm",
          confirmation: "On path, on speed, landing configuration set",
        },
        {
          id: "autopilot-off",
          action: "Autopilot - OFF when hand flying",
          confirmation: "Manual control established",
        },
        {
          id: "flare-idle",
          action: "Flare and thrust idle - Execute",
          confirmation: "Main gear touchdown",
        },
        {
          id: "reverse-thrust",
          action: "Reverse thrust - As needed",
          confirmation: "Aircraft decelerating",
        },
        {
          id: "vacate-runway",
          action: "Vacate runway - Complete",
          confirmation: "Aircraft clear of active runway",
        },
      ],
    },
    {
      id: "after-landing-shutdown",
      title: "After Landing / Shutdown",
      summary: "Clean up after runway exit, taxi to stand, and secure the aircraft.",
      items: [
        {
          id: "speedbrake-flaps",
          action: "Speedbrake - Down, flaps - UP",
          confirmation: "Aircraft clean for taxi",
        },
        {
          id: "lights-after-landing",
          action: "Strobes and landing lights - OFF",
          confirmation: "Taxi lighting remains as needed",
        },
        {
          id: "apu-start-arrival",
          action: "APU - Start if needed for gate power",
          confirmation: "APU available before shutdown",
        },
        {
          id: "parking-brake-final",
          action: "Parking brake - SET",
          confirmation: "Aircraft stopped at stand",
        },
        {
          id: "start-levers-cutoff",
          action: "Start levers - CUTOFF",
          confirmation: "Engines shutting down",
        },
        {
          id: "secure-aircraft",
          action: "Fuel pumps, APU, and battery - OFF when finished",
          confirmation: "Aircraft secured for the next session",
        },
      ],
    },
  ],
};
