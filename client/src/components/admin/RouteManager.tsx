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
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { getToken } from '../../lib/authUtils';
import { cn } from '../../lib/utils';

const API_BASE_URL = 'http://localhost:5000/api';

interface Route {
  id: number;
  origin: string;
  destination: string;
  distance: number;
  estimatedDuration: number;
  isActive: number;
}

const routeFormSchema = z.object({
  origin: z.string().min(2, 'Origin must be at least 2 characters'),
  destination: z.string().min(2, 'Destination must be at least 2 characters'),
  distance: z.coerce
    .number()
    .min(1, 'Distance must be greater than 0')
    .nonnegative('Distance cannot be negative'),
  estimatedDuration: z.coerce
    .number()
    .min(0.5, 'Duration must be at least 30 minutes')
    .nonnegative('Duration cannot be negative'),
  isActive: z.coerce.number().default(1),
});

type RouteFormData = z.infer<typeof routeFormSchema>;

export function RouteManager() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RouteFormData>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: {
      origin: '',
      destination: '',
      distance: 0,
      estimatedDuration: 0,
      isActive: 1,
    },
  });

  const onSubmit = async (data: RouteFormData) => {
    try {
      console.log('Form submitted with data:', data);
      if (editingRoute) {
        await updateRouteMutation.mutateAsync({ 
          id: editingRoute.id, 
          data: {
            ...data,
            distance: Number(data.distance),
            estimatedDuration: Number(data.estimatedDuration)
          }
        });
      } else {
        await addRouteMutation.mutateAsync({
          ...data,
          distance: Number(data.distance),
          estimatedDuration: Number(data.estimatedDuration)
        });
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save route. Please check your input and try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingRoute(null);
    form.reset();
  };

  // Fetch routes
  const { data: routes, isLoading } = useQuery<Route[]>({
    queryKey: ['routes'],
    queryFn: async () => {
      try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/routes`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to fetch routes');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching routes:', error);
        throw error;
      }
    },
  });

  // Add route mutation
  const addRouteMutation = useMutation({
    mutationFn: async (data: RouteFormData) => {
      try {
        const token = getToken();
        console.log('Sending route data:', data);
        const response = await fetch(`${API_BASE_URL}/routes`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include',
          body: JSON.stringify({
            origin: data.origin,
            destination: data.destination,
            distance: Number(data.distance),
            estimatedDuration: Number(data.estimatedDuration),
            isActive: 1
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Server error response:', errorData);
          throw new Error(errorData.message || 'Failed to add route');
        }
        const responseData = await response.json();
        console.log('Server response:', responseData);
        return responseData;
      } catch (error) {
        console.error('Detailed error in addRouteMutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      handleCloseDialog();
      toast({
        title: 'Success',
        description: 'Route added successfully',
      });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add route. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Update route mutation
  const updateRouteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RouteFormData }) => {
      try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/routes/${id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include',
          body: JSON.stringify({
            origin: data.origin,
            destination: data.destination,
            distance: Number(data.distance),
            estimatedDuration: Number(data.estimatedDuration),
            isActive: data.isActive
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update route');
        }
        return response.json();
      } catch (error) {
        console.error('Error updating route:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      handleCloseDialog();
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

  // Toggle route status mutation
  const toggleRouteMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: number }) => {
      try {
        const token = getToken();
        console.log('Sending toggle request:', { id, isActive });
        const response = await fetch(`${API_BASE_URL}/routes/${id}/toggle-status`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include',
          body: JSON.stringify({ isActive }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update route status');
        }
        const updatedRoute = await response.json();
        console.log('Received updated route:', updatedRoute);
        return updatedRoute;
      } catch (error) {
        console.error('Error updating route status:', error);
        throw error;
      }
    },
    onSuccess: (updatedRoute) => {
      // Update the routes cache with the new data
      queryClient.setQueryData(['routes'], (oldRoutes: Route[] | undefined) => {
        if (!oldRoutes) return [updatedRoute];
        return oldRoutes.map(route => 
          route.id === updatedRoute.id ? updatedRoute : route
        );
      });
      
      toast({
        title: 'Success',
        description: `Route ${updatedRoute.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update route status',
        variant: 'destructive',
      });
    },
  });

  // Delete route mutation
  const deleteRouteMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/routes/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete route');
        }
        return response.json();
      } catch (error) {
        console.error('Error deleting route:', error);
        throw error;
      }
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

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    form.reset({
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

  const handleToggleStatus = (route: Route) => {
    const newStatus = route.isActive === 1 ? 0 : 1;
    console.log('Toggling route status:', { routeId: route.id, oldStatus: route.isActive, newStatus });
    toggleRouteMutation.mutate({ 
      id: route.id, 
      isActive: newStatus
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Route Management</CardTitle>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Route
        </Button>
      </CardHeader>
      <CardContent>
        <Dialog open={isAddDialogOpen || !!editingRoute} onOpenChange={(open) => {
          if (!open) handleCloseDialog();
          else setIsAddDialogOpen(true);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRoute ? 'Edit Route' : 'Add New Route'}</DialogTitle>
              <DialogDescription>
                {editingRoute ? 'Edit the route details below.' : 'Enter the details for the new route.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="origin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origin</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter origin" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter destination" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="distance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Distance (km)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" step="0.1" placeholder="Enter distance" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estimatedDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Duration (hours)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="0.5" 
                          step="0.5" 
                          placeholder="Enter duration in hours"
                          onChange={(e) => {
                            // Convert hours to minutes before saving
                            const hours = parseFloat(e.target.value);
                            field.onChange(hours * 60);
                          }}
                          value={field.value ? (field.value / 60).toString() : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {editingRoute ? 'Update Route' : 'Add Route'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        <div className="space-y-4">
          {routes?.map((route) => (
            <div
              key={route.id}
              className={cn(
                "flex items-center justify-between p-4 border-2 rounded-lg",
                route.isActive 
                  ? "border-green-200 bg-green-50/50" 
                  : "border-gray-200 bg-gray-50/50"
              )}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">
                    {route.origin} → {route.destination}
                  </h3>
                  <Badge 
                    variant={route.isActive ? "success" : "secondary"}
                    className="ml-2"
                  >
                    {route.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="font-medium">Distance:</span> {route.distance} km
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="font-medium">Duration:</span> {(route.estimatedDuration / 60).toFixed(1)} hours
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant={route.isActive ? "outline" : "secondary"}
                  size="sm"
                  className={cn(
                    "min-w-[100px] transition-colors",
                    route.isActive 
                      ? "border-green-500 text-green-700 hover:bg-green-50" 
                      : "hover:bg-gray-200"
                  )}
                  onClick={() => handleToggleStatus(route)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      route.isActive ? "bg-green-500" : "bg-gray-400"
                    )} />
                    {route.isActive ? 'Active' : 'Inactive'}
                  </div>
                </Button>
                <div className="flex items-center gap-2 border-l pl-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    onClick={() => handleEdit(route)}
                  >
                    <Edit className="w-4 h-4" />
                    <span className="ml-2">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    onClick={() => handleDelete(route.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="ml-2">Delete</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {routes?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No routes found. Click "Add Route" to create one.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 