import React from 'react';
import { Building2, Globe, Shield, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold">HotelFinder</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your trusted partner for finding the perfect hotel stays worldwide. 
              We search multiple providers to bring you the best deals.
            </p>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Services</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Hotel Search</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Best Price Guarantee</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Mobile App</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Travel Insurance</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Booking Policies</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Why Choose Us</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-2 text-sm">
                <Globe className="w-4 h-4 mt-0.5 text-blue-400" />
                <span className="text-gray-400">Search worldwide hotels</span>
              </div>
              <div className="flex items-start space-x-2 text-sm">
                <Shield className="w-4 h-4 mt-0.5 text-blue-400" />
                <span className="text-gray-400">Secure booking process</span>
              </div>
              <div className="flex items-start space-x-2 text-sm">
                <Phone className="w-4 h-4 mt-0.5 text-blue-400" />
                <span className="text-gray-400">24/7 customer support</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 HotelFinder. All rights reserved. | Powered by TBO and WebBeds APIs</p>
        </div>
      </div>
    </footer>
  );
}