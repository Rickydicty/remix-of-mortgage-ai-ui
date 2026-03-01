import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, MapPin, X } from "lucide-react";
import { IRISH_COUNTIES } from "@/lib/irishLocations";
import { cn } from "@/lib/utils";

// Common Irish town/area data for autocomplete
const IRISH_AREAS: { name: string; county: string }[] = [
  // Dublin areas
  { name: "Ballsbridge", county: "Dublin" },
  { name: "Blackrock", county: "Dublin" },
  { name: "Clontarf", county: "Dublin" },
  { name: "Dalkey", county: "Dublin" },
  { name: "Drumcondra", county: "Dublin" },
  { name: "Dún Laoghaire", county: "Dublin" },
  { name: "Dundrum", county: "Dublin" },
  { name: "Finglas", county: "Dublin" },
  { name: "Howth", county: "Dublin" },
  { name: "Lucan", county: "Dublin" },
  { name: "Malahide", county: "Dublin" },
  { name: "Raheny", county: "Dublin" },
  { name: "Ranelagh", county: "Dublin" },
  { name: "Rathmines", county: "Dublin" },
  { name: "Swords", county: "Dublin" },
  { name: "Tallaght", county: "Dublin" },
  { name: "Terenure", county: "Dublin" },
  // Cork
  { name: "Ballincollig", county: "Cork" },
  { name: "Carrigaline", county: "Cork" },
  { name: "Cobh", county: "Cork" },
  { name: "Douglas", county: "Cork" },
  { name: "Mallow", county: "Cork" },
  { name: "Midleton", county: "Cork" },
  // Galway
  { name: "Oranmore", county: "Galway" },
  { name: "Salthill", county: "Galway" },
  { name: "Tuam", county: "Galway" },
  { name: "Ballinasloe", county: "Galway" },
  // Limerick
  { name: "Castletroy", county: "Limerick" },
  { name: "Dooradoyle", county: "Limerick" },
  { name: "Raheen", county: "Limerick" },
  // Other major towns
  { name: "Athlone", county: "Westmeath" },
  { name: "Carlow", county: "Carlow" },
  { name: "Cavan", county: "Cavan" },
  { name: "Clonmel", county: "Tipperary" },
  { name: "Drogheda", county: "Louth" },
  { name: "Dundalk", county: "Louth" },
  { name: "Ennis", county: "Clare" },
  { name: "Kilkenny", county: "Kilkenny" },
  { name: "Killarney", county: "Kerry" },
  { name: "Letterkenny", county: "Donegal" },
  { name: "Longford", county: "Longford" },
  { name: "Mullingar", county: "Westmeath" },
  { name: "Naas", county: "Kildare" },
  { name: "Navan", county: "Meath" },
  { name: "Newbridge", county: "Kildare" },
  { name: "Portlaoise", county: "Laois" },
  { name: "Roscommon", county: "Roscommon" },
  { name: "Sligo", county: "Sligo" },
  { name: "Tralee", county: "Kerry" },
  { name: "Tullamore", county: "Offaly" },
  { name: "Waterford", county: "Waterford" },
  { name: "Wexford", county: "Wexford" },
  { name: "Wicklow", county: "Wicklow" },
  { name: "Bray", county: "Wicklow" },
  { name: "Greystones", county: "Wicklow" },
  { name: "Celbridge", county: "Kildare" },
  { name: "Maynooth", county: "Kildare" },
  { name: "Leixlip", county: "Kildare" },
  { name: "Ashbourne", county: "Meath" },
  { name: "Trim", county: "Meath" },
  { name: "Monaghan", county: "Monaghan" },
  { name: "Carrick-on-Shannon", county: "Leitrim" },
];

// Combine areas + counties for search
const ALL_SUGGESTIONS = [
  ...IRISH_AREAS.map(a => ({ display: `${a.name}, Co. ${a.county}`, area: a.name, county: a.county })),
  ...IRISH_COUNTIES.map(c => ({ display: `Co. ${c}`, area: '', county: c })),
];

interface AddressLookupProps {
  prefix: string;
  formData: any;
  onChange: (field: string, value: any) => void;
  label?: string;
}

const AddressLookup = ({ prefix, formData, onChange, label = "Address Search" }: AddressLookupProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<typeof ALL_SUGGESTIONS>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const lower = value.toLowerCase();
    const matches = ALL_SUGGESTIONS.filter(s => 
      s.display.toLowerCase().includes(lower) ||
      s.area.toLowerCase().includes(lower) ||
      s.county.toLowerCase().includes(lower)
    ).slice(0, 8);

    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  };

  const handleSelect = (suggestion: typeof ALL_SUGGESTIONS[0]) => {
    // Auto-fill the address fields
    if (suggestion.area) {
      onChange(`${prefix}_address_line2`, suggestion.area);
    }
    onChange(`${prefix}_county`, suggestion.county);
    onChange(`${prefix}_country`, 'Ireland');
    
    setQuery("");
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative mb-3">
      <div className="flex items-center gap-4">
        <Label className="w-40 text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {label}
        </Label>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 pr-8"
            placeholder="Type town, area, or county to auto-fill..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
          />
          {query && (
            <button 
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      {showSuggestions && (
        <div className="absolute left-44 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={i}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors"
              onClick={() => handleSelect(s)}
            >
              <MapPin className="h-3 w-3 text-primary shrink-0" />
              <span>{s.display}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressLookup;
