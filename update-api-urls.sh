#!/bin/bash

# Update API URLs for Render deployment
# This script updates hardcoded localhost URLs to use the API configuration

echo "Updating API URLs for production deployment..."

# Update PaymentForm component
sed -i 's|http://localhost:5000/api/|/api/|g' client/src/components/PaymentForm.tsx

# Update SeatSelection component
sed -i 's|http://localhost:5000/api/|/api/|g' client/src/components/SeatSelection.tsx

# Update page components
sed -i 's|http://localhost:5000/api/|/api/|g' client/src/pages/TripsPage.tsx
sed -i 's|http://localhost:5000/api/|/api/|g' client/src/pages/SearchResults.tsx
sed -i 's|http://localhost:5000/api/|/api/|g' client/src/pages/RoutesPage.tsx
sed -i 's|http://localhost:5000/api/|/api/|g' client/src/pages/NewBooking.tsx
sed -i 's|http://localhost:5000/api/|/api/|g' client/src/pages/Bookings.tsx
sed -i 's|http://localhost:5000/api/|/api/|g' client/src/pages/AdminDashboard.tsx

# Update admin components
sed -i 's|http://localhost:5000/api/|/api/|g' client/src/components/admin/RouteManager.tsx
sed -i 's|http://localhost:5000/api/|/api/|g' client/src/components/admin/TripManager.tsx

# Update RouteManager specific URL
sed -i 's|const API_BASE_URL = "http://localhost:5000/api";|import { createApiUrl } from "../../config/api";|g' client/src/components/admin/RouteManager.tsx

echo "API URLs updated successfully!"
echo "Remember to:"
echo "1. Test the application locally"
echo "2. Commit changes to git"
echo "3. Deploy to Render" 