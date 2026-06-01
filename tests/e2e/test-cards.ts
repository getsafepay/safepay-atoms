export type TestCardOutcome = 'proceed' | 'reject';
export type TestCardFlow = 'frictionless' | 'step-up';

export interface TestCard {
  scenario: string;
  description: string;
  number: string;
  expiry: { mm: string; yy: string };
  cvv: string;
  flow: TestCardFlow;
  outcome: TestCardOutcome;
}

const EXPIRY = { mm: '12', yy: '34' };
const CVV = '123';

export const TEST_CARDS: TestCard[] = [
  // ─── Frictionless ────────────────────────────────────────────────────────────
  {
    scenario: '2.1',
    description: 'Successful Frictionless Authentication (Visa)',
    number: '4456530000001005',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'frictionless',
    outcome: 'proceed',
  },
  {
    scenario: '2.1',
    description: 'Successful Frictionless Authentication (Mastercard)',
    number: '5200000000001005',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'frictionless',
    outcome: 'proceed',
  },
  {
    scenario: '2.2',
    description: 'Unsuccessful Frictionless Authentication (Visa)',
    number: '4456530000001013',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'frictionless',
    outcome: 'reject',
  },
  {
    scenario: '2.2',
    description: 'Unsuccessful Frictionless Authentication (Mastercard)',
    number: '5200000000001013',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'frictionless',
    outcome: 'reject',
  },
  {
    scenario: '2.3',
    description: 'Attempts Processing Frictionless Authentication (Visa)',
    number: '4456530000001021',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'frictionless',
    outcome: 'proceed',
  },
  {
    scenario: '2.3',
    description: 'Attempts Processing Frictionless Authentication (Mastercard)',
    number: '5200000000001021',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'frictionless',
    outcome: 'proceed',
  },
  {
    scenario: '2.4',
    description: 'Unavailable Frictionless Authentication (Visa)',
    number: '4456530000001039',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'frictionless',
    outcome: 'proceed',
  },
  {
    scenario: '2.4',
    description: 'Unavailable Frictionless Authentication (Mastercard)',
    number: '5200000000001039',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'frictionless',
    outcome: 'proceed',
  },
  {
    scenario: '2.5',
    description: 'Rejected Frictionless Authentication (Visa)',
    number: '4456530000001047',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'frictionless',
    outcome: 'reject',
  },
  {
    scenario: '2.5',
    description: 'Rejected Frictionless Authentication (Mastercard)',
    number: '5200000000001047',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'frictionless',
    outcome: 'reject',
  },
  {
    scenario: '2.6',
    description: 'Authentication Not Available on Lookup (Visa)',
    number: '4456530000001054',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'frictionless',
    outcome: 'proceed',
  },
  {
    scenario: '2.6',
    description: 'Authentication Not Available on Lookup (Mastercard)',
    number: '5200000000001054',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'frictionless',
    outcome: 'proceed',
  },
  {
    scenario: '2.7',
    description: 'Enrollment Check Error (Visa)',
    number: '4456530000001062',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'frictionless',
    outcome: 'proceed',
  },
  {
    scenario: '2.7',
    description: 'Enrollment Check Error (Mastercard)',
    number: '5200000000001062',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'frictionless',
    outcome: 'proceed',
  },
  {
    scenario: '2.8',
    description: 'Time-Out (Visa)',
    number: '4456530000001070',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'frictionless',
    outcome: 'proceed',
  },
  {
    scenario: '2.8',
    description: 'Time-Out (Mastercard)',
    number: '5200000000001070',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'frictionless',
    outcome: 'proceed',
  },
  {
    scenario: '2.9',
    description: 'Bypassed Authentication (Visa)',
    number: '4456530000001088',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'frictionless',
    outcome: 'proceed',
  },
  {
    scenario: '2.9',
    description: 'Bypassed Authentication (Mastercard)',
    number: '5200000000001088',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'frictionless',
    outcome: 'proceed',
  },

  // ─── Step-up (challenge) ──────────────────────────────────────────────────────
  {
    scenario: '2.10a',
    description: 'Successful Step-Up Authentication (Visa)',
    number: '4456530000001096',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'step-up',
    outcome: 'proceed',
  },
  {
    scenario: '2.10a',
    description: 'Successful Step-Up Authentication (Mastercard)',
    number: '5200000000001096',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'step-up',
    outcome: 'proceed',
  },
  {
    scenario: '2.11a',
    description: 'Unsuccessful Step-Up Authentication (Visa)',
    number: '4456530000001104',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'step-up',
    outcome: 'reject',
  },
  {
    scenario: '2.11a',
    description: 'Unsuccessful Step-Up Authentication (Mastercard)',
    number: '5200000000001104',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'step-up',
    outcome: 'reject',
  },
  {
    scenario: '2.12a',
    description: 'Unavailable Step-Up Authentication (Visa)',
    number: '4456530000001112',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'step-up',
    outcome: 'proceed',
  },
  {
    scenario: '2.12a',
    description: 'Unavailable Step-Up Authentication (Mastercard)',
    number: '5200000000001112',
    expiry: EXPIRY,
    cvv: CVV,
    flow: 'step-up',
    outcome: 'proceed',
  },
];

export const REGRESSION_CARDS = TEST_CARDS.filter((c) =>
  ['2.1', '2.2', '2.10a', '2.11a'].includes(c.scenario)
);
