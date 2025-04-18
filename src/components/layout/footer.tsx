import { Button } from "../ui/button";
import { Link } from "../ui/link";
import { Facebook, Instagram, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#1B4B79] text-white py-16">
      <div className="max-w-7xl mx-auto px-4">
        {/* Logo and Navigation Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <Link href="/">
              <img
                src="https://clutchjobs.ca/images/clutchlogo_white@2x.png"
                alt="Clutch Jobs"
                className="w-[120px] h-[40px] object-contain mb-4"
              />
            </Link>
            {/* Social Media Links */}
            <div className="flex space-x-4 mt-4">
              <a 
                href="https://www.facebook.com/profile.php?id=61570316706145"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-300 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://www.instagram.com/clutch_jobs/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-300 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://x.com/Clutch_Jobs"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-300 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li><Link href="/jobs" className="hover:text-gray-300">Browse Jobs</Link></li>
              <li><Link href="/companies" className="hover:text-gray-300">Companies</Link></li>
              <li><Link href="/pricing" className="hover:text-gray-300">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="hover:text-gray-300">About us</Link></li>
              <li><Link href="/blog" className="hover:text-gray-300">Blogs</Link></li>
              <li><Link href="/contact" className="hover:text-gray-300">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link href="/terms" className="hover:text-gray-300">Terms of use</Link></li>
              <li><Link href="/privacy" className="hover:text-gray-300">Privacy</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-gray-300">Cookie policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-white/20 pt-8">
          <h3 className="font-semibold mb-4">Newsletter</h3>
          <p className="mb-4">Join & get important news regularly</p>
          <div className="flex flex-col sm:flex-row gap-2 max-w-md">
            <input
              type="email"
              placeholder="Enter your email*"
              className="flex-1 px-4 py-2 rounded bg-white/10 border border-white/20 focus:outline-none focus:border-white text-white"
            />
            <Button variant="secondary" className="bg-[#87B440] hover:bg-[#759C37] text-white">
              Send
            </Button>
          </div>
          <p className="text-sm mt-2 text-gray-400">We only send interesting and relevant emails.</p>
        </div>
      </div>
    </footer>
  );
}