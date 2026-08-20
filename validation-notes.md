# Validation Notes

- Desktop review confirmed that the homepage now places a compact, secondary **Admin portal** control beside a visually dominant **Raise a complaint** action.
- Desktop and mobile student workspaces confirmed that the highlighted complaint desk, category cards, and primary complaint call to action remain clear and readable.
- Desktop and mobile onboarding views confirmed that the mobile-number field is present for student profiles and communicates the gender-aware contact rule before submission.
- Automated validation passed with 12 Vitest tests and TypeScript compilation after the mobile-number schema and profile validation changes.

The public homepage was rechecked after the refinement: the active-ticket status card has been replaced by a neutral filing preview focused on category selection, AI routing, and evidence. The authenticated dashboard still loads with the student complaint desk and private tracking workspace intact.

The first-time filing gate was validated with 14 Vitest tests and TypeScript compilation. The route contract confirms users without a completed profile go to registration before `/report`, while completed users go directly to `/report`. Desktop and mobile review confirmed that the registration form clearly explains the one-time setup and remains usable on small screens.

The student profile feature was validated with 15 Vitest tests and TypeScript compilation, including the profile API response used by the editor and profile-name persistence. In the current authenticated administrator session, `/profile` correctly presents a clear registration fallback because no student profile exists; this fallback was reviewed at desktop and mobile sizes. The completed-profile editor uses the same tested profile mutation and gender-aware mobile validation as registration.

The supported email-first Manus entry flow was validated with 15 automated tests and TypeScript compilation. For the current authenticated account without a profile, `/file-complaint` correctly routes to the responsive first-time registration form; its routing contract remains covered by the client test. The unauthenticated entry screen now exposes a single email-first action rather than automatically redirecting to the provider page.

The revised email-first entry flow passed 15 automated tests and TypeScript validation after a distinct returning-user email login action was added. Desktop and mobile review confirmed that the current signed-in, unregistered account reaches the responsive first-time registration path; the client routing contract covers both the unregistered and completed-profile destinations.

The unauthenticated `/file-complaint` screen was inspected directly and now contains only the email-first Create a new CampusFix ID action plus a separate Log in with email action for returning users. The authenticated workspace was also rechecked after the refinement and continues to render the private complaint desk correctly.

The first-time registration screen now displays a controlled Hostel or residence selector rather than a free-form text input. The selector is backed by the exact approved options Aryabhatta Bhawan, C.V Raman Bhawan, and Vaishali Bhawan; automated client and server contract tests verify that only these values are exposed and accepted. Direct browser access to protected registration, profile, and complaint routes appropriately requires authentication.

Student registration now visibly presents required Roll number and Registration number inputs alongside campus-residence and contact details. The profile route preserves its expected registration gate for an account without an initialized profile. The expanded suite passed 20 tests, including profile API contracts requiring both identifiers for student profiles, and TypeScript compilation completed without errors.

The administrator Command center was visually reviewed after the registered-user dashboard update. The live card renders alongside complaint metrics and displays the completed-profile total with a separate student and staff breakdown. The administrator contract suite confirms that the statistic is unavailable to non-administrator accounts.

The reported onboarding preview URL (`/onboarding?next=/report&from_webdev=1`) was rechecked after the API recovery change and renders the complete registration form without the earlier HTML-to-JSON parsing failure. Diagnostics identified the original response as an upstream 504 Gateway Time-out HTML document rather than an invalid CampusFix API response. The authenticated profile query now retries transient HTML gateway failures twice with backoff, while permanent API errors remain non-retriable. A browser-level `useAuth` regression test supplies a transient HTML 504 followed by a valid tRPC authentication response and confirms that the authenticated state recovers; the route-contract test also confirms that the preview parameter preserves the `/report` destination.

The updated onboarding screen renders the campus-role selector and registration fields without layout regressions. The dedicated staff approval screen renders its pending-review state, automatic status-check messaging, and manual refresh control. The administrator Command center route also enters its loading state normally while administrator data queries are in flight; administrator-only staff list and decision behavior are covered by the staff approval contract tests.

The fully loaded administrator Command center was rechecked and renders the Staff registration review panel above complaint management, including an explicit pending-registration count and clear empty-state messaging when no staff registrations await review. The expanded approval workflow suite passed 35 tests, including staff photo persistence, signed photo review URLs, administrator decisions, and pending-staff access restrictions; TypeScript compilation also passed.

After photo enforcement, the onboarding form continued to render normally for student registration and the administrator Command center continued to preserve its loading layout while privileged statistics and review data load. The mandatory photo rule is enforced by both the required staff-only file input and the protected profile API, and the regression suite passed 36 tests with TypeScript validation.

The CampusFix navigation control now uses an opaque deep-blue background with a white icon, border, shadow, focus ring, and active press feedback. Desktop and mobile workspace reviews confirm the formerly transparent three-line control remains clearly visible against its respective header backgrounds.

Authenticated desktop and mobile workspace previews were rechecked after the control update. Both renders display the signed-in administrator workspace and the solid deep-blue menu control: the desktop sidebar header retains an opaque control beside the CampusFix mark, and the mobile header retains the same high-contrast trigger.

To make the authenticated menu verification deterministic, a browser-style DashboardLayout test now renders the sidebar with a mocked authenticated administrator and asserts that the control carries its opaque deep-blue background, white foreground, matching border, and visible focus-ring classes. The full regression suite passed 37 tests and TypeScript validation completed successfully.

The mobile sidebar implementation was corrected at the sheet surface itself: CampusFix sidebar classes are now forwarded to the opened mobile sheet, applying an opaque `#f8fbff` surface, blue border, and elevated shadow. A deterministic mobile-sheet test opens the actual Radix sheet and verifies those three classes on the rendered sliding panel. The mobile workspace review also confirms the trigger and header remain stable after the change; the full suite passed 38 tests and TypeScript validation completed successfully.

The public CampusFix hero now uses a college-campus background photograph with a high-opacity light gradient overlay. Desktop and mobile reviews confirm that the background remains visible while the headline, supporting copy, primary complaint action, and secondary action retain clear contrast and hierarchy. The underlying test suite still passes 38 tests with TypeScript validation.

A browser-style landing-hero regression test now verifies that the college image remains behind its high-opacity light overlay and that both the primary complaint action and secondary how-it-works action are rendered. The full CampusFix suite passed 39 tests and TypeScript validation completed successfully after this coverage was added.
