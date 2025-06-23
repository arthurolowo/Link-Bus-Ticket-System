import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { User } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="card">
      <div className="container flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="Link Bus" className="w-10" />
          <span className="text-lg font-bold">Link Bus</span>
        </Link>
        
        <nav className="flex gap-4">
          <Link to="/" className="btn btn-secondary">Home</Link>
          <Link to="/routes" className="btn btn-secondary">Routes</Link>
          <Link to="/support" className="btn btn-secondary">Support</Link>
          <Link to="/login" className="btn btn-primary">Login</Link>
        </nav>
      </div>
    </header>
  );
}
