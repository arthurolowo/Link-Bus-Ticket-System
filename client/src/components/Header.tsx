import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Bus, Menu, User as UserIcon, LogOut, Settings, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { User as UserType } from "@shared/schema";
import { LANGUAGES } from "@/types";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isOpen, setIsOpen] = useState(false);
  
  const typedUser = user as UserType | undefined;

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const NavLinks = ({ isMobile = false }) => (
    <nav className={`${isMobile ? 'flex flex-col space-y-4' : 'hidden md:flex items-center space-x-8'}`}>
      <a href="/" className="text-muted-foreground hover:text-primary transition-colors font-medium">
        Home
      </a>
      <a href="/routes" className="text-muted-foreground hover:text-primary transition-colors font-medium">
        Routes
      </a>
      {isAuthenticated && (
        <a href="/#bookings" className="text-muted-foreground hover:text-primary transition-colors font-medium">
          My Bookings
        </a>
      )}
      <a href="/support" className="text-muted-foreground hover:text-primary transition-colors font-medium">
        Support
      </a>
    </nav>
  );

  return (
    <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Bus className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-primary">Link Bus</h1>
              <p className="text-xs text-muted-foreground">Uganda</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <NavLinks />

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue>
                  {LANGUAGES.find(lang => lang.code === selectedLanguage)?.flag} {LANGUAGES.find(lang => lang.code === selectedLanguage)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    <span className="flex items-center gap-2">
                      {language.flag} {language.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={typedUser?.profileImageUrl || ""} alt={typedUser?.firstName || "User"} />
                      <AvatarFallback>
                        {typedUser?.firstName?.charAt(0) || typedUser?.email?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {typedUser?.firstName && (
                        <p className="font-medium">{typedUser.firstName} {typedUser.lastName || ""}</p>
                      )}
                      {typedUser?.email && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {typedUser.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>My Bookings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={handleLogin} className="btn-primary">
                Sign In
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="md:hidden" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 pb-4 border-b">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <Bus className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-primary">Link Bus</span>
                  </div>
                  <NavLinks isMobile />
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
