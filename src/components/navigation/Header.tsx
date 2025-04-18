"use client";

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Menu, X } from "lucide-react";
import { LoginDialog } from "../auth/login-dialog";
import { UserAvatar } from "../auth/user-avatar";
import { supabase } from "../../lib/auth";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    // Listen for custom login dialog event
    const handleLoginDialog = () => setShowLoginDialog(true);
    window.addEventListener('openLoginDialog', handleLoginDialog);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('openLoginDialog', handleLoginDialog);
    };
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white shadow-md" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section - Logo */}
          <div className="w-[150px] flex-shrink-0">
            <a href="/" className="flex items-center">
              <div className="h-6 relative">
                <img
                  src="https://clutchjobs.ca/images/clutchlogo_white@2x.png"
                  alt="Clutch Jobs"
                  className={`h-full w-auto object-contain ${isScrolled ? "hidden" : "block"}`}
                />
                <img
                  src="https://clutchjobs.ca/images/Clutch_Logo_Color@2x.png"
                  alt="Clutch Jobs"
                  className={`h-full w-auto object-contain ${!isScrolled ? "hidden" : "block"}`}
                />
              </div>
            </a>
          </div>

          {/* Center section - Navigation */}
          <nav className="hidden md:flex flex-1 justify-center">
            <div className="flex space-x-8">
              {[
                { href: "/", label: "Home" },
                { href: "/jobs", label: "Jobs" },
                { href: "/blog", label: "Blog" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isScrolled ? "text-gray-900 hover:text-gray-600" : "text-white hover:text-gray-200"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>

          {/* Right section - Auth buttons */}
          <div className="w-[180px] flex items-center justify-end space-x-4">
            {isLoggedIn === true ? (
              <UserAvatar />
            ) : isLoggedIn === false ? (
              <>
                <Button
                  variant="ghost"
                  className={`text-sm font-medium hidden md:block transition-colors hover:bg-transparent ${
                    isScrolled ? "text-gray-900 hover:text-gray-600" : "text-white hover:text-gray-200"
                  }`}
                  onClick={() => setShowLoginDialog(true)}
                >
                  Login
                </Button>
                <a href="/register">
                  <Button className="bg-[#87B440] hover:bg-[#759C37]">
                    Register
                  </Button>
                </a>
              </>
            ) : null}
            <Button
              variant="ghost"
              className="md:hidden hover:bg-transparent"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className={isScrolled ? "text-gray-900" : "text-white"} />
              ) : (
                <Menu className={isScrolled ? "text-gray-900" : "text-white"} />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {[
                { href: "/", label: "Home" },
                { href: "/jobs", label: "Jobs" },
                { href: "/blog", label: "Blog" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-gray-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              {isLoggedIn === false && (
                <Button
                  className="w-full text-left px-3 py-2 text-base font-medium bg-[#87B440] hover:bg-[#759C37] text-white"
                  onClick={() => {
                    setShowLoginDialog(true);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <LoginDialog 
        open={showLoginDialog} 
        onOpenChange={setShowLoginDialog} 
      />
    </header>
  );
}