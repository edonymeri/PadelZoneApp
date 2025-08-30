// src/components/groups/GroupManagement.tsx
import { useState, useEffect } from "react";
import { PlayerService, PlayerGroup } from "@/services/api/playerService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Edit, Trash2, Users, Palette } from "lucide-react";

interface GroupManagementProps {
  clubId: string;
}

const PRESET_COLORS = [
  '#0172fb', // Brand blue
  '#10B981', // Green
  '#F59E0B', // Amber  
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
];

export default function GroupManagement({ clubId }: GroupManagementProps) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<PlayerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PlayerGroup | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#0172fb',
    sort_order: 0
  });

  useEffect(() => {
    loadGroups();
  }, [clubId]);

  async function loadGroups() {
    try {
      setLoading(true);
      const data = await PlayerService.getPlayerGroups(clubId);
      setGroups(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to load groups",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      color: '#0172fb',
      sort_order: groups.length
    });
    setEditingGroup(null);
  }

  function handleEdit(group: PlayerGroup) {
    setFormData({
      name: group.name,
      description: group.description || '',
      color: group.color,
      sort_order: group.sort_order
    });
    setEditingGroup(group);
    setIsCreateOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Validation error",
        description: "Group name is required"
      });
      return;
    }

    try {
      if (editingGroup) {
        // Update existing group
        await PlayerService.updatePlayerGroup(editingGroup.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          color: formData.color,
          sort_order: formData.sort_order
        });
        toast({
          title: "Group updated",
          description: `${formData.name} has been updated successfully`
        });
      } else {
        // Create new group
        await PlayerService.createPlayerGroup({
          club_id: clubId,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          color: formData.color,
          sort_order: formData.sort_order
        });
        toast({
          title: "Group created",
          description: `${formData.name} has been created successfully`
        });
      }
      
      setIsCreateOpen(false);
      resetForm();
      loadGroups();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: editingGroup ? "Failed to update group" : "Failed to create group",
        description: error.message
      });
    }
  }

  async function handleDelete(group: PlayerGroup) {
    if (!confirm(`Are you sure you want to delete the group "${group.name}"? Players in this group will be moved to "No Group".`)) {
      return;
    }

    try {
      await PlayerService.deletePlayerGroup(group.id);
      toast({
        title: "Group deleted",
        description: `${group.name} has been deleted`
      });
      loadGroups();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete group",
        description: error.message
      });
    }
  }

  if (loading) {
    return (
      <Card className="border-2 border-gray-200 shadow-lg bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} style={{ color: '#0172fb' }} />
            Player Groups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading groups...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-gray-200 shadow-lg bg-white">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-black font-bold">
          <div className="flex items-center gap-2">
            <Users size={20} style={{ color: '#0172fb' }} />
            Player Groups
          </div>
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" style={{ backgroundColor: '#0172fb', borderColor: '#0172fb' }}>
                <Plus size={16} className="mr-2" />
                Add Group
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-gray-200">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900">{editingGroup ? 'Edit Group' : 'Create New Group'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6 px-1">
                <div className="space-y-2">
                  <Label htmlFor="group-name" className="text-sm font-medium text-gray-700">Group Name *</Label>
                  <Input
                    id="group-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Beginners, Advanced, etc."
                    className="w-full bg-white border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-description" className="text-sm font-medium text-gray-700">Description</Label>
                  <Textarea
                    id="group-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description of this group..."
                    className="w-full bg-white border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
                    rows={3}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-10 h-10 rounded-full border-2 transition-all hover:scale-105 ${
                          formData.color === color ? 'border-gray-800 scale-110 shadow-lg' : 'border-gray-300 shadow-sm'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="text-xs text-gray-500 whitespace-nowrap">Custom:</Label>
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-16 h-10 p-1 bg-white border-2 border-gray-300 rounded-md cursor-pointer focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <Input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 bg-white border-2 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      placeholder="#0172fb"
                    />
                  </div>
                </div>
                <DialogFooter className="bg-gray-50 border-t border-gray-200 -mx-6 -mb-6 px-6 py-4 mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateOpen(false)}
                    className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    style={{ backgroundColor: '#0172fb', borderColor: '#0172fb' }}
                    className="text-white hover:opacity-90 shadow-lg"
                  >
                    {editingGroup ? 'Update Group' : 'Create Group'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No groups created yet</h3>
            <p className="text-gray-600 mb-6">Organize your players into skill levels or categories</p>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button style={{ backgroundColor: '#0172fb', borderColor: '#0172fb' }} className="shadow-lg hover:shadow-xl">
                  <Plus size={16} className="mr-2" />
                  Create Your First Group
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between p-4 border-2 border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: group.color }}
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{group.name}</h4>
                    {group.description && (
                      <p className="text-sm text-gray-600">{group.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(group)}
                    className="border-gray-300 hover:bg-gray-100"
                  >
                    <Edit size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(group)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
