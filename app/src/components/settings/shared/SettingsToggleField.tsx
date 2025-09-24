// src/components/settings/shared/SettingsToggleField.tsx
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface SettingsToggleFieldProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function SettingsToggleField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false
}: SettingsToggleFieldProps) {
  return (
    <div className="flex items-center justify-between space-x-2">
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-base font-medium text-gray-900">
          {label}
        </Label>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="data-[state=checked]:bg-blue-600"
      />
    </div>
  );
}