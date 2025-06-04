import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Bus, Search, Filter, Star, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { UGANDAN_CITIES } from "@/types";
import type { Route as BusRoute } from "@shared/schema";

export default function Routes() {
  const [searchOrigin, setSearchOrigin] = useState("");
  const [searchDestination, setSearchDestination] = useState("");
  const [sortBy, setSortBy] = useState("distance");

  const { data: routes, isLoading } = useQuery({
    queryKey: ['/api/routes'],
  });

  // Filter routes based on search criteria
  const filteredRoutes = (routes as BusRoute[] || []).filter((route: BusRoute) => {
    const originMatch = !searchOrigin || route.origin.toLowerCase().includes(searchOrigin.toLowerCase());
    const destinationMatch = !searchDestination || route.destination.toLowerCase().includes(searchDestination.toLowerCase());
    return originMatch && destinationMatch;
  });

  // Sort routes
  const sortedRoutes = [...filteredRoutes].sort((a, b) => {
    switch (sortBy) {
      case 'distance':
        return (a.distance || 0) - (b.distance || 0);
      case 'duration':
        return (a.estimatedDuration || 0) - (b.estimatedDuration || 0);
      case 'origin':
        return a.origin.localeCompare(b.origin);
      case 'destination':
        return a.destination.localeCompare(b.destination);
      default:
        return 0;
    }
  });

  const popularRoutes = [
    { from: "Kampala", to: "Mbarara", distance: 290, duration: "4h 30m", frequency: "6 daily", rating: 4.8 },
    { from: "Kampala", to: "Gulu", distance: 340, duration: "5h 15m", frequency: "4 daily", rating: 4.7 },
    { from: "Kampala", to: "Jinja", distance: 87, duration: "2h 45m", frequency: "8 daily", rating: 4.9 },
    { from: "Kampala", to: "Mbale", distance: 245, duration: "4h", frequency: "5 daily", rating: 4.6 },
    { from: "Kampala", to: "Fort Portal", distance: 320, duration: "5h", frequency: "3 daily", rating: 4.8 },
    { from: "Kampala", to: "Kasese", distance: 440, duration: "6h", frequency: "2 daily", rating: 4.5 },
    { from: "Kampala", to: "Arua", distance: 520, duration: "7h", frequency: "2 daily", rating: 4.4 },
    { from: "Kampala", to: "Lira", distance: 340, duration: "5h 30m", frequency: "3 daily", rating: 4.6 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Our Routes</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover all destinations we serve across Uganda. From bustling cities to scenic towns, 
            Link Bus connects you to every corner of the country with comfort and reliability.
          </p>
        </div>

        {/* Search and Filter Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Find Your Route
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">From</label>
                <Select value={searchOrigin} onValueChange={setSearchOrigin}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select origin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All cities</SelectItem>
                    {UGANDAN_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">To</label>
                <Select value={searchDestination} onValueChange={setSearchDestination}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All cities</SelectItem>
                    {UGANDAN_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Sort by</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                    <SelectItem value="origin">Origin A-Z</SelectItem>
                    <SelectItem value="destination">Destination A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  className="w-full"
                  onClick={() => {
                    setSearchOrigin("");
                    setSearchDestination("");
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Popular Routes Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Popular Routes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {popularRoutes.map((route, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="font-medium text-sm">{route.from}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{route.to}</span>
                      <div className="w-3 h-3 bg-accent rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Distance:</span>
                      <span className="font-medium">{route.distance} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="font-medium">{route.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frequency:</span>
                      <span className="font-medium">{route.frequency}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span>Rating:</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{route.rating}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-3 btn-accent"
                    size="sm"
                    onClick={() => {
                      window.location.href = `/?from=${route.from}&to=${route.to}`;
                    }}
                  >
                    Book Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* All Routes Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">All Routes</h2>
            <Badge variant="secondary">
              {filteredRoutes.length} routes found
            </Badge>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-24 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sortedRoutes.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bus className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No routes found</h3>
                <p className="text-muted-foreground mb-4">
                  No routes match your search criteria. Try adjusting your filters.
                </p>
                <Button 
                  onClick={() => {
                    setSearchOrigin("");
                    setSearchDestination("");
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedRoutes.map((route: BusRoute) => (
                <Card key={route.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {route.origin} → {route.destination}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            Active Route
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      {route.distance && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Distance:</span>
                          <span className="font-medium">{route.distance} km</span>
                        </div>
                      )}
                      
                      {route.estimatedDuration && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Est. Duration:</span>
                          <span className="font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {Math.floor(route.estimatedDuration / 60)}h {route.estimatedDuration % 60}m
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-border">
                      <Button 
                        className="w-full btn-primary"
                        onClick={() => {
                          window.location.href = `/?from=${route.origin}&to=${route.destination}`;
                        }}
                      >
                        Book This Route
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Route Information */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bus className="w-5 h-5 text-primary" />
                Modern Fleet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Our buses are equipped with comfortable seating, air conditioning, 
                WiFi, and entertainment systems for your journey comfort.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Reliable Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We maintain punctual departure and arrival times with real-time 
                tracking and updates to keep you informed throughout your journey.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Extensive Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Connecting major cities and towns across Uganda with multiple 
                daily departures and convenient pickup points.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}