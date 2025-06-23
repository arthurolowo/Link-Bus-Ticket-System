import { useState } from 'react';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';
import { Button } from '../components/ui/button';

export default function Landing() {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-8 gap-12">
        {/* Left side - Content */}
        <div className="max-w-xl">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Link Bus Ticket System
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Book your bus tickets easily and securely. Travel with comfort and convenience.
          </p>
          <div className="flex gap-4">
            <a
              href="#features"
              className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Right side - Auth Forms */}
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-lg p-1">
              <Button
                variant={showLogin ? "default" : "ghost"}
                onClick={() => setShowLogin(true)}
                className="rounded-r-none"
              >
                Login
              </Button>
              <Button
                variant={!showLogin ? "default" : "ghost"}
                onClick={() => setShowLogin(false)}
                className="rounded-l-none"
              >
                Register
              </Button>
            </div>
          </div>
          {showLogin ? <LoginForm /> : <RegisterForm />}
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-3">Easy Booking</h3>
              <p className="text-gray-600">Book your tickets in just a few clicks</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-3">Secure Payments</h3>
              <p className="text-gray-600">Your transactions are safe with us</p>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-3">24/7 Support</h3>
              <p className="text-gray-600">We're here to help you anytime</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
