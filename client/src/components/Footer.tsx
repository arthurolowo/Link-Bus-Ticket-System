import { Bus, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                <Bus className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Link Bus</h3>
                <p className="text-sm text-blue-200">Uganda</p>
              </div>
            </div>
            <p className="text-blue-100">
              Connecting Uganda with safe, comfortable, and reliable bus transportation.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-blue-100">
              <li><a href="#" className="hover:text-white transition-colors">Book Tickets</a></li>
              <li><a href="#" className="hover:text-white transition-colors">My Bookings</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Routes</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-blue-100">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
            <div className="space-y-2 text-blue-100">
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                +256 700 123 456
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                info@linkbus.ug
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Kampala, Uganda
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-blue-400 mt-8 pt-8 text-center text-blue-100">
          <p>&copy; 2024 Link Bus Company. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
