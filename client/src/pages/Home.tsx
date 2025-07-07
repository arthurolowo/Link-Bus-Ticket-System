import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { UgandanCity } from '../types';
import { Clock, MapPin, Bus, Loader2 } from 'lucide-react';
import { SearchForm } from "../components/SearchForm";
import { motion, AnimatePresence } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useState({
    from: '' as UgandanCity,
    to: '' as UgandanCity,
    date: new Date().toISOString().split('T')[0],
    passengers: '1',
  });

  return (
    <AnimatePresence>
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Search */}
        <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/public/bus-pattern.svg')] opacity-10"></div>
          <motion.div 
            className="container mx-auto px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
          <div className="max-w-4xl mx-auto text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Your Journey Begins Here
            </h1>
              <p className="text-xl md:text-2xl opacity-90 mb-8">
                Book bus tickets online for a seamless journey across Uganda
              </p>
              {user ? (
                <p className="text-lg mb-8">
                  Welcome back, {user.name}! Ready for your next adventure?
                </p>
              ) : (
                <Button 
                  variant="outline" 
                  className="bg-white text-blue-600 hover:bg-blue-50"
                  onClick={() => navigate('/login')}
                >
                  Sign in for exclusive deals
                </Button>
              )}
          </div>

            <motion.div 
              className="max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="shadow-xl backdrop-blur-sm bg-white/95">
                <SearchForm />
              </Card>
            </motion.div>
          </motion.div>
      </section>

      {/* Features Section */}
        <motion.section 
          className="py-20"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div 
                className="text-center p-6 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300"
                variants={fadeInUp}
              >
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quick Booking</h3>
              <p className="text-gray-600">Book your tickets in minutes with our easy-to-use platform</p>
              </motion.div>

              <motion.div 
                className="text-center p-6 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300"
                variants={fadeInUp}
              >
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bus className="h-8 w-8 text-blue-600" />
              </div>
                <h3 className="text-xl font-semibold mb-2">Modern Fleet</h3>
                <p className="text-gray-600">Travel in comfort with our well-maintained modern buses</p>
              </motion.div>

              <motion.div 
                className="text-center p-6 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300"
                variants={fadeInUp}
              >
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-blue-600" />
              </div>
                <h3 className="text-xl font-semibold mb-2">Wide Coverage</h3>
                <p className="text-gray-600">Extensive network covering all major cities in Uganda</p>
              </motion.div>
            </div>
          </div>
        </motion.section>

      {/* Why Choose Us Section */}
        <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-4">Why Choose Us</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Experience the best in bus travel with our premium services and customer-first approach
              </p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {[
                {
                  icon: <Bus className="h-6 w-6 text-blue-600" />,
                  title: "Modern Fleet",
                  description: "Well-maintained buses with modern amenities for your comfort"
                },
                {
                  icon: <Clock className="h-6 w-6 text-blue-600" />,
                  title: "Punctual Service",
                  description: "Reliable departure times and efficient journey planning"
                },
                {
                  icon: <MapPin className="h-6 w-6 text-blue-600" />,
                  title: "Strategic Routes",
                  description: "Direct connections between major cities with convenient stops"
                },
                {
                  icon: <Loader2 className="h-6 w-6 text-blue-600" />,
                  title: "24/7 Support",
                  description: "Round-the-clock customer service for your peace of mind"
                }
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  className="flex gap-4 p-6 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300"
                  variants={fadeInUp}
                >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      {feature.icon}
                </div>
              </div>
              <div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
              </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </div>
    </AnimatePresence>
  );
}
