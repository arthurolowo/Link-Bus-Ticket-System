import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
import Header from "@/components/Header";
import type { BookingWithDetails } from "@shared/schema";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterDestination, setFilterDestination] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage routes, bookings, and monitor performance</p>
            </div>
            <div className="flex gap-3">
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Route
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-96">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                        UGX {isLoadingStats ? "..." : parseFloat(stats?.totalRevenue || "0").toLocaleString()}
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
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Route className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-muted-foreground">No change vs last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Occupancy Rate</p>
                      <p className="text-2xl font-bold text-foreground">
                        {isLoadingStats ? "..." : stats?.occupancyRate || 0}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BarChart className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-600">+5%</span>
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
                        <div key={booking.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                          <div>
                            <p className="font-medium">{booking.passengerName}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.trip.route.origin} → {booking.trip.route.destination}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">UGX {parseFloat(booking.totalAmount).toLocaleString()}</p>
                            <Badge className={`text-xs ${getStatusColor(booking.paymentStatus)}`}>
                              {booking.paymentStatus}
                            </Badge>
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
                        {filteredBookings.map((booking: BookingWithDetails) => (
                          <tr key={booking.id} className="border-b border-border hover:bg-muted/50">
                            <td className="py-3 px-4 font-medium text-primary">
                              {booking.bookingReference}
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium">{booking.passengerName}</div>
                                <div className="text-sm text-muted-foreground">{booking.passengerPhone}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {booking.trip.route.origin} → {booking.trip.route.destination}
                            </td>
                            <td className="py-3 px-4">
                              {new Date(booking.trip.departureDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 font-medium">
                              UGX {parseFloat(booking.totalAmount).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={getStatusColor(booking.paymentStatus)}>
                                {booking.paymentStatus}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">View</Button>
                                <Button variant="outline" size="sm">Edit</Button>
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

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <div className="text-muted-foreground">Booking Trends Chart</div>
                      <div className="text-sm text-muted-foreground">Integration with Chart.js</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Popular Routes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { route: "Kampala → Mbarara", bookings: 324, revenue: "14.5M" },
                      { route: "Kampala → Gulu", bookings: 298, revenue: "13.2M" },
                      { route: "Kampala → Jinja", bookings: 256, revenue: "8.9M" },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg">
                        <div>
                          <div className="font-medium">{item.route}</div>
                          <div className="text-sm text-muted-foreground">{item.bookings} bookings this month</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-primary">UGX {item.revenue}</div>
                          <div className="text-sm text-muted-foreground">Revenue</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
