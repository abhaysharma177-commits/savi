import { SPECIALISTS, type Specialist } from "./prompts";
import type {
  Consensus,
  RedTeam,
  Review,
  StructureResult,
  Triage,
} from "./schemas";

/**
 * Built-in sample mode. When no ANTHROPIC_API_KEY is set (or SECOND_OPINION_MOCK=1),
 * the pipeline serves these pre-written results instead of calling Claude, so the
 * whole experience runs with zero setup and zero cost. The three prepared demo
 * cases get bespoke, clinically-plausible output; anything else gets an honest
 * "needs clinical assessment" result. Small delays simulate real latency so the
 * live review theatre still animates.
 */

type ScenarioId = "hypothyroid" | "cough" | "migraine";

interface Scenario {
  structured: StructureResult;
  triage: Triage;
  reviews: Record<string, Review>;
  consensus: Consensus;
  redTeam: RedTeam;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function rv(
  id: string,
  primary: string,
  confidence: number,
  reasoning: string,
  diffs: Array<[string, number, string]>,
  investigations: string[],
  miss: string,
  questions: string[],
  redFlags: string[] = []
): Review {
  const s = SPECIALISTS.find((x) => x.id === id) as Specialist;
  return {
    specialist_id: id,
    specialist_name: s.name,
    specialty: s.specialty,
    primary_diagnosis: primary,
    confidence,
    clinical_reasoning: reasoning,
    differential_diagnoses: diffs.map(([diagnosis, probability, key_feature]) => ({
      diagnosis,
      probability,
      key_feature,
    })),
    red_flags_identified: redFlags,
    recommended_investigations: investigations,
    what_others_might_miss: miss,
    questions_for_patient: questions,
  };
}

const SCENARIOS: Record<ScenarioId, Scenario> = {
  hypothyroid: {
    structured: {
      anonymised_case: {
        presenting_complaint:
          "Three months of progressive fatigue, unintentional weight gain, persistent cold intolerance, hair thinning and low mood.",
        symptom_timeline: "Gradual onset over about three months, steadily worsening.",
        symptom_details: [
          "crushing fatigue",
          "roughly 8 kg weight gain without a change in diet",
          "feels cold when others are warm",
          "increased hair loss",
          "low mood and low motivation",
          "irregular periods",
        ],
        relevant_history: "No regular medications; no significant family history reported.",
        lifestyle_context: "Initially attributed the symptoms to stress.",
        patient_demographics: "Woman, mid-30s.",
      },
      removed_identifiers: ["Exact age replaced with an age range"],
      case_complexity: "medium",
      urgent_flags: [],
    },
    reviews: {
      gp: rv(
        "gp",
        "Primary hypothyroidism",
        80,
        "The combination of fatigue, weight gain, cold intolerance, hair loss and menstrual change is a common, textbook hypothyroid picture, and it is eminently treatable, so it is worth confirming quickly.",
        [
          ["Primary hypothyroidism", 78, "classic symptom cluster"],
          ["Iron-deficiency anaemia", 12, "fatigue and hair loss overlap"],
          ["Depression", 8, "low mood and low motivation"],
        ],
        ["TSH", "Free T4", "Full blood count", "Ferritin"],
        "The cluster is textbook thyroid, but fatigue is often multifactorial, I would still check ferritin and screen mood.",
        [
          "Any neck swelling or family history of thyroid disease?",
          "How is your mood day to day?",
          "Any change in bowel habit or dry skin?",
        ]
      ),
      cardiologist: rv(
        "cardiologist",
        "Hypothyroidism with cardiovascular monitoring",
        68,
        "The picture fits hypothyroidism, which I care about because untreated it slows the heart, worsens the lipid profile and can occasionally cause a pericardial effusion.",
        [
          ["Hypothyroidism", 70, "systemic slowdown"],
          ["Anaemia", 15, "exertional fatigue"],
        ],
        ["TSH", "Free T4", "Lipid profile", "ECG"],
        "Untreated hypothyroidism raises cardiovascular risk and can cause bradycardia, an ECG and lipids are worth doing alongside the thyroid panel.",
        ["Any palpitations, chest tightness or ankle swelling?", "Family history of heart disease?"]
      ),
      endocrinologist: rv(
        "endocrinologist",
        "Primary hypothyroidism, likely Hashimoto's thyroiditis",
        92,
        "This is a hypothyroid presentation until proven otherwise. The menstrual change with cold intolerance and weight gain points to an autoimmune thyroiditis, which antibodies will confirm.",
        [
          ["Hashimoto's thyroiditis", 88, "autoimmune pattern"],
          ["Subclinical hypothyroidism", 10, "milder biochemical form"],
        ],
        ["TSH", "Free T4", "Anti-TPO antibodies", "Prolactin"],
        "The autoimmune angle is the key one others under-weight, anti-TPO antibodies will pin down Hashimoto's and change long-term monitoring.",
        ["Any dry skin or constipation?", "Family history of autoimmune disease?"]
      ),
      rheumatologist: rv(
        "rheumatologist",
        "Autoimmune hypothyroidism; screen for coexisting autoimmunity",
        74,
        "A multi-system picture in a young woman makes me think autoimmune. Thyroid disease is the front-runner, but autoimmune conditions cluster, so I keep an eye out for others.",
        [
          ["Autoimmune hypothyroidism", 72, "multi-system, female, insidious"],
          ["Early connective-tissue disease", 14, "fatigue plus hair changes"],
        ],
        ["TSH", "Anti-TPO antibodies", "ANA", "ESR / CRP"],
        "If thyroid antibodies are positive, I would stay alert for other autoimmune features rather than close the book.",
        ["Any joint pain, dry eyes or mouth, or new rashes?"]
      ),
      neurologist: rv(
        "neurologist",
        "Hypothyroidism versus primary depressive disorder",
        61,
        "The physical picture fits hypothyroidism well, but the low mood and loss of motivation deserve their own consideration, I would not simply assume they are secondary.",
        [
          ["Hypothyroidism", 60, "physical symptom cluster"],
          ["Primary depressive disorder", 30, "prominent mood and motivation change"],
        ],
        ["TSH", "Free T4", "Mood screen (PHQ-9)", "B12 and folate"],
        "The low mood may be a primary depression running alongside the thyroid problem, I would screen for it rather than expect it to lift with treatment.",
        [
          "When did the low mood start relative to the physical symptoms?",
          "Any change in sleep or concentration?",
        ]
      ),
    },
    consensus: {
      consensus_diagnosis: "Primary hypothyroidism",
      agreement_level: "strong",
      probability_distribution: [
        { diagnosis: "Primary hypothyroidism", probability: 82, specialists_agreeing: 5 },
        { diagnosis: "Primary depressive disorder", probability: 24, specialists_agreeing: 1 },
        { diagnosis: "Iron-deficiency anaemia", probability: 14, specialists_agreeing: 2 },
        { diagnosis: "Perimenopausal hormone change", probability: 9, specialists_agreeing: 1 },
      ],
      key_agreements: [
        "The symptom cluster, cold intolerance, weight gain, hair loss, fatigue and menstrual change, fits a classic hypothyroid pattern.",
        "A thyroid function panel is the single highest-value first test.",
        "Low urgency, but a genuinely treatable cause worth confirming promptly.",
      ],
      key_disagreements: [
        {
          point: "Is the low mood a symptom of the thyroid, or a primary mood disorder?",
          majority_view: "Treat the thyroid first; the mood should lift as levels normalise.",
          minority_view: "Screen for depression in parallel, do not assume it resolves with treatment.",
          why_it_matters:
            "If mood does not improve after thyroid correction, an untreated primary depression would otherwise be missed.",
        },
      ],
      recommended_investigations: [
        "TSH",
        "Free T4",
        "Anti-TPO antibodies",
        "Full blood count",
        "Ferritin",
      ],
      urgent_actions: [],
      gp_summary:
        "A three-month history of fatigue, unintentional weight gain, cold intolerance, hair thinning, low mood and menstrual irregularity points strongly to primary hypothyroidism. All five reviewers recommend a thyroid function panel with antibodies as the priority. One reviewer advises screening for a primary mood disorder in parallel.",
      patient_note:
        "I've had three months of fatigue, weight gain and feeling cold, and I'd like my thyroid checked.",
      safety_netting: [
        "Chest pain, severe breathlessness or fainting",
        "Rapidly worsening drowsiness, confusion, or feeling very cold and unresponsive",
      ],
    },
    triage: {
      urgency: "soon",
      recommended_specialty: "Endocrinology",
      routing_rationale:
        "A classic hypothyroid symptom cluster; an endocrinologist can confirm the diagnosis and start treatment. Not an emergency, but should be seen soon.",
      key_risk_factors: ["three-month progressive course", "menstrual disturbance"],
    },
    redTeam: {
      confidence_in_consensus: 84,
      overlooked_possibilities: [
        "Iron-deficiency anaemia contributing to the fatigue and hair loss",
        "Coeliac disease, which is associated with autoimmune thyroid disease",
      ],
      challenges: [
        {
          claim: "The low mood is secondary to hypothyroidism.",
          challenge:
            "It may be a co-existing primary depression; treating the thyroid alone could leave it unaddressed.",
        },
      ],
      safety_concerns: [
        "A very low heart rate, confusion or severe cold intolerance would raise concern for myxoedema and needs urgent review.",
      ],
      recommendation:
        "Confirm with a thyroid panel including antibodies, screen mood in parallel, and re-evaluate if symptoms persist after treatment.",
    },
  },

  cough: {
    structured: {
      anonymised_case: {
        presenting_complaint:
          "Three weeks of a new, worsening persistent cough with unintentional weight loss and increasing breathlessness on exertion.",
        symptom_timeline: "About three weeks, progressive.",
        symptom_details: [
          "persistent cough, sometimes dry, sometimes productive",
          "roughly 4 kg unintentional weight loss",
          "more breathless walking up stairs than before",
          "no fever",
        ],
        relevant_history: "Former smoker, stopped around ten years ago.",
        lifestyle_context: "",
        patient_demographics: "Man, early 50s.",
      },
      removed_identifiers: ["Exact age replaced with an age range"],
      case_complexity: "high",
      urgent_flags: [
        "A new persistent cough for more than three weeks with unintentional weight loss in a former smoker needs prompt assessment and a chest X-ray.",
      ],
    },
    reviews: {
      gp: rv(
        "gp",
        "Red-flag cough, urgent chest X-ray to exclude lung cancer",
        55,
        "In a former smoker, a cough persisting beyond three weeks with unintentional weight loss ticks urgent-referral boxes. This should not be watched to see if it settles.",
        [
          ["Lung malignancy", 45, "ex-smoker, weight loss, progressive cough"],
          ["COPD", 25, "smoking history and breathlessness"],
          ["Chest infection", 15, "productive cough"],
        ],
        ["Urgent chest X-ray", "Full blood count", "Sputum studies"],
        "This is a two-week-wait pattern, the priority is imaging now, not a trial of treatment.",
        ["Have you coughed up any blood?", "Any chest pain or hoarseness?"],
        ["Persistent cough over three weeks with weight loss in a former smoker"]
      ),
      cardiologist: rv(
        "cardiologist",
        "Exclude a cardiac cause of the breathlessness",
        40,
        "Everyone will rightly chase the lungs, but exertional breathlessness in this age group can be early heart failure, I would not let that be missed.",
        [
          ["Pulmonary cause", 45, "cough dominates the picture"],
          ["Heart failure", 30, "exertional breathlessness"],
        ],
        ["ECG", "BNP", "Chest X-ray", "Echocardiogram"],
        "Breathlessness on stairs may be cardiac; an ECG and BNP alongside the respiratory work-up catch a treatable cause.",
        ["Any ankle swelling, or waking at night short of breath?"],
        ["New exertional breathlessness"]
      ),
      endocrinologist: rv(
        "endocrinologist",
        "Investigate for malignancy; consider metabolic causes of weight loss",
        35,
        "The respiratory red flags lead, but unintentional weight loss also warrants a look at thyroid and glucose while imaging is arranged.",
        [
          ["Malignancy", 40, "unintentional weight loss"],
          ["Hyperthyroidism", 12, "weight loss with systemic symptoms"],
          ["Diabetes", 8, "weight loss"],
        ],
        ["Thyroid function tests", "HbA1c", "Chest X-ray"],
        "Weight loss has metabolic causes too, cheap blood tests run in parallel with imaging.",
        ["Any heat intolerance, tremor, or excessive thirst?"],
        ["Unintentional weight loss"]
      ),
      rheumatologist: rv(
        "rheumatologist",
        "Exclude malignancy; consider interstitial lung disease",
        33,
        "A progressive cough can be an inflammatory or autoimmune lung process. Malignancy must be excluded first, but I would keep interstitial lung disease and vasculitis in mind.",
        [
          ["Lung malignancy", 40, "progressive cough and weight loss"],
          ["Interstitial lung disease / vasculitis", 18, "progressive respiratory decline"],
        ],
        ["Chest X-ray then CT", "ANA / ANCA", "ESR / CRP"],
        "If imaging is not clear-cut, an autoimmune lung process is worth screening for.",
        ["Any joint pains, rashes, or dry eyes?"],
        ["Progressive respiratory symptoms with systemic features"]
      ),
      neurologist: rv(
        "neurologist",
        "No primary neurological cause; supports urgent respiratory work-up",
        30,
        "There is nothing neurological driving this. My contribution is to flag that new neurological symptoms, with a suspected lung lesion, would raise paraneoplastic or metastatic concern.",
        [
          ["Respiratory cause", 60, "cough and weight loss"],
          ["Paraneoplastic / metastatic (if new deficits)", 10, "would need new neuro signs"],
        ],
        ["Chest X-ray", "Neurological examination if new symptoms appear"],
        "No neuro red flags now, but new weakness or unsteadiness alongside a lung mass changes the picture quickly.",
        ["Any new headaches, weakness or numbness?"],
        ["Weight loss with progressive systemic illness"]
      ),
    },
    consensus: {
      consensus_diagnosis:
        "Urgent investigation needed, possible lung malignancy, with a cardiac cause to be excluded",
      agreement_level: "moderate",
      probability_distribution: [
        { diagnosis: "Lung malignancy", probability: 42, specialists_agreeing: 4 },
        { diagnosis: "COPD / chronic lung disease", probability: 22, specialists_agreeing: 2 },
        { diagnosis: "Heart failure (cardiac cause)", probability: 20, specialists_agreeing: 1 },
        { diagnosis: "Chest infection", probability: 12, specialists_agreeing: 1 },
      ],
      key_agreements: [
        "This is a red-flag combination: a persistent cough over three weeks with unintentional weight loss in a former smoker.",
        "An urgent chest X-ray is the immediate priority.",
        "Do not wait to see whether the symptoms settle on their own.",
      ],
      key_disagreements: [
        {
          point: "Is the breathlessness primarily a lung or a heart problem?",
          majority_view: "Most attribute it to a pulmonary cause and prioritise the chest X-ray.",
          minority_view: "Cardiology would exclude heart failure in parallel with an ECG and BNP.",
          why_it_matters:
            "A treatable cardiac cause could be missed if every symptom is attributed to the lungs.",
        },
      ],
      recommended_investigations: [
        "Urgent chest X-ray",
        "Full blood count",
        "ECG",
        "Blood tests including inflammatory markers",
      ],
      urgent_actions: [
        "See a doctor within days for an urgent chest X-ray and referral.",
        "Seek same-day care if you cough up blood or become acutely breathless.",
      ],
      gp_summary:
        "A three-week history of a worsening persistent cough with about 4 kg of unintentional weight loss and new breathlessness on exertion in a former smoker is a red-flag presentation. All five reviewers advise urgent investigation led by a chest X-ray to exclude lung malignancy; cardiology would also exclude a cardiac cause of the breathlessness.",
      patient_note:
        "I've had a worsening cough for three weeks with weight loss and breathlessness, and I'd like an urgent chest X-ray.",
      safety_netting: [
        "Coughing up blood",
        "Severe or sudden breathlessness, or chest pain",
        "Fainting or a racing heartbeat",
      ],
    },
    triage: {
      urgency: "urgent",
      recommended_specialty: "Respiratory Medicine",
      routing_rationale:
        "A red-flag cough with weight loss in a former smoker warrants urgent respiratory assessment and imaging within days.",
      key_risk_factors: [
        "former smoker",
        "unintentional weight loss",
        "progressive symptoms over three weeks",
      ],
    },
    redTeam: {
      confidence_in_consensus: 72,
      overlooked_possibilities: [
        "Tuberculosis, particularly with any night sweats or known exposure",
        "Pulmonary embolism, given the new exertional breathlessness",
      ],
      challenges: [
        {
          claim: "This is most likely a lung malignancy.",
          challenge:
            "The evidence is a risk pattern, not a diagnosis. Imaging is required before concluding; infective and benign causes remain possible.",
        },
      ],
      safety_concerns: [
        "Coughing up blood, acute breathlessness or chest pain requires same-day assessment.",
      ],
      recommendation:
        "Do not delay the chest X-ray; exclude a cardiac cause in parallel; give clear, specific safety-netting.",
    },
  },

  migraine: {
    structured: {
      anonymised_case: {
        presenting_complaint:
          "Recurrent one-sided headaches preceded by a visual aura, about twice a month.",
        symptom_timeline: "Recurrent, roughly twice a month; each episode lasts 6 to 8 hours.",
        symptom_details: [
          "one-sided headache",
          "visual aura (zigzag lines) for about 20 minutes beforehand",
          "sensitivity to light and sound",
          "episodes last 6 to 8 hours",
        ],
        relevant_history: "Mother had the same pattern of headaches.",
        lifestyle_context: "",
        patient_demographics: "Woman, late 20s.",
      },
      removed_identifiers: ["Exact age replaced with an age range"],
      case_complexity: "low",
      urgent_flags: [],
    },
    reviews: {
      gp: rv(
        "gp",
        "Migraine with aura",
        88,
        "This is a classic migraine-with-aura history: a visual aura, then a one-sided headache with light and sound sensitivity, on a recurring basis with a positive family history.",
        [
          ["Migraine with aura", 88, "aura then unilateral headache"],
          ["Tension-type headache", 8, "common but no aura"],
        ],
        ["Usually a clinical diagnosis", "Blood pressure check"],
        "No imaging is needed unless red-flag features appear, reassurance and management are the priorities.",
        ["What tends to trigger the attacks?", "How many days a month are you affected?"]
      ),
      cardiologist: rv(
        "cardiologist",
        "Migraine with aura",
        72,
        "I agree it is migraine with aura. My specific concern is vascular: aura slightly raises stroke risk, which matters for contraception and smoking advice.",
        [["Migraine with aura", 80, "typical aura history"]],
        ["Blood pressure", "Cardiovascular risk review"],
        "Migraine with aura combined with the combined oral contraceptive raises stroke risk, worth reviewing contraception.",
        ["Do you use the combined pill? Do you smoke?"]
      ),
      endocrinologist: rv(
        "endocrinologist",
        "Migraine with aura",
        70,
        "The pattern is migraine with aura. From my angle, I would look for a hormonal (menstrual) relationship, which changes how it is managed.",
        [
          ["Migraine with aura", 78, "aura and unilateral pain"],
          ["Menstrual (hormonal) migraine", 40, "possible cyclical pattern"],
        ],
        ["Headache and menstrual-cycle diary"],
        "Tracking attacks against the menstrual cycle can reveal a hormonal pattern that opens up specific treatment options.",
        ["Do the attacks cluster around your period?"]
      ),
      rheumatologist: rv(
        "rheumatologist",
        "Migraine with aura",
        68,
        "Nothing here suggests an inflammatory or secondary headache. This is a primary headache disorder, migraine with aura.",
        [["Migraine with aura", 75, "no inflammatory features"]],
        ["No specific tests unless the picture becomes atypical"],
        "I actively looked for and did not find features of a secondary or inflammatory cause, that absence is reassuring.",
        ["Any jaw pain on chewing, scalp tenderness, or visual loss?"]
      ),
      neurologist: rv(
        "neurologist",
        "Migraine with aura",
        90,
        "A textbook visual aura followed by a unilateral throbbing headache with photophobia and phonophobia, recurring, with a family history, this is migraine with aura.",
        [
          ["Migraine with aura", 90, "classic aura then headache"],
          ["Other primary headache", 6, "less consistent with aura"],
        ],
        ["Clinical diagnosis", "Imaging only if red flags develop"],
        "This does not need a brain scan without red flags; over-imaging classic migraine causes anxiety and incidental findings.",
        ["Any weakness, speech difficulty, or aura lasting more than an hour?"]
      ),
    },
    consensus: {
      consensus_diagnosis: "Migraine with aura",
      agreement_level: "strong",
      probability_distribution: [
        { diagnosis: "Migraine with aura", probability: 90, specialists_agreeing: 5 },
        { diagnosis: "Menstrual (hormonal) migraine", probability: 38, specialists_agreeing: 1 },
        { diagnosis: "Tension-type headache", probability: 10, specialists_agreeing: 1 },
      ],
      key_agreements: [
        "The visual aura followed by a one-sided headache with light and sound sensitivity is a classic migraine-with-aura pattern.",
        "The positive family history supports the diagnosis.",
        "This is a clinical diagnosis, brain imaging is not needed without red-flag features.",
      ],
      key_disagreements: [],
      recommended_investigations: ["Blood pressure check", "Headache and menstrual-cycle diary"],
      urgent_actions: [],
      gp_summary:
        "Recurrent one-sided headaches preceded by a roughly 20-minute visual aura, with light and sound sensitivity and a positive family history, are consistent with migraine with aura. All five reviewers agree; it is a clinical diagnosis that does not require imaging without red flags. Note that migraine with aura interacts with combined hormonal contraception.",
      patient_note:
        "I get one-sided headaches with visual zigzags beforehand, about twice a month, I think it's migraine with aura and I'd like to discuss treatment.",
      safety_netting: [
        "A sudden 'worst-ever' headache, or a headache that is suddenly different from usual",
        "Weakness, numbness, difficulty speaking, or an aura lasting more than an hour",
        "Fever with a stiff neck, or a headache after a head injury",
      ],
    },
    triage: {
      urgency: "routine",
      recommended_specialty: "Neurology",
      routing_rationale:
        "A typical migraine-with-aura pattern for routine confirmation and management. No red flags requiring urgent care.",
      key_risk_factors: ["stroke-risk interaction with combined hormonal contraception"],
    },
    redTeam: {
      confidence_in_consensus: 88,
      overlooked_possibilities: [
        "A secondary cause should be reconsidered only if the aura pattern changes or new neurology appears",
      ],
      challenges: [
        {
          claim: "No brain imaging is needed.",
          challenge:
            "Correct for a stable, typical pattern, but any change in the aura, new neurological signs, or a 'worst-ever' headache should trigger urgent reassessment.",
        },
      ],
      safety_concerns: [
        "A sudden severe headache, or an aura lasting more than an hour, needs urgent review.",
      ],
      recommendation:
        "Confirm the diagnosis clinically, review contraception, and set up a headache diary with a clear safety-net.",
    },
  },
};

function detectScenario(text: string): ScenarioId | "generic" {
  const t = text.toLowerCase();
  if (/aura|zigzag|migraine|headache|one side of my head/.test(t)) return "migraine";
  if (/cough|breathless|smoker|weight loss|coughing/.test(t)) return "cough";
  if (
    /thyroid|feel cold|cold all the time|cold intolerance|weight.*gain|gained.*kg|hair (falling|loss|thin)|hair.*fall|fatigue|periods|menstrual/.test(
      t
    )
  ) {
    return "hypothyroid";
  }
  return "generic";
}

function textOfCase(c: {
  presenting_complaint: string;
  symptom_timeline: string;
  symptom_details: string[];
  relevant_history: string;
  patient_demographics: string;
}): string {
  return [
    c.presenting_complaint,
    c.symptom_timeline,
    c.symptom_details.join(" "),
    c.relevant_history,
    c.patient_demographics,
  ].join(" ");
}

/* ─────────────────────────── generic fallback ─────────────────────────── */

const GENERIC_ANGLE: Record<string, { miss: string; tests: string[]; q: string[] }> = {
  gp: {
    miss: "The first job is a thorough history and examination to decide which direction to investigate.",
    tests: ["Full history and examination", "Basic blood panel as guided by findings"],
    q: ["When did this start and how has it changed?", "Is anything making it better or worse?"],
  },
  cardiologist: {
    miss: "If any chest, breathlessness or palpitation symptoms are present, a cardiac cause should be excluded.",
    tests: ["Blood pressure", "ECG if cardiac symptoms are present"],
    q: ["Any chest pain, palpitations or breathlessness?"],
  },
  endocrinologist: {
    miss: "Fatigue, weight change or temperature intolerance would prompt thyroid and glucose testing.",
    tests: ["Thyroid function tests if relevant", "HbA1c if relevant"],
    q: ["Any change in weight, energy or temperature tolerance?"],
  },
  rheumatologist: {
    miss: "Multi-system or joint symptoms would raise the possibility of an inflammatory condition.",
    tests: ["Inflammatory markers (ESR / CRP) if relevant"],
    q: ["Any joint pain, rashes, or symptoms in more than one part of the body?"],
  },
  neurologist: {
    miss: "Any neurological symptoms, headache, weakness, numbness, cognitive change, would need focused assessment.",
    tests: ["Neurological examination if relevant"],
    q: ["Any headaches, weakness, numbness or changes in thinking?"],
  },
};

function genericReview(specialist: Specialist): Review {
  const angle = GENERIC_ANGLE[specialist.id] ?? GENERIC_ANGLE.gp;
  return rv(
    specialist.id,
    "Clinical assessment recommended",
    40,
    `From a ${specialist.specialty.toLowerCase()} perspective, there isn't enough structured detail here for a confident diagnosis; a clinician should take a full history and examination.`,
    [["Insufficient information for a specific diagnosis", 40, "needs history and examination"]],
    angle.tests,
    angle.miss,
    angle.q
  );
}

function genericConsensus(reviewCount: number): Consensus {
  return {
    consensus_diagnosis: "No clear consensus, clinical assessment recommended",
    agreement_level: "weak",
    probability_distribution: [
      { diagnosis: "Requires clinical assessment", probability: 40, specialists_agreeing: reviewCount },
    ],
    key_agreements: [
      "The description would benefit from a full history and examination by a clinician before a specific diagnosis can be reached.",
    ],
    key_disagreements: [],
    recommended_investigations: [
      "History and physical examination",
      "Basic blood panel as guided by findings",
    ],
    urgent_actions: [],
    gp_summary:
      "This is a general, information-limited summary. The reviewers agree that a qualified clinician should take a full history and examine the patient to reach a specific diagnosis. Bring a clear timeline of the symptoms to the appointment.",
    patient_note:
      "I'd like a full assessment of my symptoms, here is a summary of what I've been experiencing.",
    safety_netting: [
      "Severe or rapidly worsening symptoms",
      "Chest pain, difficulty breathing, fainting or new confusion",
      "Any symptom that frightens you, seek urgent care",
    ],
  };
}

const GENERIC_TRIAGE: Triage = {
  urgency: "routine",
  recommended_specialty: "General Practice",
  routing_rationale:
    "There isn't enough structured detail to route to a specialty; a GP should take a full history first.",
  key_risk_factors: [],
};

function genericRedTeam(): RedTeam {
  return {
    confidence_in_consensus: 30,
    overlooked_possibilities: [
      "With limited information, a full history may reveal red flags not captured here.",
    ],
    challenges: [
      {
        claim: "No specific diagnosis was reached.",
        challenge:
          "This reflects missing information rather than a benign presentation, 'no consensus' is not reassurance.",
      },
    ],
    safety_concerns: ["Any severe or rapidly worsening symptom needs prompt assessment."],
    recommendation: "A clinician should take a full history and examination.",
  };
}

/* ─────────────────────────── public mock API ─────────────────────────── */

export async function mockStructure(rawInput: string): Promise<StructureResult> {
  await sleep(700);
  const scenario = detectScenario(rawInput);
  if (scenario === "generic") {
    const trimmed = rawInput.trim().replace(/\s+/g, " ");
    const complaint = trimmed.length > 240 ? `${trimmed.slice(0, 237)}…` : trimmed;
    return {
      anonymised_case: {
        presenting_complaint: complaint || "Symptoms described by the patient.",
        symptom_timeline: "",
        symptom_details: [],
        relevant_history: "",
        lifestyle_context: "",
        patient_demographics: "",
      },
      removed_identifiers: [],
      case_complexity: "medium",
      urgent_flags: [],
    };
  }
  return SCENARIOS[scenario].structured;
}

export async function mockReview(
  specialist: Specialist,
  anonymised: Parameters<typeof textOfCase>[0]
): Promise<Review> {
  // Stagger completion so the live review theatre animates.
  const idx = Math.max(0, SPECIALISTS.findIndex((s) => s.id === specialist.id));
  await sleep(500 + idx * 450 + Math.random() * 300);

  const scenario = detectScenario(textOfCase(anonymised));
  if (scenario === "generic") return genericReview(specialist);
  return SCENARIOS[scenario].reviews[specialist.id] ?? genericReview(specialist);
}

export async function mockConsensus(
  anonymised: Parameters<typeof textOfCase>[0],
  reviews: Review[]
): Promise<Consensus> {
  await sleep(1100);
  const scenario = detectScenario(textOfCase(anonymised));
  if (scenario === "generic") return genericConsensus(reviews.length);
  return SCENARIOS[scenario].consensus;
}

export async function mockTriage(
  anonymised: Parameters<typeof textOfCase>[0]
): Promise<Triage> {
  await sleep(500);
  const scenario = detectScenario(textOfCase(anonymised));
  if (scenario === "generic") return GENERIC_TRIAGE;
  return SCENARIOS[scenario].triage;
}

export async function mockRedTeam(
  anonymised: Parameters<typeof textOfCase>[0]
): Promise<RedTeam> {
  await sleep(900);
  const scenario = detectScenario(textOfCase(anonymised));
  if (scenario === "generic") return genericRedTeam();
  return SCENARIOS[scenario].redTeam;
}
