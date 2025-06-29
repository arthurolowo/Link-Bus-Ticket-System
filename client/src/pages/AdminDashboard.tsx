import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  Search
} from "lucide-react";
import type { Booking, TripWithDetails } from "../types";
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import { BusTypeManager } from "../components/admin/BusTypeManager";
import { RouteManager } from "../components/admin/RouteManager";
import { TripManager } from "../components/admin/TripManager";

interface BookingWithDetails extends Booking {
  passengerName: string;
  passengerPhone: string;
  bookingReference: string;
  paymentStatus: 'completed' | 'pending' | 'failed';
  bookingStatus: string;
  trip: TripWithDetails;
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
    case 'confirmed':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'failed':
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterDestination, setFilterDestination] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect non-admin users
  if (!user?.isAdmin) {
    return <Navigate to="/" />;
  }

  const { data: stats, isLoading: isLoadingStats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: bookings, isLoading: isLoadingBookings } = useQuery<BookingWithDetails[]>({
    queryKey: ['/api/admin/bookings'],
  });

  const filteredBookings = (bookings || []).filter((booking: BookingWithDetails) => {
    // Text search
    const matchesSearch = !searchTerm ||
      booking.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.trip.route.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.trip.route.destination.toLowerCase().includes(searchTerm.toLowerCase());
    // Payment status filter
    const matchesPaymentStatus = !filterPaymentStatus || booking.paymentStatus === filterPaymentStatus;
    // Booking status filter
    const matchesStatus = !filterStatus || booking.bookingStatus === filterStatus;
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
    return matchesSearch && matchesPaymentStatus && matchesStatus && matchesPhone && matchesOrigin && matchesDestination && matchesStartDate && matchesEndDate;
  });

  const handleAddRouteClick = () => {
    setActiveTab("routes");
    // The RouteManager component will handle showing the add dialog
  };

  const handleExport = () => {
    try {
      // Convert bookings data to CSV format
      const headers = [
        'Booking Reference',
        'Passenger Name',
        'Passenger Phone',
        'Payment Status',
        'Booking Status',
        'Origin',
        'Destination',
        'Departure Date',
        'Amount'
      ].join(',');

      const rows = filteredBookings.map(booking => [
        booking.bookingReference,
        booking.passengerName,
        booking.passengerPhone,
        booking.paymentStatus,
        booking.bookingStatus,
        booking.trip.route.origin,
        booking.trip.route.destination,
        new Date(booking.trip.departureDate).toLocaleDateString(),
        booking.trip.fare
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
                className="btn-primary"
                onClick={handleAddRouteClick}
                disabled={isLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Route
              </Button>
              <Button 
                variant="outline"
                onClick={handleExport}
                disabled={isLoading || isLoadingBookings}
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
                    <span className="text-green-600">+12%</span>
                    <span className="text-muted-foreground ml-1">vs last month</span>
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
                    <span className="text-green-600">+8%</span>
                    <span className="text-muted-foreground ml-1">vs last month</span>
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
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600">+5%</span>
                    <span className="text-muted-foreground ml-1">vs last month</span>
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
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600">+3%</span>
                    <span className="text-muted-foreground ml-1">vs last month</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingBookings ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings?.slice(0, 5).map((booking: BookingWithDetails) => (
                        <div key={booking.id} className="flex items-center">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{booking.passengerName}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.trip.route.origin} to {booking.trip.route.destination}
                            </p>
                          </div>
                          <div className="ml-auto flex items-center gap-4">
                            <div className="flex flex-col items-end">
                              <p className="text-sm font-medium">UGX {formatCurrency(booking.totalAmount)}</p>
                              <p className="text-sm text-muted-foreground">{new Date(booking.trip.departureDate).toLocaleDateString()}</p>
                            </div>
                            <Badge variant={getStatusVariant(booking.bookingStatus)}>{booking.bookingStatus}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full btn-primary justify-start">
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Route
                    </Button>
                    <Button className="w-full btn-accent justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule New Trip
                    </Button>
                    <Button className="w-full btn-secondary justify-start">
                      <Bus className="w-4 h-4 mr-2" />
                      Manage Buses
                    </Button>
                    <Button className="w-full btn-secondary justify-start">
                      <BarChart className="w-4 h-4 mr-2" />
                      View Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <CardTitle>All Bookings</CardTitle>
                  <div className="flex items-center gap-3">
                    {activeTab === "bookings" && (
                      <div className="overflow-x-auto">
                        {/* Advanced Filters */}
                        <div className="flex flex-wrap gap-2 md:gap-4 mb-4 items-center">
                          <input
                            type="text"
                            placeholder="Search by reference, name, city..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="input input-bordered w-full md:w-56"
                          />
                          <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="select select-bordered w-full md:w-40"
                          >
                            <option value="">All Statuses</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <select
                            value={filterPaymentStatus}
                            onChange={e => setFilterPaymentStatus(e.target.value)}
                            className="select select-bordered w-full md:w-40"
                          >
                            <option value="">All Payments</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Phone"
                            value={filterPhone}
                            onChange={e => setFilterPhone(e.target.value)}
                            className="input input-bordered w-full md:w-32"
                          />
                          <select
                            value={filterOrigin}
                            onChange={e => setFilterOrigin(e.target.value)}
                            className="select select-bordered w-full md:w-32"
                          >
                            <option value="">All Origins</option>
                            {Array.from(new Set((bookings||[]).map(b => b.trip.route.origin))).map(origin => (
                              <option key={origin} value={origin}>{origin}</option>
                            ))}
                          </select>
                          <select
                            value={filterDestination}
                            onChange={e => setFilterDestination(e.target.value)}
                            className="select select-bordered w-full md:w-32"
                          >
                            <option value="">All Destinations</option>
                            {Array.from(new Set((bookings||[]).map(b => b.trip.route.destination))).map(dest => (
                              <option key={dest} value={dest}>{dest}</option>
                            ))}
                          </select>
                          <input
                            type="date"
                            value={filterStartDate}
                            onChange={e => setFilterStartDate(e.target.value)}
                            className="input input-bordered w-full md:w-36"
                            placeholder="Start date"
                          />
                          <input
                            type="date"
                            value={filterEndDate}
                            onChange={e => setFilterEndDate(e.target.value)}
                            className="input input-bordered w-full md:w-36"
                            placeholder="End date"
                          />
                          <button
                            className="btn btn-outline btn-sm md:ml-2"
                            onClick={() => {
                              setFilterStatus("");
                              setFilterPaymentStatus("");
                              setFilterPhone("");
                              setFilterOrigin("");
                              setFilterDestination("");
                              setFilterStartDate("");
                              setFilterEndDate("");
                            }}
                          >
                            Clear Filters
                          </button>
                        </div>
                      </div>
                    )}
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingBookings ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Booking ID</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Passenger</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Route</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Amount</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.map((b: BookingWithDetails) => (
                          <tr key={b.id} className="border-b">
                            <td className="px-6 py-4 font-medium">{b.bookingReference}</td>
                            <td className="px-6 py-4">{b.passengerName}</td>
                            <td className="px-6 py-4">
                              {b.trip.route.origin} to {b.trip.route.destination}
                            </td>
                            <td className="px-6 py-4">
                              {new Date(b.trip.departureDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">UGX {formatCurrency(b.totalAmount)}</td>
                            <td className="px-6 py-4">
                              <Badge variant={getStatusVariant(b.bookingStatus)}>
                                {b.bookingStatus}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={getStatusVariant(b.paymentStatus)}>
                                {b.paymentStatus}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <Button variant="outline" size="sm">
                                View
                              </Button>
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

          <TabsContent value="buses">
            <BusTypeManager />
          </TabsContent>

          <TabsContent value="routes">
            <RouteManager />
          </TabsContent>

          <TabsContent value="trips">
            <TripManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
