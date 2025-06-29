import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Bus, User } from 'lucide-react';

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
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Bus className="h-6 w-6" />
          <span className="text-xl font-bold">Link Bus</span>
        </Link>
        
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-primary">
            Home
          </Link>
          <Link to="/routes" className="text-sm font-medium hover:text-primary">
            Routes
          </Link>
          {user && (
            <Link to="/bookings" className="text-sm font-medium hover:text-primary">
              My Bookings
            </Link>
          )}
          {user?.isAdmin && (
            <Link to="/admin/dashboard" className="text-sm font-medium hover:text-primary">
              Admin Dashboard
            </Link>
          )}
          <Link to="/support" className="text-sm font-medium hover:text-primary">
            Support
          </Link>
          {!user ? (
            <Link to="/login">
              <Button variant="default" size="sm">
                Login
              </Button>
            </Link>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
      </div>
    </header>
  );
}

