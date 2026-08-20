export function getFilingDestination(hasCompletedProfile: boolean) {
  return hasCompletedProfile ? "/report" : "/onboarding?next=/report";
}
