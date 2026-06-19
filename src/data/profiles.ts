import type { AircraftProfile } from "../types";
import a320neoProfile from "./a320neo.json";
import b737Max8Profile from "./b737max8.json";
import c172SkyhawkG1000Profile from "./c172.json";
import tbm930Profile from "./tbm930.json";

export const aircraftProfiles = [
  a320neoProfile,
  c172SkyhawkG1000Profile,
  tbm930Profile,
  b737Max8Profile,
] satisfies AircraftProfile[];

export const defaultAircraftProfile = aircraftProfiles[0];

export function findAircraftProfile(
  profileId: string,
): AircraftProfile | undefined {
  return aircraftProfiles.find((profile) => profile.id === profileId);
}
