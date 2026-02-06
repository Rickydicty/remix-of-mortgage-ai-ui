// Irish counties for address dropdowns
export const IRISH_COUNTIES = [
  "Carlow",
  "Cavan",
  "Clare",
  "Cork",
  "Donegal",
  "Dublin",
  "Galway",
  "Kerry",
  "Kildare",
  "Kilkenny",
  "Laois",
  "Leitrim",
  "Limerick",
  "Longford",
  "Louth",
  "Mayo",
  "Meath",
  "Monaghan",
  "Offaly",
  "Roscommon",
  "Sligo",
  "Tipperary",
  "Waterford",
  "Westmeath",
  "Wexford",
  "Wicklow",
] as const;

// Countries with Ireland as default
export const COUNTRIES = [
  "Ireland",
  "United Kingdom",
  "Other",
] as const;

export type IrishCounty = typeof IRISH_COUNTIES[number];
export type Country = typeof COUNTRIES[number];
