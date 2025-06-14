import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Bus, Calendar, Clock, Shield, Smartphone, Heart, Headphones, CreditCard, MapPin, Star } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BusResults from "@/components/BusResults";
import { SearchParams, UGANDAN_CITIES } from "@/types";

export default function Landing() {
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
    queryFn: async () => {
      const params = new URLSearchParams({
        origin: searchParams.origin,
        destination: searchParams.destination,
        date: searchParams.date,
      });
      const res = await fetch(`/api/trips/search?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const handleSearch = () => {
    if (searchParams.origin && searchParams.destination && searchParams.date) {
      setShowResults(true);
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
    <div className="min-h-screen bg-background">
      <Header />
      
      {!showResults ? (
        <>
          {/* Hero Section */}
          <section className="relative py-16 lg:py-24 bg-gradient-to-br from-primary to-primary/80">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
                  Your Journey Starts Here
                </h1>
                <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                  Travel across Uganda with comfort, safety, and reliability. Book your bus tickets in minutes.
                </p>
              </div>
              
              {/* Search Form */}
              <Card className="max-w-4xl mx-auto shadow-2xl">
                <CardContent className="p-6 lg:p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
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
                  </div>
                  
                  <div className="mt-6 flex justify-center">
                    <Button 
                      onClick={handleSearch}
                      disabled={!searchParams.origin || !searchParams.destination || !searchParams.date}
                      className="btn-accent px-8 py-3 text-lg"
                    >
                      <Bus className="w-5 h-5 mr-2" />
                      Search Buses
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  Why Choose Link Bus?
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Experience comfort, reliability, and convenience across Uganda
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Safe & Secure</h3>
                  <p className="text-gray-600">
                    Professional drivers, well-maintained buses, and secure payment processing
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">On-Time Performance</h3>
                  <p className="text-gray-600">
                    Reliable schedules with real-time updates and minimal delays
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Smartphone className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Easy Booking</h3>
                  <p className="text-gray-600">
                    Book tickets in minutes through our user-friendly web and mobile platforms
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Comfort First</h3>
                  <p className="text-gray-600">
                    Spacious seating, air conditioning, and onboard amenities for your comfort
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Headphones className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">24/7 Support</h3>
                  <p className="text-gray-600">
                    Round-the-clock customer support in multiple languages
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <CreditCard className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Flexible Payments</h3>
                  <p className="text-gray-600">
                    Multiple payment options including mobile money and cards
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Popular Routes */}
          <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  Popular Routes
                </h2>
                <p className="text-xl text-gray-600">
                  Our most traveled destinations across Uganda
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { from: "Kampala", to: "Mbarara", price: "45,000", duration: "4h 30m", rating: 4.8 },
                  { from: "Kampala", to: "Gulu", price: "55,000", duration: "5h 15m", rating: 4.7 },
                  { from: "Kampala", to: "Jinja", price: "25,000", duration: "2h 45m", rating: 4.9 },
                  { from: "Kampala", to: "Mbale", price: "40,000", duration: "4h", rating: 4.6 },
                  { from: "Kampala", to: "Fort Portal", price: "50,000", duration: "5h", rating: 4.8 },
                  { from: "Kampala", to: "Kasese", price: "60,000", duration: "6h", rating: 4.5 },
                ].map((route, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{route.from} → {route.to}</h3>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm text-gray-600">{route.rating}</span>
                          </div>
                        </div>
                        <Badge variant="secondary">{route.duration}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-primary">
                          UGX {route.price}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSearchParams(prev => ({
                              ...prev,
                              origin: route.from,
                              destination: route.to,
                            }));
                          }}
                        >
                          Select
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        <BusResults 
          trips={trips || []} 
          isLoading={isSearching}
          searchParams={searchParams}
          onBackToSearch={() => setShowResults(false)}
        />
      )}

      <Footer />
    </div>
  );
}
