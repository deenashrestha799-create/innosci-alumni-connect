import { useMemo, useState } from "react";
import { City, Country } from "country-state-city";

const countries = Country.getAllCountries();

const selectClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-teal-500 disabled:bg-slate-50 disabled:text-slate-400";

function citiesOf(countryName: string): string[] {
  const country = countries.find((c) => c.name === countryName);
  if (!country) return [];
  const names = (City.getCitiesOfCountry(country.isoCode) ?? []).map((c) => c.name);
  return [...new Set(names)].sort((a, b) => a.localeCompare(b));
}

export function LocationSelect({
  onChange,
  initial = "",
}: {
  onChange: (location: string) => void;
  initial?: string; // e.g. "Oslo, Norway"
}) {
  const parts = initial.split(",").map((p) => p.trim());
  const [countryName, setCountryName] = useState(parts.length > 1 ? parts[parts.length - 1] : "");
  const [city, setCity] = useState(parts.length > 1 ? parts.slice(0, -1).join(", ") : "");

  const cities = useMemo(() => citiesOf(countryName), [countryName]);

  function pickCountry(name: string) {
    setCountryName(name);
    setCity("");
    // A country with no cities in the data is saved as just the country.
    onChange(name && citiesOf(name).length === 0 ? name : "");
  }

  function pickCity(value: string) {
    setCity(value);
    onChange(value ? `${value}, ${countryName}` : "");
  }

  return (
    <>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Country</span>
        <select
          value={countryName}
          onChange={(e) => pickCountry(e.target.value)}
          className={selectClass}
        >
          <option value="">Select country</option>
          {countries.map((c) => (
            <option key={c.isoCode} value={c.name}>{c.name}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">City</span>
        <select
          value={city}
          onChange={(e) => pickCity(e.target.value)}
          disabled={!countryName || cities.length === 0}
          className={selectClass}
        >
          <option value="">
            {!countryName ? "Select a country first" : cities.length === 0 ? "No cities listed" : "Select city"}
          </option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </label>
    </>
  );
}