// src/components/settings/shared/SettingsNumberField.tsx
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface SettingsNumberFieldProps {
  id: string;
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  suffix?: string;
}

export default function SettingsNumberField({
  id,
  label,
  description,
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled = false,
  suffix
}: SettingsNumberFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      <div className="flex items-center space-x-2">
        <Input
          id={id}
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500"
        />
        {suffix && (
          <span className="text-sm text-gray-600 whitespace-nowrap">{suffix}</span>
        )}
      </div>
      {description && (
        <p className="text-xs text-gray-600">{description}</p>
      )}
    </div>
  );
}