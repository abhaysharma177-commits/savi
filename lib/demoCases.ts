/** Pre-built demo cases for rehearsing the pitch. Client-safe. */
export interface DemoCase {
  id: string;
  label: string;
  blurb: string;
  text: string;
}

export const DEMO_CASES: readonly DemoCase[] = [
  {
    id: "hypothyroid",
    label: "The interesting disagreement",
    blurb:
      "Strong consensus on hypothyroidism with a thought-provoking minority flag on primary vs. secondary mood disorder.",
    text: "I'm a 34-year-old woman. For the past 3 months I've had crushing fatigue, I've gained about 8kg without changing my diet, I feel cold all the time even when others are warm, my hair has been falling out more than usual, and I've been feeling low and unmotivated. I thought it was just stress but it's getting worse. My periods have also become irregular. I'm otherwise healthy, no medications, no family history of anything significant.",
  },
  {
    id: "cough",
    label: "The scary one",
    blurb:
      "Every specialist flags red flags; the urgent-actions panel fills up. Shows the system working for high-stakes cases.",
    text: "Male, early 50s. Three weeks of a new persistent cough that's getting worse. I've lost about 4kg without trying. I'm a former smoker, quit 10 years ago. No fever, no obvious infection. The cough is sometimes dry, sometimes productive. I also feel more breathless walking up stairs than I used to.",
  },
  {
    id: "migraine",
    label: "The clean consensus",
    blurb:
      "All five converge strongly on migraine with aura. Clarity when clarity exists, not manufactured disagreement.",
    text: "I'm 28, female. I get a severe headache on one side of my head about twice a month, usually with visual disturbances beforehand, like zigzag lines in my vision for about 20 minutes. The headache then comes on and lasts 6-8 hours. Light and sound make it much worse. My mum had the same thing.",
  },
];
