/**
 * The verified-clinician panel. In production these are credential-verified
 * doctors who accept cases from the marketplace; here they are a fixed demo
 * roster so the human-in-the-loop review flow is fully functional offline.
 * Client-safe (pure data).
 */
export interface Clinician {
  id: string;
  name: string;
  specialty: string;
  credentials: string;
  registration: string; // e.g. GMC / board registration number
  verified: boolean;
  bio: string;
}

export const CLINICIANS: readonly Clinician[] = [
  {
    id: "dr-mensah",
    name: "Dr. Ama Mensah",
    specialty: "General Practice",
    credentials: "MBBS, MRCGP",
    registration: "GMC 7211043",
    verified: true,
    bio: "18 years in primary care; special interest in complex, multi-system presentations.",
  },
  {
    id: "dr-lindqvist",
    name: "Dr. Erik Lindqvist",
    specialty: "Endocrinology",
    credentials: "MD, PhD, FRCP",
    registration: "GMC 6588120",
    verified: true,
    bio: "Consultant endocrinologist; thyroid and metabolic disease.",
  },
  {
    id: "dr-arya",
    name: "Dr. Neha Arya",
    specialty: "Respiratory Medicine",
    credentials: "MBBS, MRCP",
    registration: "GMC 7044319",
    verified: true,
    bio: "Consultant in respiratory medicine; lung cancer and rapid-access diagnostics.",
  },
  {
    id: "dr-okonkwo",
    name: "Dr. Chidi Okonkwo",
    specialty: "Neurology",
    credentials: "MD, FRCP",
    registration: "GMC 6907755",
    verified: true,
    bio: "Consultant neurologist; headache disorders and neuro-inflammatory disease.",
  },
];

export function getClinician(id: string): Clinician | undefined {
  return CLINICIANS.find((c) => c.id === id);
}

/**
 * Match a triage-recommended specialty to the best available clinician.
 * Falls back to the GP when there is no exact specialty match.
 */
export function matchClinician(specialty: string): Clinician {
  const wanted = specialty.trim().toLowerCase();
  const exact = CLINICIANS.find((c) => c.specialty.toLowerCase() === wanted);
  if (exact) return exact;
  const partial = CLINICIANS.find(
    (c) =>
      wanted.includes(c.specialty.toLowerCase()) ||
      c.specialty.toLowerCase().includes(wanted)
  );
  return partial ?? CLINICIANS[0];
}
