// Public demo catalog: real companies, approximate city-level office locations (not street addresses),
// and role types. No people: every contact is a nameless role placeholder built in generate.ts.

export type CatalogCompany = {
  key: string;
  name: string;
  domain: string;
  industry: string;
  tier: 1 | 2 | 3;
  offices: { key: string; label: string; city: string; region: string; lat: number; lng: number; hq?: boolean }[];
};

export const CATALOG: CatalogCompany[] = [
  { key: 'crowdstrike', name: 'CrowdStrike', domain: 'crowdstrike.com', industry: 'Cybersecurity', tier: 1,
    offices: [{ key: 'aus', label: 'Austin', city: 'Austin', region: 'TX', lat: 30.402, lng: -97.726, hq: true }] },
  { key: 'aws', name: 'Amazon Web Services', domain: 'aws.amazon.com', industry: 'Cloud', tier: 1,
    offices: [
      { key: 'arl', label: 'Arlington (HQ2)', city: 'Arlington', region: 'VA', lat: 38.857, lng: -77.051 },
      { key: 'sea', label: 'Seattle', city: 'Seattle', region: 'WA', lat: 47.622, lng: -122.337, hq: true },
      { key: 'aus', label: 'Austin', city: 'Austin', region: 'TX', lat: 30.400, lng: -97.722 },
    ] },
  { key: 'palantir', name: 'Palantir', domain: 'palantir.com', industry: 'Software', tier: 1,
    offices: [
      { key: 'dc', label: 'Washington, DC', city: 'Washington', region: 'DC', lat: 38.905, lng: -77.064 },
      { key: 'nyc', label: 'New York', city: 'New York', region: 'NY', lat: 40.741, lng: -73.990 },
    ] },
  { key: 'anduril', name: 'Anduril', domain: 'anduril.com', industry: 'Defense tech', tier: 2,
    offices: [
      { key: 'dc', label: 'Washington, DC area', city: 'Arlington', region: 'VA', lat: 38.895, lng: -77.071 },
      { key: 'sea', label: 'Seattle', city: 'Seattle', region: 'WA', lat: 47.651, lng: -122.348 },
    ] },
  { key: 'salesforce', name: 'Salesforce', domain: 'salesforce.com', industry: 'SaaS', tier: 1,
    offices: [
      { key: 'nyc', label: 'New York', city: 'New York', region: 'NY', lat: 40.754, lng: -73.983 },
      { key: 'sea', label: 'Seattle', city: 'Seattle', region: 'WA', lat: 47.623, lng: -122.335 },
      { key: 'dc', label: 'Washington, DC', city: 'Washington', region: 'DC', lat: 38.902, lng: -77.032 },
    ] },
  { key: 'microsoft', name: 'Microsoft', domain: 'microsoft.com', industry: 'Software', tier: 1,
    offices: [
      { key: 'red', label: 'Redmond', city: 'Redmond', region: 'WA', lat: 47.640, lng: -122.130, hq: true },
      { key: 'res', label: 'Reston', city: 'Reston', region: 'VA', lat: 38.957, lng: -77.359 },
      { key: 'nyc', label: 'New York', city: 'New York', region: 'NY', lat: 40.756, lng: -73.986 },
    ] },
  { key: 'google', name: 'Google', domain: 'google.com', industry: 'Cloud & ads', tier: 1,
    offices: [
      { key: 'nyc', label: 'New York (Chelsea)', city: 'New York', region: 'NY', lat: 40.741, lng: -74.003 },
      { key: 'aus', label: 'Austin', city: 'Austin', region: 'TX', lat: 30.268, lng: -97.746 },
      { key: 'kir', label: 'Kirkland', city: 'Kirkland', region: 'WA', lat: 47.670, lng: -122.198 },
      { key: 'dc', label: 'Washington, DC', city: 'Washington', region: 'DC', lat: 38.899, lng: -77.025 },
    ] },
  { key: 'datadog', name: 'Datadog', domain: 'datadoghq.com', industry: 'Observability', tier: 2,
    offices: [{ key: 'nyc', label: 'New York', city: 'New York', region: 'NY', lat: 40.756, lng: -73.990, hq: true }] },
  { key: 'mongodb', name: 'MongoDB', domain: 'mongodb.com', industry: 'Database', tier: 2,
    offices: [
      { key: 'nyc', label: 'New York', city: 'New York', region: 'NY', lat: 40.753, lng: -73.988, hq: true },
      { key: 'aus', label: 'Austin', city: 'Austin', region: 'TX', lat: 30.266, lng: -97.742 },
    ] },
  { key: 'snowflake', name: 'Snowflake', domain: 'snowflake.com', industry: 'Data cloud', tier: 2,
    offices: [
      { key: 'bel', label: 'Bellevue', city: 'Bellevue', region: 'WA', lat: 47.615, lng: -122.199 },
      { key: 'nyc', label: 'New York', city: 'New York', region: 'NY', lat: 40.751, lng: -73.981 },
    ] },
  { key: 'tanium', name: 'Tanium', domain: 'tanium.com', industry: 'Cybersecurity', tier: 2,
    offices: [{ key: 'kir', label: 'Kirkland', city: 'Kirkland', region: 'WA', lat: 47.676, lng: -122.206, hq: true }] },
  { key: 'booz', name: 'Booz Allen Hamilton', domain: 'boozallen.com', industry: 'Consulting', tier: 2,
    offices: [{ key: 'mcl', label: 'McLean', city: 'McLean', region: 'VA', lat: 38.924, lng: -77.214, hq: true }] },
  { key: 'appian', name: 'Appian', domain: 'appian.com', industry: 'Low-code SaaS', tier: 2,
    offices: [{ key: 'mcl', label: 'McLean', city: 'McLean', region: 'VA', lat: 38.927, lng: -77.223, hq: true }] },
  { key: 'rapid7', name: 'Rapid7', domain: 'rapid7.com', industry: 'Cybersecurity', tier: 3,
    offices: [{ key: 'arl', label: 'Arlington', city: 'Arlington', region: 'VA', lat: 38.882, lng: -77.112 }] },
  { key: 'oracle', name: 'Oracle', domain: 'oracle.com', industry: 'Software', tier: 2,
    offices: [
      { key: 'aus', label: 'Austin', city: 'Austin', region: 'TX', lat: 30.241, lng: -97.719, hq: true },
      { key: 'sea', label: 'Seattle', city: 'Seattle', region: 'WA', lat: 47.618, lng: -122.343 },
    ] },
  { key: 'dell', name: 'Dell Technologies', domain: 'dell.com', industry: 'Hardware', tier: 3,
    offices: [{ key: 'rr', label: 'Round Rock', city: 'Round Rock', region: 'TX', lat: 30.484, lng: -97.668, hq: true }] },
  { key: 'indeed', name: 'Indeed', domain: 'indeed.com', industry: 'HR tech', tier: 3,
    offices: [{ key: 'aus', label: 'Austin', city: 'Austin', region: 'TX', lat: 30.264, lng: -97.748 }] },
  { key: 'atlassian', name: 'Atlassian', domain: 'atlassian.com', industry: 'SaaS', tier: 2,
    offices: [{ key: 'aus', label: 'Austin', city: 'Austin', region: 'TX', lat: 30.267, lng: -97.740 }] },
  { key: 'ramp', name: 'Ramp', domain: 'ramp.com', industry: 'Fintech', tier: 2,
    offices: [{ key: 'nyc', label: 'New York (Flatiron)', city: 'New York', region: 'NY', lat: 40.742, lng: -73.989, hq: true }] },
  { key: 'stripe', name: 'Stripe', domain: 'stripe.com', industry: 'Fintech', tier: 2,
    offices: [
      { key: 'sea', label: 'Seattle', city: 'Seattle', region: 'WA', lat: 47.624, lng: -122.338 },
      { key: 'nyc', label: 'New York', city: 'New York', region: 'NY', lat: 40.744, lng: -73.986 },
    ] },
  { key: 'zillow', name: 'Zillow', domain: 'zillow.com', industry: 'Proptech', tier: 3,
    offices: [{ key: 'sea', label: 'Seattle', city: 'Seattle', region: 'WA', lat: 47.607, lng: -122.336, hq: true }] },
  { key: 'smartsheet', name: 'Smartsheet', domain: 'smartsheet.com', industry: 'SaaS', tier: 3,
    offices: [{ key: 'bel', label: 'Bellevue', city: 'Bellevue', region: 'WA', lat: 47.617, lng: -122.193, hq: true }] },
  { key: 'databricks', name: 'Databricks', domain: 'databricks.com', industry: 'Data & AI', tier: 2,
    offices: [
      { key: 'bel', label: 'Bellevue', city: 'Bellevue', region: 'WA', lat: 47.613, lng: -122.196 },
      { key: 'nyc', label: 'New York', city: 'New York', region: 'NY', lat: 40.749, lng: -73.992 },
    ] },
  { key: 'wiz', name: 'Wiz', domain: 'wiz.io', industry: 'Cloud security', tier: 1,
    offices: [{ key: 'nyc', label: 'New York', city: 'New York', region: 'NY', lat: 40.739, lng: -73.993, hq: true }] },
  { key: 'cdt', name: 'Center for Democracy & Technology', domain: 'cdt.org', industry: 'Tech policy', tier: 2,
    offices: [{ key: 'dc', label: 'Washington, DC', city: 'Washington', region: 'DC', lat: 38.903, lng: -77.039, hq: true }] },
  { key: 'iti', name: 'Information Technology Industry Council', domain: 'itic.org', industry: 'Tech policy', tier: 3,
    offices: [{ key: 'dc', label: 'Washington, DC', city: 'Washington', region: 'DC', lat: 38.899, lng: -77.036, hq: true }] },
];
