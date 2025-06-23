import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bus, Calendar, MapPin, Users, AlertCircle } from "lucide-react";
import { SearchParams, UGANDAN_CITIES } from "@/types";
import { useNavigate } from 'react-router-dom';

export function SearchForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    date: '',
    passengers: '1'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/search-results', { state: formData });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <div className="flex gap-4 mb-4">
        <div className="w-full">
          <label htmlFor="from" className="mb-2 text-sm">From</label>
          <input
            type="text"
            id="from"
            name="from"
            className="input"
            placeholder="Departure city"
            value={formData.from}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="w-full">
          <label htmlFor="to" className="mb-2 text-sm">To</label>
          <input
            type="text"
            id="to"
            name="to"
            className="input"
            placeholder="Destination city"
            value={formData.to}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="w-full">
          <label htmlFor="date" className="mb-2 text-sm">Date</label>
          <input
            type="date"
            id="date"
            name="date"
            className="input"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="w-full">
          <label htmlFor="passengers" className="mb-2 text-sm">Passengers</label>
          <select
            id="passengers"
            name="passengers"
            className="input"
            value={formData.passengers}
            onChange={handleChange}
          >
            {[1, 2, 3, 4, 5].map(num => (
              <option key={num} value={num}>{num} {num === 1 ? 'passenger' : 'passengers'}</option>
            ))}
          </select>
        </div>
      </div>

      <button type="submit" className="btn btn-primary mt-4 w-full">
        Search Buses
      </button>
    </form>
  );
}
