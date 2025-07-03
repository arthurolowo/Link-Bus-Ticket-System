import { useState, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";
import { Checkbox } from "./ui/checkbox";
import { ArrowLeft, Clock, MapPin, Wifi, Snowflake, Zap, Volume2, ArrowRight, Filter, Users, AlertCircle } from "lucide-react";
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
    isActive: number;
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg">Loading available buses...</p>
        </div>
      </div>
    );
  }

  if (buses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-lg text-gray-600">No buses found for this route and date.</p>
      </div>
    );
  }

  const handleSelectBus = (bus: Bus) => {
    if (!bus.route.isActive) {
      return; // Don't allow selection of buses on inactive routes
    }
    
    // Navigate to seat selection with all required trip details
    navigate(`/select-seats`, {
      state: {
        tripId: bus.id,
        routeId: bus.routeId,
        busId: bus.busId,
        departureDate: bus.departureDate,
        departureTime: bus.departureTime,
        arrivalTime: bus.arrivalTime,
        price: bus.price,
        availableSeats: bus.availableSeats,
        route: bus.route,
        bus: bus.bus
      }
    });
  };

  return (
    <div className="space-y-4">
      {buses.map((bus) => (
        <Card 
          key={bus.id}
          className={bus.route.isActive ? "" : "border-gray-200 bg-gray-50"}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>
                <span className="text-lg">{bus.bus.busType.name}</span>
                <span className="text-sm text-gray-500 ml-2">({bus.bus.busNumber})</span>
              </div>
              {!bus.route.isActive && (
                <Badge variant="secondary">Route Inactive</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Departure</p>
                  <p className="font-medium">{new Date(bus.departureTime).toLocaleTimeString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Arrival</p>
                  <p className="font-medium">{new Date(bus.arrivalTime).toLocaleTimeString()}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{Math.round(bus.route.estimatedDuration / 60)} hours</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{bus.availableSeats} seats left</span>
                  </div>
                </div>
                <div className="text-lg font-semibold">
                  UGX {parseInt(bus.price).toLocaleString()}
                </div>
              </div>

              {!bus.route.isActive ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 p-2 rounded">
                  <AlertCircle className="h-4 w-4" />
                  <span>This route is currently unavailable for booking</span>
                </div>
              ) : (
                <Button 
                  className="w-full" 
                  onClick={() => handleSelectBus(bus)}
                  disabled={bus.availableSeats === 0}
                >
                  {bus.availableSeats === 0 ? 'Fully Booked' : 'Select Seats'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

