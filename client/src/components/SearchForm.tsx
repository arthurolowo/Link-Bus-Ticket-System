import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const UGANDAN_CITIES = [
  'Kampala',
  'Mbarara',
  'Gulu',
  'Jinja',
  'Mbale',
  'Fort Portal',
  'Masaka',
  'Arua',
  'Kabale',
  'Soroti'
];

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

  const validateForm = () => {
    const newErrors = {
      from: '',
      to: '',
      date: ''
    };

    if (!UGANDAN_CITIES.includes(formData.from)) {
      newErrors.from = 'Please select a valid departure city';
    }

    if (!UGANDAN_CITIES.includes(formData.to)) {
      newErrors.to = 'Please select a valid destination city';
    }

    if (formData.from === formData.to) {
      newErrors.to = 'Destination must be different from departure';
    }

    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formData.date || selectedDate < today) {
      newErrors.date = 'Please select a valid future date';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      navigate('/trips', { 
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="from">From</Label>
          <Input
            type="text"
            id="from"
            name="from"
            className={errors.from ? 'border-red-500' : ''}
            placeholder="Departure city"
            value={formData.from}
            onChange={handleChange}
            list="cities"
            required
          />
          {errors.from && <p className="text-sm text-red-500">{errors.from}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="to">To</Label>
          <Input
            type="text"
            id="to"
            name="to"
            className={errors.to ? 'border-red-500' : ''}
            placeholder="Destination city"
            value={formData.to}
            onChange={handleChange}
            list="cities"
            required
          />
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

      <datalist id="cities">
        {UGANDAN_CITIES.map(city => (
          <option key={city} value={city} />
        ))}
      </datalist>
    </form>
  );
}

