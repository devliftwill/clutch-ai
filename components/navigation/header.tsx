"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { LoginDialog } from "@/components/auth/login-dialog";
import { Menu, X } from "lucide-react";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white shadow-md" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex-shrink-0">
            <div className="w-[120px] h-[40px] relative">
              <Image
                src="https://clutchjobs.ca/images/clutchlogo_white@2x.png"
                alt="Clutch Jobs"
                fill
                className={`object-contain ${isScrolled ? "hidden" : "block"}`}
              />
              <Image
                src="https://clutchjobs.ca/images/Clutch_Logo_Color@2x.png"
                alt="Clutch Jobs"
                fill
                className={`object-contain ${!isScrolled ? "hidden" : "block"}`}
              />
            </div>
          </Link>

          <nav className="hidden md:flex space-x-8">
            {[
              { href: "/", label: "Home" },
              { href: "/jobs", label: "Jobs" },
              { href: "/blog", label: "Blog" },
              { href: "/contact", label: "Contact" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isScrolled ? "text-gray-900 hover:text-gray-600" : "text-white hover:text-gray-200"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className={`text-sm font-medium hidden md:block transition-colors hover:bg-transparent ${
                isScrolled ? "text-gray-900 hover:text-gray-600" : "text-white hover:text-gray-200"
              }`}
              onClick={() => setShowLoginDialog(true)}
            >
              Login
            </Button>
            <Link href="/register">
              <Button className="bg-[#87B440] hover:bg-[#759C37]">
                Register
              </Button>
            </Link>
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
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-gray-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Button
                className="w-full text-left px-3 py-2 text-base font-medium bg-[#87B440] hover:bg-[#759C37] text-white"
                onClick={() => {
                  setShowLoginDialog(true);
                  setIsMobileMenuOpen(false);
                }}
              >
                Login
              </Button>
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