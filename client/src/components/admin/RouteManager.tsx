import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

interface Route {
  id: number;
  origin: string;
  destination: string;
  distance: number;
  estimatedDuration: number;
  isActive: number;
}

interface RouteFormData {
  origin: string;
  destination: string;
  distance: number;
  estimatedDuration: number;
  isActive: number;
}

export function RouteManager() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState<RouteFormData>({
    origin: '',
    destination: '',
    distance: 0,
    estimatedDuration: 0,
    isActive: 1,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch routes
  const { data: routes, isLoading } = useQuery<Route[]>({
    queryKey: ['routes'],
    queryFn: async () => {
      const response = await fetch('/api/routes');
      if (!response.ok) throw new Error('Failed to fetch routes');
      return response.json();
    },
  });

  // Add route mutation
  const addRouteMutation = useMutation({
    mutationFn: async (data: RouteFormData) => {
      const response = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add route');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Route added successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add route',
        variant: 'destructive',
      });
    },
  });

  // Update route mutation
  const updateRouteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<RouteFormData> }) => {
      const response = await fetch(`/api/routes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update route');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      setEditingRoute(null);
      resetForm();
      toast({
        title: 'Success',
        description: 'Route updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update route',
        variant: 'destructive',
      });
    },
  });

  // Delete route mutation
  const deleteRouteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/routes/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete route');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast({
        title: 'Success',
        description: 'Route deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete route',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      origin: '',
      destination: '',
      distance: 0,
      estimatedDuration: 0,
      isActive: 1,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRoute) {
      updateRouteMutation.mutate({ id: editingRoute.id, data: formData });
    } else {
      addRouteMutation.mutate(formData);
    }
  };

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    setFormData({
      origin: route.origin,
      destination: route.destination,
      distance: route.distance,
      estimatedDuration: route.estimatedDuration,
      isActive: route.isActive,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      deleteRouteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Routes</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingRoute(null); resetForm(); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Route
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRoute ? 'Edit Route' : 'Add New Route'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="origin">Origin</Label>
                <Input
                  id="origin"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="destination">Destination</Label>
                <Input
                  id="destination"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="distance">Distance (km)</Label>
                <Input
                  id="distance"
                  type="number"
                  value={formData.distance}
                  onChange={(e) => setFormData({ ...formData, distance: parseInt(e.target.value) })}
                  required
                  min={1}
                />
              </div>
              <div>
                <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
                <Input
                  id="estimatedDuration"
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) })}
                  required
                  min={1}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingRoute ? 'Update' : 'Add'} Route
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {routes?.map((route) => (
            <div
              key={route.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <h3 className="font-medium">{route.origin} → {route.destination}</h3>
                <p className="text-sm text-muted-foreground">
                  Distance: {route.distance}km | Duration: {Math.floor(route.estimatedDuration / 60)}h {route.estimatedDuration % 60}m
                </p>
                <Badge variant={route.isActive ? 'default' : 'secondary'}>
                  {route.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(route)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(route.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 