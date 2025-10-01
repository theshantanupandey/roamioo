
// This file was made by Shantanu Pandey
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";

// Import pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import UserFeed from "./pages/UserFeed";
import Feed from "./pages/Feed";
import Discover from "./pages/Discover";
import Search from "./pages/Search";
import Activity from "./pages/Activity";
import Messages from "./pages/Messages";
import Video from "./pages/Video";
import VideoPage from "./pages/VideoPage";
import Trips from "./pages/Trips";
import NewTrip from "./pages/NewTrip";
import TripDetails from "./pages/TripDetails";
import TripPlanning from "./pages/TripPlanning";
import Expenses from "./pages/Expenses";
import ExpenseSplit from "./pages/ExpenseSplit";
import JournalPage from "./pages/JournalPage";
import JournalCompose from "./pages/JournalCompose";
import CreatePost from "./pages/CreatePost";
import CreatePath from "./pages/CreatePath";
import FollowPath from "./pages/FollowPath";
import TranslationPage from "./pages/TranslationPage";
import NearbyPlaces from "./pages/NearbyPlaces";
import ReviewPlace from "./pages/ReviewPlace";
import AccountSettings from "./pages/AccountSettings";
import ProfileSetup from "./pages/ProfileSetup";
import EmailConfirmation from "./pages/EmailConfirmation";
import HelpSupport from "./pages/HelpSupport";
import NotFound from "./pages/NotFound";
import FollowersPage from "./pages/FollowersPage";
import FollowingPage from "./pages/FollowingPage";
import BookingFlights from "./pages/BookingFlights";
import BookingTrains from "./pages/BookingTrains";
import BookingHotels from "./pages/BookingHotels";
import AdventureSports from "./pages/AdventureSports";
import PlaceDetailsPage from "./pages/PlaceDetailsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/profile-setup" element={<ProfileSetup />} />
              <Route path="/email-confirmation" element={<EmailConfirmation />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Index />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/feed" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Feed />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/user/:userId/feed" element={
                <ProtectedRoute>
                  <AppLayout>
                    <UserFeed />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/discover" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Discover />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/search" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Search />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/activity" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Activity />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/messages" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Messages />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Profile />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/profile/:userId" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Profile />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/profile/:userId/followers" element={
                <ProtectedRoute>
                  <AppLayout>
                    <FollowersPage />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/profile/:userId/following" element={
                <ProtectedRoute>
                  <AppLayout>
                    <FollowingPage />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/profile/:userId/posts" element={
                <ProtectedRoute>
                  <AppLayout>
                    <UserFeed />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/video" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Video />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/video/:id" element={
                <ProtectedRoute>
                  <AppLayout>
                    <VideoPage />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/trips" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Trips />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/trips/new" element={
                <ProtectedRoute>
                  <AppLayout>
                    <NewTrip />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/trips/:id" element={
                <ProtectedRoute>
                  <AppLayout>
                    <TripDetails />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/trip-planning" element={
                <ProtectedRoute>
                  <AppLayout>
                    <TripPlanning />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/expenses" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Expenses />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/expenses/split" element={
                <ProtectedRoute>
                  <AppLayout>
                    <ExpenseSplit />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/journal" element={
                <ProtectedRoute>
                  <AppLayout>
                    <JournalPage />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/journal/compose" element={
                <ProtectedRoute>
                  <AppLayout>
                    <JournalCompose />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/create-post" element={
                <ProtectedRoute>
                  <AppLayout>
                    <CreatePost />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/create-path" element={
                <ProtectedRoute>
                  <AppLayout>
                    <CreatePath />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/follow-path" element={
                <ProtectedRoute>
                  <AppLayout>
                    <FollowPath />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/translation" element={
                <ProtectedRoute>
                  <AppLayout>
                    <TranslationPage />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/nearby-places" element={
                <ProtectedRoute>
                  <AppLayout>
                    <NearbyPlaces />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/place/:id" element={
                <ProtectedRoute>
                  <AppLayout>
                    <PlaceDetailsPage />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/place/:id/review" element={
                <ProtectedRoute>
                  <AppLayout>
                    <ReviewPlace />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/account-settings" element={
                <ProtectedRoute>
                  <AppLayout>
                    <AccountSettings />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/help" element={
                <ProtectedRoute>
                  <AppLayout>
                    <HelpSupport />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/booking-flights" element={
                <ProtectedRoute>
                  <AppLayout>
                    <BookingFlights />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/booking-trains" element={
                <ProtectedRoute>
                  <AppLayout>
                    <BookingTrains />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/booking-hotels" element={
                <ProtectedRoute>
                  <AppLayout>
                    <BookingHotels />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/booking/flights" element={
                <ProtectedRoute>
                  <AppLayout>
                    <BookingFlights />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/booking/trains" element={
                <ProtectedRoute>
                  <AppLayout>
                    <BookingTrains />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/booking/hotels" element={
                <ProtectedRoute>
                  <AppLayout>
                    <BookingHotels />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/adventure-sports" element={
                <ProtectedRoute>
                  <AppLayout>
                    <AdventureSports />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
