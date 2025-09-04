// src/components/AppShell.tsx
import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Users2, CalendarDays, Menu, X, Settings, BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";


const NavLink = ({ to, label, icon: Icon, onClick }: { to: string; label: string; icon: any; onClick?: () => void }) => {
  const { pathname } = useLocation();
  const active = pathname === to || pathname.startsWith(to + "/");
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${active 
          ? "text-white shadow-sm" 
          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        }`}
      style={active ? { backgroundColor: '#0172fb' } : {}}
    >
      <Icon size={18} className={active ? "text-white" : "text-gray-500"} />
      <span>{label}</span>
    </Link>
  );
};

export default function AppShell({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean, Modern Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <Link to="/dashboard" className="flex items-center group">
              <img 
                src="/padelzonelogo.svg" 
                alt="Padel Zone" 
                className="h-10 w-auto transition-transform duration-200 group-hover:scale-105"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <NavLink to="/dashboard" label="Dashboard" icon={BarChart3} />
              <NavLink to="/players" label="Players" icon={Users2} />
              <NavLink to="/events" label="Events" icon={CalendarDays} />
              <NavLink to="/settings" label="Settings" icon={Settings} />
            </nav>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="fixed inset-0 bg-black/50 z-50" onClick={closeMobileMenu} />
            <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={closeMobileMenu}
                    className="p-2"
                  >
                    <X size={20} />
                  </Button>
                </div>
                <nav className="space-y-2">
                  <NavLink to="/dashboard" label="Dashboard" icon={BarChart3} onClick={closeMobileMenu} />
                  <NavLink to="/players" label="Players" icon={Users2} onClick={closeMobileMenu} />
                  <NavLink to="/events" label="Events" icon={CalendarDays} onClick={closeMobileMenu} />
                  <NavLink to="/settings" label="Settings" icon={Settings} onClick={closeMobileMenu} />
                </nav>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Full-width Main Content */}
      <main className="bg-gray-50 min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
