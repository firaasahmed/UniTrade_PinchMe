import type { Repository } from "../repository.ts";
import type { SeedData } from "../seed/index.ts";
import type { University } from "../../../src/types/University.ts";
import type { User, NewUser, UserPatch } from "../../../src/types/User.ts";
import type { ListingRow, NewListing, ListingPatch, ListingFilter } from "../../../src/types/Listing.ts";
import type { Booking, NewBooking, BookingStatus } from "../../../src/types/Booking.ts";
import type { Message, NewMessage } from "../../../src/types/Message.ts";
import type { Notification, NewNotification } from "../../../src/types/Notification.ts";
import type { DealRow, NewDeal, DealStatus } from "../../../src/types/Deal.ts";
import { SEED_PASSWORD_HASH } from "../seed/users.ts";
import type { Clock } from "../../lib/clock.ts";
import { systemClock } from "../../lib/clock.ts";

function domainOf(email: string): string {
  return email.slice(email.lastIndexOf("@") + 1).toLowerCase();
}

// next numeric suffix for a prefixed id sequence, e.g. ["l1","l2"] -> 3
function nextSuffix(ids: string[], prefix: string): number {
  let max = 0;
  for (const id of ids) {
    if (id.startsWith(prefix)) {
      const n = Number(id.slice(prefix.length));
      if (Number.isInteger(n) && n > max) max = n;
    }
  }
  return max + 1;
}

