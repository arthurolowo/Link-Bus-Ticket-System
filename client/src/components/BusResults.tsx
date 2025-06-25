import { useState, useMemo } from "react";
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
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';

interface Bus {
  id: string;
  company: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  seatsAvailable: number;
  busType: string;
}

interface BusResultsProps {
  buses: Bus[];
  loading?: boolean;
}

export function BusResults({ buses, loading = false }: BusResultsProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="card text-center">
        <p>Loading available buses...</p>
      </div>
    );
  }

  if (buses.length === 0) {
    return (
      <div className="card text-center">
        <p>No buses found for your search criteria.</p>
      </div>
    );
  }

  const handleSelectBus = (busId: string) => {
    navigate(`/select-seats/${busId}`);
  };

  return (
    <div className="flex flex-col gap-4">
      {buses.map((bus) => (
        <div key={bus.id} className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">{bus.company}</h3>
            <span className="text-lg font-bold">UGX {formatCurrency(bus.price)}</span>
          </div>

          <div className="flex justify-between mb-4">
            <div>
              <p className="text-sm">Departure</p>
              <p className="font-bold">{bus.departureTime}</p>
            </div>
            <div>
              <p className="text-sm">Arrival</p>
              <p className="font-bold">{bus.arrivalTime}</p>
            </div>
            <div>
              <p className="text-sm">Bus Type</p>
              <p className="font-bold">{bus.busType}</p>
            </div>
            <div>
              <p className="text-sm">Available Seats</p>
              <p className="font-bold">{bus.seatsAvailable}</p>
            </div>
          </div>

          <button
            onClick={() => handleSelectBus(bus.id)}
            className="btn btn-primary w-full"
          >
            Select Seats
          </button>
        </div>
      ))}
    </div>
  );
}

