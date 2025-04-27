import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { isSecureConnection, enforceHTTPS } from '../utils/security';

export default function Navigation() {
  useEffect(() => {
    // Enforce HTTPS on production
    enforceHTTPS();
  }, []);

  const isSecure = isSecureConnection();
  return (
    <nav className="bg-[#16213e] border-b border-amber-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center space-x-2 group">
                <i className="fas fa-chart-line text-2xl text-amber-500 group-hover:animate-bounce"></i>
                <span className="text-xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
                  Tendies Tracker™
                </span>
              </Link>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              <Link
                to="/"
                className="border-transparent text-amber-500 hover:text-amber-400 inline-flex items-center px-1 pt-1 border-b-2 border-amber-500/20 hover:border-amber-500 text-sm font-medium transition-colors"
              >
                <i className="fas fa-home mr-2"></i>
                Launch Pad
              </Link>
              <Link
                to="/stocks"
                className="border-transparent text-amber-500 hover:text-amber-400 inline-flex items-center px-1 pt-1 border-b-2 border-amber-500/20 hover:border-amber-500 text-sm font-medium transition-colors"
              >
                <i className="fas fa-rocket mr-2"></i>
                Stonks
              </Link>
              <Link
                to="/portfolio"
                className="border-transparent text-amber-500 hover:text-amber-400 inline-flex items-center px-1 pt-1 border-b-2 border-amber-500/20 hover:border-amber-500 text-sm font-medium transition-colors"
              >
                <i className="fas fa-chart-pie mr-2"></i>
                Loss Porn
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Dynamic Secure Connection Indicator */}
            <div 
              className={`flex items-center ${isSecure ? 'text-green-500' : 'text-red-500'}`}
              title={isSecure ? 'Secure Connection (HTTPS)' : 'Insecure Connection (HTTP)'}
            >
              <i className={`fas ${isSecure ? 'fa-lock' : 'fa-lock-open'} mr-1`}></i>
              <span className="text-xs hidden sm:inline">
                {isSecure ? 'Secure' : 'Not Secure'}
              </span>
            </div>
            <span className="text-amber-500 animate-pulse">
              <i className="fas fa-diamond mr-1"></i>
              💎🙌
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
