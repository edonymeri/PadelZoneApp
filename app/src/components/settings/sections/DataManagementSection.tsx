// src/components/settings/sections/DataManagementSection.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Database, Download, Trash2, AlertTriangle, FileText, Calendar, Users } from "lucide-react";

interface DataStats {
  players: number;
  events: number;
  rounds: number;
  matches: number;
}

interface DataManagementSectionProps {
  clubId: string;
  dataStats: DataStats;
  exporting: boolean;
  onExportData: () => Promise<void>;
  onClearData: () => Promise<void>;
  clearing: boolean;
}

export default function DataManagementSection({ 
  clubId,
  dataStats,
  exporting,
  onExportData,
  onClearData,
  clearing
}: DataManagementSectionProps) {
  
  if (!clubId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Please select a club first to manage its data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Database className="w-6 h-6 mr-2" />
          Data Management
        </h1>
        <p className="text-gray-600">Export, backup, or clear your club's tournament data</p>
      </div>

      {/* Data Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Data Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{dataStats.players}</div>
              <div className="text-sm text-gray-600">Players</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-green-100 rounded-full">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{dataStats.events}</div>
              <div className="text-sm text-gray-600">Events</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-purple-100 rounded-full">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{dataStats.rounds}</div>
              <div className="text-sm text-gray-600">Rounds</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-orange-100 rounded-full">
                <Database className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{dataStats.matches}</div>
              <div className="text-sm text-gray-600">Matches</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="w-5 h-5 mr-2" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Export all your club's data including players, events, rounds, and match results. 
            The export will be in JSON format and can be used for backup or analysis purposes.
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline">Players & Profiles</Badge>
            <Badge variant="outline">Tournament Events</Badge>
            <Badge variant="outline">Round Results</Badge>
            <Badge variant="outline">Match Scores</Badge>
            <Badge variant="outline">Club Settings</Badge>
          </div>
          
          <Button 
            onClick={onExportData} 
            disabled={exporting}
            className="w-full sm:w-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Preparing Export...' : 'Export All Data'}
          </Button>
          
          <p className="text-sm text-gray-500">
            The export file will be automatically downloaded to your device.
          </p>
        </CardContent>
      </Card>

      {/* Clear Data Warning */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center text-red-800">
            <Trash2 className="w-5 h-5 mr-2" />
            Clear All Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <p className="font-medium mb-2">⚠️ DANGER ZONE ⚠️</p>
              <p className="mb-2">
                This action will permanently delete ALL data for your club, including:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-4">
                <li>All player profiles and statistics</li>
                <li>All tournament events and their history</li>
                <li>All round results and match scores</li>
                <li>All rankings and leaderboard data</li>
              </ul>
              <p className="font-medium">
                This action cannot be undone. Make sure to export your data first if you need to keep it.
              </p>
            </div>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="destructive" 
                disabled={clearing}
                className="w-full sm:w-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {clearing ? 'Clearing Data...' : 'Clear All Data'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center text-red-600">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Confirm Data Deletion
                </DialogTitle>
                <DialogDescription className="space-y-2">
                  <p>
                    Are you absolutely sure you want to delete ALL data for this club?
                  </p>
                  <p className="font-medium text-red-600">
                    This will permanently delete:
                  </p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>{dataStats.players} player profiles</li>
                    <li>{dataStats.events} tournament events</li>
                    <li>{dataStats.rounds} rounds of play</li>
                    <li>{dataStats.matches} match results</li>
                  </ul>
                  <p className="font-medium">
                    This action cannot be undone!
                  </p>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="space-x-2">
                <Button variant="outline">Cancel</Button>
                <Button 
                  onClick={onClearData}
                  variant="destructive"
                >
                  Yes, Delete Everything
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Backup Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Backup Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Regular Backups</h4>
              <p className="text-sm text-gray-600">
                Export your data regularly, especially before major tournaments or system updates.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Safe Storage</h4>
              <p className="text-sm text-gray-600">
                Store exported data in multiple locations (cloud storage, external drives) for redundancy.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Season End</h4>
              <p className="text-sm text-gray-600">
                Consider exporting data at the end of each season before starting fresh.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Test Restores</h4>
              <p className="text-sm text-gray-600">
                Periodically verify that your exported data is complete and readable.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}