import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  BarChart, 
  Bus, 
  Calendar, 
  DollarSign, 
  Download, 
  Plus, 
  Route, 
  TrendingUp,
  Users,
  Search,
  Eye,
  XCircle,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import { getToken } from '../lib/authUtils';
import { BusTypeManager } from "../components/admin/BusTypeManager";
import { BusManager } from "../components/admin/BusManager";
import { RouteManager } from "../components/admin/RouteManager";
import { TripManager } from "../components/admin/TripManager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

const API_BASE_URL = 'http://localhost:5000';

// Helper function to make authenticated API requests
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

interface AdminBooking {
  id: number;
  bookingReference: string;
  totalAmount: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  seatNumbers: number[];
  trip: {
    id: number;
    departureDate: string;
    departureTime: string;
    arrivalTime: string;
    fare: string;
    route: {
      origin: string;
      destination: string;
    };
    bus: {
      number: string;
      type: string;
    };
  };
}

interface AdminStats {
  totalBookings: number;
  totalRevenue: string;
  activeRoutes: number;
  occupancyRate: number;
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'failed':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'pending':
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-500" />;
  }
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterDestination, setFilterDestination] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Redirect non-admin users
  if (!user?.isAdmin) {
    return <Navigate to="/" />;
  }

  // Query for admin stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      return apiRequest<AdminStats>('/api/admin/stats');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Query for bookings
  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery<AdminBooking[]>({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      return apiRequest<AdminBooking[]>('/api/admin/bookings');
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  // Mutation for cancelling bookings
  const cancelBookingMutation = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: number; reason?: string }) => {
      return apiRequest(`/api/admin/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({
        title: 'Success',
        description: 'Booking cancelled successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const filteredBookings = bookings.filter((booking: AdminBooking) => {
    // Text search
    const matchesSearch = !searchTerm ||
      booking.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.trip.route.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.trip.route.destination.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = !filterStatus || filterStatus === 'all' || booking.status === filterStatus;
    
    // Phone filter
    const matchesPhone = !filterPhone || booking.passengerPhone.includes(filterPhone);
    
    // Origin filter
    const matchesOrigin = !filterOrigin || booking.trip.route.origin === filterOrigin;
    
    // Destination filter
    const matchesDestination = !filterDestination || booking.trip.route.destination === filterDestination;
    
    // Date range filter
    const depDate = new Date(booking.trip.departureDate);
    const matchesStartDate = !filterStartDate || depDate >= new Date(filterStartDate);
    const matchesEndDate = !filterEndDate || depDate <= new Date(filterEndDate);
    
    return matchesSearch && matchesStatus && matchesPhone && 
           matchesOrigin && matchesDestination && matchesStartDate && matchesEndDate;
  });

  const handleViewBooking = (booking: AdminBooking) => {
    setSelectedBooking(booking);
    setIsViewDialogOpen(true);
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      cancelBookingMutation.mutate({ bookingId });
    }
  };



  const handleExport = () => {
    try {
      // Convert bookings data to CSV format
      const headers = [
        'Booking Reference',
        'Passenger Name',
        'Passenger Phone',
        'Passenger Email',
        'Status',
        'Origin',
        'Destination',
        'Departure Date',
        'Departure Time',
        'Bus Number',
        'Bus Type',
        'Seats',
        'Amount',
        'Created At'
      ].join(',');

      const rows = filteredBookings.map(booking => [
        booking.bookingReference,
        booking.passengerName,
        booking.passengerPhone,
        booking.passengerEmail,
        booking.status,
        booking.trip.route.origin,
        booking.trip.route.destination,
        new Date(booking.trip.departureDate).toLocaleDateString(),
        booking.trip.departureTime,
        booking.trip.bus.number,
        booking.trip.bus.type,
        booking.seatNumbers.join(';'),
        booking.totalAmount,
        new Date(booking.createdAt).toLocaleString()
      ].join(','));

      const csvContent = [headers, ...rows].join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `bookings_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Success',
        description: 'Data exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setFilterPhone("");
    setFilterOrigin("");
    setFilterDestination("");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage routes, bookings, and monitor performance</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={handleExport}
                disabled={isLoadingBookings}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="buses">Buses</TabsTrigger>
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="trips">Trips</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Bookings</p>
                      <p className="text-2xl font-bold text-foreground">
                        {isLoadingStats ? "..." : stats?.totalBookings || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600">Live Data</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="text-2xl font-bold text-foreground">
                        UGX {isLoadingStats ? "..." : formatCurrency(stats?.totalRevenue || "0")}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600">Last 30 Days</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Routes</p>
                      <p className="text-2xl font-bold text-foreground">
                        {isLoadingStats ? "..." : stats?.activeRoutes || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Route className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-muted-foreground">Searchable by users</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                      <p className="text-2xl font-bold text-foreground">
                        {isLoadingStats ? "..." : `${stats?.occupancyRate || 0}%`}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Bus className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-muted-foreground">Current trips</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Recent Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingBookings ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.slice(0, 5).map((booking: AdminBooking) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(booking.status)}
                          <div>
                            <p className="text-sm font-medium">{booking.passengerName}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.trip.route.origin} → {booking.trip.route.destination}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-sm font-medium">UGX {formatCurrency(booking.totalAmount)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(booking.trip.departureDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant={getStatusVariant(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    User Bookings ({filteredBookings.length})
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div>
                    <Label htmlFor="search">Search</Label>
                    <Input
                      id="search"
                      placeholder="Reference, name, city..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="Phone number"
                      value={filterPhone}
                      onChange={(e) => setFilterPhone(e.target.value)}
                    />
                  </div>
                </div>

                {isLoadingBookings ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Reference</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Passenger</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Route</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date/Time</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Bus</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Seats</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Amount</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.map((booking: AdminBooking) => (
                          <tr key={booking.id} className="border-b hover:bg-muted/50">
                            <td className="px-4 py-4">
                              <div className="font-medium text-sm">{booking.bookingReference}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(booking.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-medium text-sm">{booking.passengerName}</div>
                              <div className="text-xs text-muted-foreground">{booking.passengerPhone}</div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm">{booking.trip.route.origin}</div>
                              <div className="text-xs text-muted-foreground">→ {booking.trip.route.destination}</div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm">{new Date(booking.trip.departureDate).toLocaleDateString()}</div>
                              <div className="text-xs text-muted-foreground">{booking.trip.departureTime}</div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm">{booking.trip.bus.number}</div>
                              <div className="text-xs text-muted-foreground">{booking.trip.bus.type}</div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm">{booking.seatNumbers.join(', ')}</div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-medium text-sm">UGX {formatCurrency(booking.totalAmount)}</div>
                            </td>
                            <td className="px-4 py-4">
                              <Badge variant={getStatusVariant(booking.status)} className="text-xs">
                                {getStatusIcon(booking.status)}
                                <span className="ml-1">{booking.status}</span>
                              </Badge>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewBooking(booking)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {booking.status !== 'failed' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleCancelBooking(booking.id)}
                                    disabled={cancelBookingMutation.isPending}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="buses" className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <BusTypeManager />
              <BusManager />
            </div>
          </TabsContent>

          <TabsContent value="routes">
            <RouteManager />
          </TabsContent>

          <TabsContent value="trips">
            <TripManager />
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              View complete booking information
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Booking Reference</Label>
                  <p className="text-sm">{selectedBooking.bookingReference}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm">{new Date(selectedBooking.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Passenger Name</Label>
                  <p className="text-sm">{selectedBooking.passengerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm">{selectedBooking.passengerPhone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedBooking.passengerEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Amount</Label>
                  <p className="text-sm font-medium">UGX {formatCurrency(selectedBooking.totalAmount)}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Trip Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Route</Label>
                    <p className="text-sm">{selectedBooking.trip.route.origin} → {selectedBooking.trip.route.destination}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Date</Label>
                    <p className="text-sm">{new Date(selectedBooking.trip.departureDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Departure</Label>
                    <p className="text-sm">{selectedBooking.trip.departureTime}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Bus</Label>
                    <p className="text-sm">{selectedBooking.trip.bus.number} ({selectedBooking.trip.bus.type})</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Seats</Label>
                    <p className="text-sm">{selectedBooking.seatNumbers.join(', ')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge variant={getStatusVariant(selectedBooking.status)}>
                      {getStatusIcon(selectedBooking.status)}
                      <span className="ml-1">{selectedBooking.status}</span>
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
