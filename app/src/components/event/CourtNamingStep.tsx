// src/components/event/CourtNamingStep.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface CourtNamingStepProps {
  numberOfCourts: number;
  courtNames: string[];
  onCourtNamesChange: (names: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function CourtNamingStep({
  numberOfCourts,
  courtNames,
  onCourtNamesChange,
  onNext,
  onBack
}: CourtNamingStepProps) {
  const [editingCourt, setEditingCourt] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  // Generate default court names
  const getDefaultCourtName = (courtNum: number) => {
    if (courtNum === 1) return "Winners Court";
    return `Court ${courtNum}`;
  };

  // Initialize court names if not provided
  const initializeCourtNames = () => {
    if (courtNames.length === 0) {
      const defaults = Array.from({ length: numberOfCourts }, (_, i) => 
        getDefaultCourtName(i + 1)
      );
      onCourtNamesChange(defaults);
    }
  };

  // Initialize on mount
  useEffect(() => {
    initializeCourtNames();
  }, [numberOfCourts]);

  const handleEditCourt = (courtIndex: number) => {
    setEditingCourt(courtIndex);
    setEditValue(courtNames[courtIndex] || getDefaultCourtName(courtIndex + 1));
  };

  const handleSaveCourt = () => {
    if (editingCourt !== null) {
      const newNames = [...courtNames];
      newNames[editingCourt] = editValue.trim() || getDefaultCourtName(editingCourt + 1);
      onCourtNamesChange(newNames);
      setEditingCourt(null);
      setEditValue("");
    }
  };

  const handleCancelEdit = () => {
    setEditingCourt(null);
    setEditValue("");
  };

  const handleResetToDefault = (courtIndex: number) => {
    const newNames = [...courtNames];
    newNames[courtIndex] = getDefaultCourtName(courtIndex + 1);
    onCourtNamesChange(newNames);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">
          🏆 Name Your Courts
        </CardTitle>
        <p className="text-center text-muted-foreground">
          Customize your court names. Court 1 is typically your main court (Winners Court).
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Court Naming Section */}
        <div className="space-y-4">
          <div className="grid gap-4">
            {Array.from({ length: numberOfCourts }, (_, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg bg-background/50">
                <Badge variant="outline" className="min-w-[80px] text-center">
                  Court {index + 1}
                </Badge>
                
                {editingCourt === index ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder={`Enter name for Court ${index + 1}`}
                      className="flex-1"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleSaveCourt} variant="default">
                      Save
                    </Button>
                    <Button size="sm" onClick={handleCancelEdit} variant="outline">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="flex-1 font-medium text-lg">
                      {courtNames[index] || getDefaultCourtName(index + 1)}
                    </span>
                    <Button 
                      size="sm" 
                      onClick={() => handleEditCourt(index)}
                      variant="outline"
                    >
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleResetToDefault(index)}
                      variant="ghost"
                      className="text-muted-foreground"
                    >
                      Reset
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h4 className="font-semibold text-blue-300 mb-2">💡 Naming Tips:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Court 1</strong> is your main court - perfect for "Winners Court"</li>
            <li>• Use <strong>sponsored names</strong> like "Coca-Cola Court"</li>
            <li>• Try <strong>descriptive names</strong> like "Garden Court" or "VIP Court"</li>
            <li>• Keep names <strong>short and memorable</strong></li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button onClick={onBack} variant="outline">
            ← Back
          </Button>
          <Button onClick={onNext} className="bg-blue-600 hover:bg-blue-700">
            Next: Add Players →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