export function createInMemoryRepository(seed: SeedData, clock: Clock = systemClock): Repository {
  const universities: University[] = [...seed.universities];
  const users: User[] = [...seed.users];
  const listings: ListingRow[] = [...seed.listings];
  const deals: DealRow[] = [];
  const bookings: Booking[] = [];
  const messages: Message[] = [];
  const notifications: Notification[] = [];
  // userId -> bcrypt hash, kept out of the user object itself
  const hashes = new Map<string, string>(users.map((u) => [u.id, SEED_PASSWORD_HASH]));
  // "userId:merchantId" -> pinch payer id; payers belong to one merchant
  const payerIds = new Map<string, string>();
  // userId -> managed merchant id, set once a seller registers to be paid
  const merchantIds = new Map<string, string>();
  // userId -> set of watched listing ids
  const watchlists = new Map<string, Set<string>>();

  const counters = {
    user: nextSuffix(users.map((u) => u.id), "usr"),
    listing: nextSuffix(listings.map((l) => l.id), "l"),
    deal: 1,
    booking: 1,
    message: 1,
    notification: 1,
  };

  const userById = (id: string) => users.find((u) => u.id === id);

  return {
    getUniversities: () => [...universities],
    getUniversity: (id) => universities.find((u) => u.id === id),
    findUniversityByEmail: (email) => {
      const domain = domainOf(email);
      return universities.find((u) => u.emailDomains.includes(domain));
    },

    getUser: (id) => userById(id),
    getUserByEmail: (email) => users.find((u) => u.email.toLowerCase() === email.toLowerCase()),
    createUser: (input: NewUser, passwordHash?: string) => {
      const uni = universities.find((u) => u.id === input.universityId);
      const verified =
        input.verified ??
        (uni ? uni.emailDomains.includes(domainOf(input.email)) : false);
      const user: User = {
        id: `usr${counters.user++}`,
        name: input.name,
        email: input.email,
        universityId: input.universityId,
        role: input.role,
        verified,
        location: input.location,
        lat: input.lat,
        lng: input.lng,
        createdAt: clock(),
      };
      users.push(user);
      if (passwordHash) hashes.set(user.id, passwordHash);
      return user;
    },
    getPasswordHash: (userId) => hashes.get(userId),
    setPasswordHash: (userId, hash) => {
      hashes.set(userId, hash);
    },
    getPinchPayerId: (userId, merchantId) => payerIds.get(`${userId}:${merchantId}`),
    setPinchPayerId: (userId, merchantId, payerId) => {
      payerIds.set(`${userId}:${merchantId}`, payerId);
    },
    getPinchMerchantId: (userId) => merchantIds.get(userId),
    setPinchMerchantId: (userId, merchantId) => {
      merchantIds.set(userId, merchantId);
    },
    updateUser: (id, patch: UserPatch) => {
      const user = userById(id);
      if (!user) return undefined;
      if (patch.name !== undefined) user.name = patch.name;
      if (patch.location !== undefined) user.location = patch.location;
      return user;
    },

    getListings: (filter: ListingFilter = {}) => {
      let rows = [...listings];
      if (filter.status) rows = rows.filter((l) => l.status === filter.status);
      if (filter.sellerId) rows = rows.filter((l) => l.sellerId === filter.sellerId);
      if (filter.category) {
        const c = filter.category.toLowerCase();
        rows = rows.filter((l) => l.category.toLowerCase() === c);
      }
      if (filter.universityId) {
        rows = rows.filter((l) => userById(l.sellerId)?.universityId === filter.universityId);
      }
      if (filter.city) {
        const city = filter.city.toLowerCase();
        rows = rows.filter((l) => {
          const uniCity = universities.find((u) => u.id === userById(l.sellerId)?.universityId)?.city.toLowerCase();
          return l.location.toLowerCase().includes(city) || uniCity === city;
        });
      }
      // newest first, stable tie-break on id
      return rows.sort((a, b) =>
        a.createdAt === b.createdAt ? a.id.localeCompare(b.id) : b.createdAt.localeCompare(a.createdAt),
      );
    },
    getListing: (id) => listings.find((l) => l.id === id),
    createListing: (sellerId, input: NewListing) => {
      const now = clock();
      const row: ListingRow = {
        id: `l${counters.listing++}`,
        sellerId,
        title: input.title,
        description: input.description,
        priceCents: input.priceCents,
        rateUnit: input.rateUnit,
        category: input.category,
        condition: input.condition,
        location: input.location,
        lat: input.lat,
        lng: input.lng,
        meetup: input.meetup,
        imageUrl: input.imageUrl,
        images: input.images,
        unlimited: input.unlimited,
        status: input.status ?? "active",
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        bondCents: input.bondCents,
        availableFrom: input.availableFrom,
        leaseTerm: input.leaseTerm,
        furnished: input.furnished,
        transit: input.transit,
        inspectionAvailability: input.inspectionAvailability,
        createdAt: now,
        updatedAt: now,
      };
      listings.push(row);
      return row;
    },
    updateListing: (id, patch: ListingPatch) => {
      const row = listings.find((l) => l.id === id);
      if (!row) return undefined;
      Object.assign(row, patch, { updatedAt: clock() });
      return row;
    },
    deleteListing: (id) => {
      const i = listings.findIndex((l) => l.id === id);
      if (i === -1) return false;
      listings.splice(i, 1);
      return true;
    },

    getBooking: (id) => bookings.find((b) => b.id === id),
    getBookingByPayment: (pinchPaymentId) => bookings.find((b) => b.pinchPaymentId === pinchPaymentId),
    getBookingsForBuyer: (buyerId) => bookings.filter((b) => b.buyerId === buyerId),
    createBooking: (input: NewBooking) => {
      const booking: Booking = {
        id: `bkg${counters.booking++}`,
        listingId: input.listingId,
        buyerId: input.buyerId,
        sellerId: input.sellerId,
        pinchPaymentId: input.pinchPaymentId,
        amountCents: input.amountCents,
        status: "HELD",
        buyerConfirmedAt: null,
        sellerConfirmedAt: null,
        createdAt: clock(),
      };
      bookings.push(booking);
      return booking;
    },
    updateBookingStatus: (id, status: BookingStatus, at) => {
      const booking = bookings.find((b) => b.id === id);
      if (!booking) return undefined;
      booking.status = status;
      if (status === "RELEASED") booking.buyerConfirmedAt = at;
      return booking;
    },

    getMessages: (listingId, userId) =>
      messages
        .filter(
          (m) => m.listingId === listingId && (m.senderId === userId || m.recipientId === userId),
        )
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    getMessagesForUser: (userId) =>
      messages
        .filter((m) => m.senderId === userId || m.recipientId === userId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    markThreadRead: (listingId, userId, otherId) => {
      const now = clock();
      for (const m of messages) {
        if (m.listingId === listingId && m.recipientId === userId && m.senderId === otherId && !m.readAt) {
          m.readAt = now;
        }
      }
    },
    createMessage: (input: NewMessage) => {
      const message: Message = {
        id: `msg${counters.message++}`,
        listingId: input.listingId,
        senderId: input.senderId,
        recipientId: input.recipientId,
        body: input.body,
        createdAt: clock(),
        readAt: null,
      };
      messages.push(message);
      return message;
    },

    getNotifications: (userId) =>
      notifications.filter((n) => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    createNotification: (input: NewNotification) => {
      const notification: Notification = {
        id: `ntf${counters.notification++}`,
        userId: input.userId,
        type: input.type,
        payload: input.payload,
        readAt: null,
        createdAt: clock(),
      };
      notifications.push(notification);
      return notification;
    },
    markNotificationRead: (id) => {
      const n = notifications.find((x) => x.id === id);
      if (!n) return undefined;
      n.readAt = clock();
      return n;
    },

    getBrandDeals: () => [...seed.brandDeals],

    getDeal: (id) => deals.find((d) => d.id === id),
    getDealsForListing: (listingId) =>
      deals
        .filter((d) => d.listingId === listingId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    getDealsForThread: (listingId, buyerId, sellerId) =>
      deals
        .filter((d) => d.listingId === listingId && d.buyerId === buyerId && d.sellerId === sellerId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    getDealsForUser: (userId) =>
      deals
        .filter((d) => d.buyerId === userId || d.sellerId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    createDeal: (buyerId, sellerId, proposedBy, input: NewDeal) => {
      const now = clock();
      const row: DealRow = {
        id: `dl${counters.deal++}`,
        listingId: input.listingId,
        buyerId,
        sellerId,
        kind: input.kind,
        amountCents: input.amountCents,
        scheduledFor: input.scheduledFor,
        note: input.note,
        proposedBy,
        status: "pending",
        paidAt: null,
        createdAt: now,
        updatedAt: now,
      };
      deals.push(row);
      return row;
    },
    updateDealStatus: (id, status: DealStatus) => {
      const row = deals.find((d) => d.id === id);
      if (!row) return undefined;
      row.status = status;
      row.updatedAt = clock();
      return row;
    },
    markDealPaid: (id) => {
      const row = deals.find((d) => d.id === id);
      if (!row) return undefined;
      row.paidAt = clock();
      row.updatedAt = row.paidAt;
      return row;
    },

    getWatchlistIds: (userId) => [...(watchlists.get(userId) ?? [])],
    addToWatchlist: (userId, listingId) => {
      const set = watchlists.get(userId) ?? new Set<string>();
      set.add(listingId);
      watchlists.set(userId, set);
    },
    removeFromWatchlist: (userId, listingId) => {
      watchlists.get(userId)?.delete(listingId);
    },
  };
}
