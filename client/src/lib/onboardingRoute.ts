export function getOnboardingNextPath(search: string) {
  const requestedNext = new URLSearchParams(search).get("next");
  return requestedNext === "/report" || requestedNext === "/profile" ? requestedNext : "/dashboard";
}
