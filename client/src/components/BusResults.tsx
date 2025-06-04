import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, MapPin, Wifi, Snowflake, Zap, Volume2 } from "lucide-react";
import SeatSelection from "./SeatSelection";
import { SearchParams } from "@/types";
import type { TripWithDetails } from "@shared/schema";

interface BusResultsProps {
  trips: TripWithDetails[];
  isLoading: boolean;
  searchParams: SearchParams;
  onBackToSearch: () => void;
}

export default function BusResults({ trips, isLoading, searchParams, onBackToSearch }: BusResultsProps) {
  const [selectedTrip, setSelectedTrip] = useState<TripWithDetails | null>(null);

  if (selectedTrip) {
    return (
      <SeatSelection 
        trip={selectedTrip} 
        onBack={() => setSelectedTrip(null)}
        searchParams={searchParams}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBackToSearch}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>
          <h2 className="text-2xl font-bold">Searching for buses...</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getBusTypeColor = (busType: string) => {
    switch (busType.toLowerCase()) {
      case 'luxury':
        return 'bg-purple-100 text-purple-800';
      case 'executive':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi':
        return <Wifi className="w-4 h-4" />;
      case 'ac':
      case 'air conditioning':
        return <Snowflake className="w-4 h-4" />;
      case 'power':
      case 'charging':
        return <Zap className="w-4 h-4" />;
      case 'entertainment':
        return <Volume2 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBackToSearch}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Available Buses</h2>
            <p className="text-muted-foreground">
              {searchParams.origin} to {searchParams.destination} • {new Date(searchParams.date).toLocaleDateString()} • {trips.length} buses found
            </p>
          </div>
        </div>
      </div>

      {trips.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No buses found</h3>
            <p className="text-muted-foreground mb-4">
              No buses are available for the selected route and date. Please try a different date or route.
            </p>
            <Button onClick={onBackToSearch}>
              Modify Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => {
            const amenities = trip.bus.busType.amenities as string[] || [];
            const availabilityColor = trip.availableSeats > 10 ? 'text-green-600' : 
                                    trip.availableSeats > 3 ? 'text-yellow-600' : 'text-red-600';

            return (
              <Card key={trip.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {trip.bus.busNumber}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{trip.bus.busType.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge className={getBusTypeColor(trip.bus.busType.name)}>
                              {trip.bus.busType.name}
                            </Badge>
                            {amenities.length > 0 && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                {amenities.slice(0, 3).map((amenity, index) => (
                                  <span key={index} className="flex items-center gap-1">
                                    {getAmenityIcon(amenity)}
                                    <span>{amenity}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Departure</p>
                          <p className="font-semibold flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {trip.departureTime}
                          </p>
                          <p className="text-xs text-muted-foreground">{trip.route.origin}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Arrival</p>
                          <p className="font-semibold flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {trip.arrivalTime}
                          </p>
                          <p className="text-xs text-muted-foreground">{trip.route.destination}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-semibold">
                            {trip.route.estimatedDuration ? `${Math.floor(trip.route.estimatedDuration / 60)}h ${trip.route.estimatedDuration % 60}m` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Available Seats</p>
                          <p className={`font-semibold ${availabilityColor}`}>
                            {trip.availableSeats} seats
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Starting from</p>
                        <p className="text-2xl font-bold text-primary">
                          UGX {parseFloat(trip.price).toLocaleString()}
                        </p>
                      </div>
                      <Button 
                        className="btn-accent"
                        onClick={() => setSelectedTrip(trip)}
                        disabled={trip.availableSeats === 0}
                      >
                        {trip.availableSeats === 0 ? 'Sold Out' : 'Select Seats'}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Amenities */}
                  {amenities.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        {amenities.map((amenity, index) => (
                          <span key={index} className="flex items-center gap-1">
                            {getAmenityIcon(amenity)}
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
