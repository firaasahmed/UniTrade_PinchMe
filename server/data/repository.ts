import type { University } from "../../src/types/University.ts";
import type { User, NewUser, UserPatch } from "../../src/types/User.ts";
import type { ListingRow, NewListing, ListingPatch, ListingFilter } from "../../src/types/Listing.ts";
import type { Booking, NewBooking, BookingStatus } from "../../src/types/Booking.ts";
import type { Message, NewMessage } from "../../src/types/Message.ts";
import type { Notification, NewNotification } from "../../src/types/Notification.ts";
import type { DealRow, NewDeal, DealStatus } from "../../src/types/Deal.ts";
import type { BrandDeal } from "../../src/types/BrandDeal.ts";

// the single data-access seam — controllers/services only ever call this
// the in-memory impl is one implementation; a supabase/postgres impl drops in behind the same shape
export interface Repository {
  getUniversities(): University[];
  getUniversity(id: string): University | undefined;
  findUniversityByEmail(email: string): University | undefined;

  getUser(id: string): User | undefined;
  getUserByEmail(email: string): User | undefined;
  createUser(input: NewUser, passwordHash?: string): User;
  // credentials live beside the user, never on it, so a hash can't leak through a view
  getPasswordHash(userId: string): string | undefined;
  setPasswordHash(userId: string, hash: string): void;
  // the pinch payer this user maps to under a given merchant, so we upsert one record
  // instead of a new one per payment. merchantId is "" for our own account
  getPinchPayerId(userId: string, merchantId: string): string | undefined;
  setPinchPayerId(userId: string, merchantId: string, payerId: string): void;
  // the managed merchant a seller is paid through; absent until they register
  getPinchMerchantId(userId: string): string | undefined;
  setPinchMerchantId(userId: string, merchantId: string): void;
  updateUser(id: string, patch: UserPatch): User | undefined;

  getListings(filter?: ListingFilter): ListingRow[];
  getListing(id: string): ListingRow | undefined;
  createListing(sellerId: string, input: NewListing): ListingRow;
  updateListing(id: string, patch: ListingPatch): ListingRow | undefined;
  deleteListing(id: string): boolean;

  getBooking(id: string): Booking | undefined;
  getBookingByPayment(pinchPaymentId: string): Booking | undefined;
  getBookingsForBuyer(buyerId: string): Booking[];
  getBookingsForSeller(sellerId: string): Booking[];
  createBooking(input: NewBooking): Booking;
  updateBookingStatus(id: string, status: BookingStatus, at: string): Booking | undefined;

  getMessages(listingId: string, userId: string): Message[];
  getMessagesForUser(userId: string): Message[];
  markThreadRead(listingId: string, userId: string, otherId: string): void;
  createMessage(input: NewMessage): Message;

  getNotifications(userId: string): Notification[];
  createNotification(input: NewNotification): Notification;
  markNotificationRead(id: string): Notification | undefined;

  getWatchlistIds(userId: string): string[];
  addToWatchlist(userId: string, listingId: string): void;
  removeFromWatchlist(userId: string, listingId: string): void;

  getBrandDeals(): BrandDeal[];

  getDeal(id: string): DealRow | undefined;
  getDealsForThread(listingId: string, buyerId: string, sellerId: string): DealRow[];
  getDealsForListing(listingId: string): DealRow[];
  getDealsForUser(userId: string): DealRow[];
  createDeal(buyerId: string, sellerId: string, proposedBy: string, input: NewDeal): DealRow;
  updateDealStatus(id: string, status: DealStatus): DealRow | undefined;
  markDealPaid(id: string): DealRow | undefined;
}
