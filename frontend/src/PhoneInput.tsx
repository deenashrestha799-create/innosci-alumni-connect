import { useState } from "react";
import { Country } from "country-state-city";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

const countries = Country.getAllCountries();

const fieldClass =
  "rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-teal-500";

function dialCode(code: string) {
  return code.replace(/[^\d]/g, "");
}

export function PhoneInput({ onChange }: { onChange: (e164: string) => void }) {
  const [iso, setIso] = useState("");
  const [local, setLocal] = useState("");

  const parsed =
    iso && local.trim()
      ? parsePhoneNumberFromString(local, iso as CountryCode)
      : undefined;
  const valid = !!parsed?.isValid();
  const showError = !!iso && local.trim().length > 0 && !valid;

  function update(nextIso: string, nextLocal: string) {
    setIso(nextIso);
    setLocal(nextLocal);
    const result =
      nextIso && nextLocal.trim()
        ? parsePhoneNumberFromString(nextLocal, nextIso as CountryCode)
        : undefined;
    onChange(result?.isValid() ? result.number : "");
  }

  return (
    <div className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">Contact Number</span>
      <div className="flex gap-2">
        <select
          value={iso}
          onChange={(e) => update(e.target.value, local)}
          aria-label="Country code"
          className={`${fieldClass} w-36 shrink-0`}
        >
          <option value="">Code</option>
          {countries.map((c) => (
            <option key={c.isoCode} value={c.isoCode}>
              {c.flag} {c.isoCode} +{dialCode(c.phonecode)}
            </option>
          ))}
        </select>
        <input
          value={local}
          onChange={(e) => update(iso, e.target.value.replace(/[^\d\s-]/g, ""))}
          inputMode="tel"
          placeholder={iso ? "Phone number" : "Select code first"}
          disabled={!iso}
          className={`${fieldClass} w-full disabled:bg-slate-50`}
        />
      </div>
      {showError && (
        <p className="mt-1 text-xs text-red-600">Enter a valid phone number for the selected country.</p>
      )}
    </div>
  );
}