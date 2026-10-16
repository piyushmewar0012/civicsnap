import React from 'react';
import { MapPin, Compass } from 'lucide-react';

interface LocationInputProps {
  location: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const LocationInput: React.FC<LocationInputProps> = ({ location, onChange, disabled }) => {
  return (
    <div className="glass-panel card-left-blue rounded-2xl p-5 sm:p-6 shadow-glow-blue backdrop-blur-xl space-y-3.5">
      <div className="flex items-center justify-between pb-2 border-b border-purple-500/15">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-300">
            <Compass className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <label htmlFor="location-input" className="block text-xs font-bold font-display uppercase tracking-wider text-slate-100">
              Location Details
            </label>
            <p className="text-[11px] text-slate-400">
              Specify the street address or nearby landmarks
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase bg-blue-950/80 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full shadow-xs">
          Required
        </span>
      </div>

      <div className="relative rounded-xl shadow-inner">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <MapPin className="w-4 h-4 text-blue-400" />
        </div>
        <input
          id="location-input"
          type="text"
          value={location}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="e.g. Near 4th Cross, opposite City Health Clinic, Main Bazaar Road"
          className="block w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-[#090b17] border border-blue-500/30 rounded-xl placeholder:text-slate-500 text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-400 disabled:opacity-50 transition-all font-mono"
        />
      </div>

      <p className="text-[11px] text-slate-400">
        Adding specific landmarks or cross streets helps municipal teams locate the issue quickly.
      </p>
    </div>
  );
};
