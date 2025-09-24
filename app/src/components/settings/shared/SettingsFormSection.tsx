// src/components/settings/shared/SettingsFormSection.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface SettingsFormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function SettingsFormSection({ 
  title, 
  description, 
  children, 
  className = "" 
}: SettingsFormSectionProps) {
  return (
    <Card className={`border border-gray-200 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-medium text-gray-900">{title}</CardTitle>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}