import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Clock, Download, QrCode } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchForm from "@/components/SearchForm";
import BusResults from "@/components/BusResults";
import { SearchParams } from "@/types";
import type { BookingWithDetails } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("search");
  const [searchParams, setSearchParams] = useState<SearchParams>({
    origin: "",
    destination: "",
    date: new Date().toISOString().split('T')[0],
    passengers: 1,
  });
  const [showResults, setShowResults] = useState(false);

  const { data: trips, isLoading: isSearching } = useQuery({
    queryKey: ['/api/trips/search', searchParams.origin, searchParams.destination, searchParams.date],
    enabled: showResults && !!searchParams.origin && !!searchParams.destination && !!searchParams.date,
  });

  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['/api/bookings'],
    enabled: activeTab === "bookings",
  });

  const handleSearch = (params: SearchParams) => {
    setSearchParams(params);
    setShowResults(true);
    setActiveTab("search");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
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
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.firstName || 'Traveler'}!
          </h1>
          <p className="text-muted-foreground">
            Book your next journey or manage your existing bookings
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-96">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Search & Book
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              My Bookings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            {!showResults ? (
              <SearchForm onSearch={handleSearch} />
            ) : (
              <BusResults 
                trips={trips || []} 
                isLoading={isSearching}
                searchParams={searchParams}
                onBackToSearch={() => setShowResults(false)}
              />
            )}
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  My Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingBookings ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : !bookings || bookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No bookings yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start planning your journey by searching for available buses
                    </p>
                    <Button onClick={() => setActiveTab("search")}>
                      Search Buses
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(bookings as BookingWithDetails[]).map((booking) => (
                      <Card key={booking.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="font-semibold text-lg">
                                  {booking.trip.route.origin} → {booking.trip.route.destination}
                                </h3>
                                <Badge className={getStatusColor(booking.paymentStatus)}>
                                  {booking.paymentStatus}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <div className="text-muted-foreground">Booking Reference</div>
                                  <div className="font-medium">{booking.bookingReference}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Travel Date</div>
                                  <div className="font-medium flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(booking.trip.departureDate).toLocaleDateString()} at {booking.trip.departureTime}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground">Seats</div>
                                  <div className="font-medium">
                                    {Array.isArray(booking.seatNumbers) 
                                      ? booking.seatNumbers.join(', ') 
                                      : booking.seatNumbers}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right space-y-2">
                              <div className="text-2xl font-bold text-primary">
                                UGX {parseFloat(booking.totalAmount).toLocaleString()}
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Download className="w-4 h-4 mr-1" />
                                  PDF
                                </Button>
                                <Button variant="outline" size="sm">
                                  <QrCode className="w-4 h-4 mr-1" />
                                  QR Code
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
