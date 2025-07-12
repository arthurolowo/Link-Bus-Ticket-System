import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useCities } from "../hooks/useCities";

export function SearchForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    date: '',
    passengers: '1'
  });

  const [errors, setErrors] = useState({
    from: '',
    to: '',
    date: ''
  });

  // Fetch available cities from routes
  const { data: availableCities = [], isLoading: citiesLoading, error: citiesError } = useCities();

  const validateForm = () => {
    const newErrors = {
      from: '',
      to: '',
      date: ''
    };

    // Convert input to match city case exactly
    const fromCity = availableCities.find(city => city.toLowerCase() === formData.from.toLowerCase());
    const toCity = availableCities.find(city => city.toLowerCase() === formData.to.toLowerCase());

    if (!fromCity) {
      newErrors.from = 'Please select a valid departure city';
    }

    if (!toCity) {
      newErrors.to = 'Please select a valid destination city';
    }

    if (fromCity === toCity) {
      newErrors.to = 'Destination must be different from departure';
    }

    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formData.date || selectedDate < today) {
      newErrors.date = 'Please select a valid future date';
    }

    setErrors(newErrors);

    if (!Object.values(newErrors).some(error => error !== '')) {
      // Update form data with exact city names
      setFormData(prev => ({
        ...prev,
        from: fromCity || prev.from,
        to: toCity || prev.to
      }));
      return true;
    }
    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      navigate('/search-results', { 
        state: formData,
        replace: true 
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleCitySelect = (name: 'from' | 'to', value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Show loading state
  if (citiesLoading) {
    return (
      <div className="space-y-6 p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3">Loading available destinations...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (citiesError) {
    return (
      <div className="space-y-6 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Failed to load available destinations</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show message if no cities available
  if (availableCities.length === 0) {
    return (
      <div className="space-y-6 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No routes available at the moment</p>
          <p className="text-sm text-gray-500">Please check back later or contact support</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="from">From</Label>
          <Select value={formData.from} onValueChange={(value) => handleCitySelect('from', value)}>
            <SelectTrigger className={errors.from ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select departure city" />
            </SelectTrigger>
            <SelectContent>
              {availableCities.map(city => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.from && <p className="text-sm text-red-500">{errors.from}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="to">To</Label>
          <Select value={formData.to} onValueChange={(value) => handleCitySelect('to', value)}>
            <SelectTrigger className={errors.to ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select destination city" />
            </SelectTrigger>
            <SelectContent>
              {availableCities
                .filter(city => city !== formData.from) // Exclude selected "from" city
                .map(city => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
          {errors.to && <p className="text-sm text-red-500">{errors.to}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            type="date"
            id="date"
            name="date"
            className={errors.date ? 'border-red-500' : ''}
            value={formData.date}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            required
          />
          {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="passengers">Passengers</Label>
          <Select name="passengers" value={formData.passengers} onValueChange={(value) => handleChange({ target: { name: 'passengers', value } } as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Select passengers" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map(num => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? 'passenger' : 'passengers'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" className="w-full">
        Search Buses
      </Button>
    </form>
  );
}

