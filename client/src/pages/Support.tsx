import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageCircle, 
  HelpCircle, 
  Shield, 
  CreditCard,
  Bus,
  Calendar,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Send
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Support() {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "",
    message: "",
  });

  const { toast } = useToast();

  const submitContactMutation = useMutation({
    mutationFn: async (formData: typeof contactForm) => {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent Successfully",
        description: "We'll get back to you within 24 hours.",
      });
      setContactForm({
        name: "",
        email: "",
        phone: "",
        subject: "",
        category: "",
        message: "",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Send Message",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    submitContactMutation.mutate(contactForm);
  };

  const faqs = [
    {
      question: "How do I book a bus ticket?",
      answer: "You can book tickets online through our website by selecting your departure city, destination, travel date, and preferred time. Simply search for available buses, select your seat, fill in passenger details, and make payment."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept various payment methods including credit/debit cards (Visa, Mastercard), mobile money (MTN Mobile Money, Airtel Money), and bank transfers. All payments are processed securely."
    },
    {
      question: "Can I cancel or modify my booking?",
      answer: "Yes, you can cancel or modify your booking up to 2 hours before departure time. Cancellation fees may apply depending on how close to departure time you cancel. Full refunds are available for cancellations made 24+ hours in advance."
    },
    {
      question: "What should I bring for my journey?",
      answer: "Please bring a valid ID (national ID, passport, or driver's license) and your booking confirmation. You can show either a printed ticket or the digital ticket on your phone. Arrive at the station 15 minutes before departure."
    },
    {
      question: "What amenities are available on the bus?",
      answer: "Our buses feature comfortable reclining seats, air conditioning, WiFi, power outlets for charging devices, onboard entertainment, and clean restrooms. Complimentary bottled water is provided on longer journeys."
    },
    {
      question: "What if my bus is delayed or cancelled?",
      answer: "In case of delays or cancellations due to weather, road conditions, or mechanical issues, we'll notify you immediately via SMS and email. You'll be offered a full refund or rebooking on the next available service at no extra cost."
    },
    {
      question: "Is there a luggage allowance?",
      answer: "Each passenger is allowed one carry-on bag and one checked luggage bag up to 20kg. Additional or overweight luggage incurs extra charges. Fragile or valuable items should be carried with you."
    },
    {
      question: "How can I track my bus?",
      answer: "Once you've booked, you'll receive real-time updates via SMS about your bus location, departure, and estimated arrival times. You can also check the status on our website using your booking reference."
    }
  ];

  const supportCategories = [
    { icon: Bus, title: "Booking Issues", description: "Problems with making or managing reservations" },
    { icon: CreditCard, title: "Payment & Refunds", description: "Payment processing, refunds, and billing queries" },
    { icon: Calendar, title: "Schedule Changes", description: "Bus delays, cancellations, and rescheduling" },
    { icon: Shield, title: "Safety & Security", description: "Safety concerns and security inquiries" },
    { icon: RefreshCw, title: "Technical Support", description: "Website, app, and digital ticket issues" },
    { icon: HelpCircle, title: "General Inquiry", description: "Other questions and general information" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Help & Support</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're here to help you every step of your journey. Find answers to common questions 
            or get in touch with our support team for personalized assistance.
          </p>
        </div>

        {/* Contact Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Call Us</h3>
              <p className="text-muted-foreground mb-3">24/7 customer support</p>
              <p className="font-semibold text-primary">+256 700 123 456</p>
              <p className="text-sm text-muted-foreground">Emergency: +256 700 123 999</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Email Us</h3>
              <p className="text-muted-foreground mb-3">We respond within 24 hours</p>
              <p className="font-semibold text-accent">support@linkbus.ug</p>
              <p className="text-sm text-muted-foreground">bookings@linkbus.ug</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Live Chat</h3>
              <p className="text-muted-foreground mb-3">Instant assistance available</p>
              <Button className="btn-accent">
                Start Chat
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+256 7XX XXX XXX"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={contactForm.category} onValueChange={(value) => 
                      setContactForm(prev => ({ ...prev, category: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select inquiry type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="booking">Booking Issues</SelectItem>
                        <SelectItem value="payment">Payment & Refunds</SelectItem>
                        <SelectItem value="schedule">Schedule Changes</SelectItem>
                        <SelectItem value="safety">Safety & Security</SelectItem>
                        <SelectItem value="technical">Technical Support</SelectItem>
                        <SelectItem value="general">General Inquiry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Brief description of your inquiry"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Please provide details about your inquiry..."
                      rows={5}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitContactMutation.isPending}
                    className="w-full btn-primary"
                  >
                    {submitContactMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Send Message
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Support Categories */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">What can we help you with?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {supportCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <category.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{category.title}</h3>
                  <p className="text-muted-foreground text-sm">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Operating Hours & Location */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Operating Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Customer Support:</span>
                <span className="font-medium">24/7</span>
              </div>
              <div className="flex justify-between">
                <span>Booking Office:</span>
                <span className="font-medium">5:00 AM - 10:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Terminal Operations:</span>
                <span className="font-medium">4:30 AM - 11:00 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Emergency Support:</span>
                <span className="font-medium text-accent">24/7</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Head Office Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">Link Bus Company Ltd</p>
                <p className="text-muted-foreground">
                  Plot 15, Kampala Road<br />
                  Opposite Central Police Station<br />
                  Kampala, Uganda
                </p>
              </div>
              <div className="pt-2">
                <Button variant="outline" className="w-full">
                  <MapPin className="w-4 h-4 mr-2" />
                  Get Directions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Emergency Notice */}
        <Card className="mt-12 border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800 mb-2">Emergency Assistance</h3>
                <p className="text-red-700 mb-3">
                  If you're experiencing an emergency during travel or need immediate assistance, 
                  please call our emergency hotline: <strong>+256 700 123 999</strong>
                </p>
                <p className="text-sm text-red-600">
                  For medical emergencies, contact local emergency services (999 or 112) first, 
                  then notify our emergency line.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}