import { Routes, Route } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { HomePage } from "@/pages/HomePage";
import { BuyPage } from "@/pages/BuyPage";
import { ListingDetailPage } from "@/pages/ListingDetailPage";
import { CheckoutPage } from "@/pages/CheckoutPage";
import { CheckoutReturnPage } from "@/pages/CheckoutReturnPage";
import { CreateListingPage } from "@/pages/CreateListingPage";
import { SellLayout } from "@/layouts/SellLayout";
import { ManageListings } from "@/pages/Sell/ManageListings";
import { MyPurchases } from "@/pages/Sell/MyPurchases";
import { WatchlistPage } from "@/pages/WatchlistPage";
import { BrowsePage } from "@/pages/BrowsePage";
import { DealsPage } from "@/pages/DealsPage";
import { MessagesPage } from "@/pages/MessagesPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { AccountPage } from "@/pages/AccountPage";
import { RequireAuth } from "@/ui/RequireAuth";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/buy" element={<BuyPage />} />
        <Route path="/items" element={<BrowsePage kind="item" />} />
        <Route path="/services" element={<BrowsePage kind="service" />} />
        <Route path="/accommodation" element={<BrowsePage kind="accommodation" />} />
        <Route path="/deals" element={<DealsPage />} />
        <Route path="/listing/:id" element={<ListingDetailPage />} />
        <Route path="/checkout/return" element={<CheckoutReturnPage />} />
        <Route path="/checkout/:id" element={<CheckoutPage />} />
        <Route path="/sell/new" element={<CreateListingPage />} />
        <Route path="/sell/edit/:id" element={<CreateListingPage />} />
        <Route
          path="/sell"
          element={
            <RequireAuth>
              <SellLayout />
            </RequireAuth>
          }
        >
          <Route index element={<ManageListings />} />
          <Route path="purchases" element={<MyPurchases />} />
        </Route>
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
