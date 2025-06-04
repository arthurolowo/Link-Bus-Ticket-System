import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bus, Calendar, MapPin, Users } from "lucide-react";
import { SearchParams, UGANDAN_CITIES } from "@/types";

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
}

export default function SearchForm({ onSearch }: SearchFormProps) {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    origin: "",
    destination: "",
    date: new Date().toISOString().split('T')[0],
    passengers: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchParams.origin && searchParams.destination && searchParams.date) {
      onSearch(searchParams);
    }
  };

  const handleSwapCities = () => {
    setSearchParams(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin,
    }));
  };

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6 lg:p-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
            {/* From */}
            <div className="space-y-2">
              <Label htmlFor="origin" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                From
              </Label>
              <Select value={searchParams.origin} onValueChange={(value) => 
                setSearchParams(prev => ({ ...prev, origin: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select departure city" />
                </SelectTrigger>
                <SelectContent>
                  {UGANDAN_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Swap Button */}
            <div className="lg:flex lg:items-end lg:justify-center hidden">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleSwapCities}
                className="mb-2"
              >
                ⇄
              </Button>
            </div>
            
            {/* To */}
            <div className="space-y-2">
              <Label htmlFor="destination" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent" />
                To
              </Label>
              <Select value={searchParams.destination} onValueChange={(value) => 
                setSearchParams(prev => ({ ...prev, destination: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {UGANDAN_CITIES.filter(city => city !== searchParams.origin).map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                Travel Date
              </Label>
              <Input
                id="date"
                type="date"
                value={searchParams.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSearchParams(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            
            {/* Passengers */}
            <div className="space-y-2">
              <Label htmlFor="passengers" className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600" />
                Passengers
              </Label>
              <Select value={searchParams.passengers.toString()} onValueChange={(value) => 
                setSearchParams(prev => ({ ...prev, passengers: parseInt(value) }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'Passenger' : 'Passengers'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center">
            <Button 
              type="submit"
              disabled={!searchParams.origin || !searchParams.destination || !searchParams.date}
              className="btn-accent px-8 py-3 text-lg"
            >
              <Bus className="w-5 h-5 mr-2" />
              Search Buses
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
