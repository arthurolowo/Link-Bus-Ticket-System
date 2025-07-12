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
import { Plus, Edit, Trash2, TrendingUp, Users, Calendar, AlertTriangle, Eye } from 'lucide-react';
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

interface RouteStats {
  routeId: number;
  totalBookings: number;
  totalRevenue: number;
  upcomingTrips: number;
  averageOccupancy: number;
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
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
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

  const handleViewStats = (route: Route) => {
    setSelectedRoute(route);
    setIsStatsDialogOpen(true);
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

  // Fetch route stats
  const { data: routeStats = [] } = useQuery<RouteStats[]>({
    queryKey: ['route-stats'],
    queryFn: async () => {
      try {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/routes/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
        if (!response.ok) {
          console.warn('Failed to fetch route stats');
          return [];
        }
        return response.json();
      } catch (error) {
        console.warn('Error fetching route stats:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
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
      queryClient.invalidateQueries({ queryKey: ['route-stats'] });
      queryClient.invalidateQueries({ queryKey: ['cities'] }); // Refresh cities for SearchForm
      handleCloseDialog();
      toast({
        title: 'Success',
        description: 'Route added successfully. It will now appear in user searches.',
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
          const error = await response.json();
          throw new Error(error.message || 'Failed to update route');
        }
        return response.json();
      } catch (error) {
        console.error('Error updating route:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['route-stats'] });
      queryClient.invalidateQueries({ queryKey: ['cities'] }); // Refresh cities for SearchForm
      handleCloseDialog();
      toast({
        title: 'Success',
        description: 'Route updated successfully. Changes will be visible to users immediately.',
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
        const response = await fetch(`${API_BASE_URL}/routes/${id}/toggle`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include',
          body: JSON.stringify({ isActive }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update route status');
        }
        return response.json();
      } catch (error) {
        console.error('Error toggling route status:', error);
        throw error;
      }
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['cities'] }); // Refresh cities for SearchForm
      toast({
        title: 'Success',
        description: `Route ${isActive ? 'activated' : 'deactivated'} successfully. ${isActive ? 'Users can now search for this route.' : 'Route hidden from user searches.'}`,
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
          credentials: 'include',
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to delete route');
        }
        return response.json();
      } catch (error) {
        console.error('Error deleting route:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      queryClient.invalidateQueries({ queryKey: ['route-stats'] });
      queryClient.invalidateQueries({ queryKey: ['cities'] }); // Refresh cities for SearchForm
      toast({
        title: 'Success',
        description: 'Route deleted successfully. It will no longer appear in user searches.',
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
    if (window.confirm('Are you sure you want to delete this route? This will affect all associated trips and bookings.')) {
      deleteRouteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (route: Route) => {
    const newStatus = route.isActive === 1 ? 0 : 1;
    const warningMessage = newStatus === 0 
      ? 'This will hide the route from user searches. Existing bookings remain valid.'
      : 'This will make the route visible to users in search results.';
    
    if (window.confirm(`Are you sure you want to ${newStatus === 1 ? 'activate' : 'deactivate'} this route? ${warningMessage}`)) {
      console.log('Toggling route status:', { routeId: route.id, oldStatus: route.isActive, newStatus });
      toggleRouteMutation.mutate({ 
        id: route.id, 
        isActive: newStatus
      });
    }
  };

  const getRouteStats = (routeId: number) => {
    return routeStats.find(stat => stat.routeId === routeId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Route Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold">Route Management</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage routes that users can search and book. Active routes appear in user searches.
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary">
            <Plus className="mr-2 h-4 w-4" />
            Add Route
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* User Impact Summary */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            User Impact Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800">
                <strong>{routes?.filter(r => r.isActive).length || 0}</strong> routes searchable by users
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800">
                <strong>{routeStats.reduce((sum, stat) => sum + stat.upcomingTrips, 0)}</strong> upcoming trips
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800">
                <strong>{routes?.filter(r => !r.isActive).length || 0}</strong> routes hidden from users
              </span>
            </div>
          </div>
        </div>

        {/* Add/Edit Route Dialog */}
        <Dialog open={isAddDialogOpen || !!editingRoute} onOpenChange={(open) => {
          if (!open) handleCloseDialog();
          else setIsAddDialogOpen(true);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRoute ? 'Edit Route' : 'Add New Route'}</DialogTitle>
              <DialogDescription>
                {editingRoute ? 'Edit the route details below. Changes will be visible to users immediately.' : 'Enter the details for the new route. It will become searchable by users once created.'}
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
                        <Input {...field} placeholder="Enter origin city" />
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
                        <Input {...field} placeholder="Enter destination city" />
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

        {/* Route Stats Dialog */}
        <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Route Performance</DialogTitle>
              <DialogDescription>
                {selectedRoute && `${selectedRoute.origin} → ${selectedRoute.destination}`}
              </DialogDescription>
            </DialogHeader>
            {selectedRoute && (
              <div className="space-y-4">
                {(() => {
                  const stats = getRouteStats(selectedRoute.id);
                  if (!stats) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No performance data available for this route yet.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900">Total Bookings</h4>
                        <p className="text-2xl font-bold text-blue-800">{stats.totalBookings}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-900">Total Revenue</h4>
                        <p className="text-2xl font-bold text-green-800">UGX {stats.totalRevenue.toLocaleString()}</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-900">Upcoming Trips</h4>
                        <p className="text-2xl font-bold text-purple-800">{stats.upcomingTrips}</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-orange-900">Average Occupancy</h4>
                        <p className="text-2xl font-bold text-orange-800">{stats.averageOccupancy}%</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Routes List */}
        <div className="space-y-4">
          {routes?.map((route) => {
            const stats = getRouteStats(route.id);
            return (
              <div
                key={route.id}
                className={cn(
                  "flex items-center justify-between p-4 border-2 rounded-lg transition-all",
                  route.isActive 
                    ? "border-green-200 bg-green-50/50 hover:bg-green-50" 
                    : "border-gray-200 bg-gray-50/50 hover:bg-gray-50"
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">
                      {route.origin} → {route.destination}
                    </h3>
                    <Badge 
                      variant={route.isActive ? "default" : "secondary"}
                      className="ml-2"
                    >
                      {route.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {route.isActive && (
                      <Badge variant="outline" className="text-xs">
                        Searchable by users
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="font-medium">Distance:</span> {route.distance} km
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="font-medium">Duration:</span> {(route.estimatedDuration / 60).toFixed(1)} hours
                      </p>
                    </div>
                    {stats && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="font-medium">Bookings:</span> {stats.totalBookings}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="font-medium">Revenue:</span> UGX {stats.totalRevenue.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {stats && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewStats(route)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Stats
                    </Button>
                  )}
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
            );
          })}
          {routes?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No routes found. Click "Add Route" to create one.</p>
              <p className="text-sm mt-2">Routes must be created before users can search for trips.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 