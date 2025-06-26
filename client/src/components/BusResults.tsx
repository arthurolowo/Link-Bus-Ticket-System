import { useState, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";
import { Checkbox } from "./ui/checkbox";
import { ArrowLeft, Clock, MapPin, Wifi, Snowflake, Zap, Volume2, ArrowRight, Filter } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import SeatSelection from "./SeatSelection";
import { SearchParams, TripWithDetails } from "../types";

interface Bus {
  id: number;
  routeId: number;
  busId: number;
  departureDate: string;
  departureTime: string;
  arrivalTime: string;
  price: string;
  availableSeats: number;
  status: string;
  route: {
    origin: string;
    destination: string;
    distance: number;
    estimatedDuration: number;
  };
  bus: {
    busNumber: string;
    busType: {
      name: string;
      description: string;
      amenities: string[];
    };
  };
}

interface BusResultsProps {
  buses: Bus[];
  loading?: boolean;
}

export function BusResults({ buses, loading = false }: BusResultsProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg">Loading available buses...</p>
        </div>
      </div>
    );
  }

  if (buses.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-lg mb-4">No buses found for your search criteria.</p>
        <Button onClick={() => navigate('/')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Search
        </Button>
      </div>
    );
  }

  const handleSelectBus = (busId: number) => {
    navigate(`/select-seats/${busId}`);
  };

  return (
    <div className="flex flex-col gap-4">
      {buses.map((bus) => (
        <Card key={bus.id} className="p-6">
          <CardContent className="p-0">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold mb-2">{bus.bus.busType.name}</h3>
                <p className="text-sm text-gray-500">{bus.bus.busNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">UGX {formatCurrency(bus.price)}</p>
                <Badge variant={bus.availableSeats > 10 ? "default" : "secondary"} className="mt-2">
                  {bus.availableSeats} seats left
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Departure</p>
                <p className="font-semibold">{bus.departureTime}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Arrival</p>
                <p className="font-semibold">{bus.arrivalTime}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-semibold">{Math.round(bus.route.estimatedDuration / 60)} hours</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Distance</p>
                <p className="font-semibold">{bus.route.distance} km</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {bus.bus.busType.amenities.map((amenity, index) => (
                <Badge key={index} variant="secondary">
                  {amenity === 'Air Conditioning' && <Snowflake className="h-4 w-4 mr-1" />}
                  {amenity === 'WiFi' && <Wifi className="h-4 w-4 mr-1" />}
                  {amenity === 'USB Charging' && <Zap className="h-4 w-4 mr-1" />}
                  {amenity === 'Entertainment' && <Volume2 className="h-4 w-4 mr-1" />}
                  {amenity}
                </Badge>
              ))}
            </div>

            <Button 
              className="w-full" 
              onClick={() => handleSelectBus(bus.id)}
              disabled={bus.availableSeats === 0}
            >
              {bus.availableSeats === 0 ? 'Sold Out' : 'Select Seats'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

