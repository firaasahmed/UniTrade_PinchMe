import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Repository } from "../repository.ts";
import type { SeedData } from "../seed/index.ts";
import type { University } from "../../../src/types/University.ts";
import type { User, NewUser, UserPatch } from "../../../src/types/User.ts";
import type { ListingRow, NewListing, ListingPatch, ListingFilter, TransitLink } from "../../../src/types/Listing.ts";
import type { InspectionAvailability } from "../../../src/types/Inspection.ts";
import type { Booking, NewBooking, BookingStatus } from "../../../src/types/Booking.ts";
import type { Message, NewMessage } from "../../../src/types/Message.ts";
import type { Notification, NewNotification } from "../../../src/types/Notification.ts";
import type { DealRow, NewDeal, DealStatus } from "../../../src/types/Deal.ts";
import type { BrandDeal } from "../../../src/types/BrandDeal.ts";
import type { Clock } from "../../lib/clock.ts";
import { systemClock } from "../../lib/clock.ts";
import { SCHEMA } from "./schema.ts";
import { SEED_PASSWORD_HASH } from "../seed/users.ts";
import { SEED_MERCHANTS } from "../seed/merchants.ts";

type Row = Record<string, unknown>;
type Bindable = string | number | null;

// sqlite gives back unknowns; these narrow to the shapes our types promise
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const num = (v: unknown): number => (typeof v === "number" ? v : 0);
const optStr = (v: unknown): string | undefined => (typeof v === "string" && v !== "" ? v : undefined);
const optNum = (v: unknown): number | undefined => (typeof v === "number" ? v : undefined);
const nullStr = (v: unknown): string | null => (typeof v === "string" ? v : null);
const bool = (v: unknown): boolean => v === 1;
const optBool = (v: unknown): boolean | undefined => (v === null || v === undefined ? undefined : v === 1);

// undefined isn't bindable — everything optional becomes NULL
const b = (v: string | number | undefined | null): Bindable => (v === undefined || v === null ? null : v);
const bBool = (v: boolean | undefined): Bindable => (v === undefined ? null : v ? 1 : 0);

function json<T>(v: unknown, fallback: T): T {
  if (typeof v !== "string" || v === "") return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

function domainOf(email: string): string {
  return email.slice(email.lastIndexOf("@") + 1).toLowerCase();
}

export function createSqliteRepository(
  file: string,
  seed: SeedData,
  clock: Clock = systemClock,
): Repository {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
  migrate(db, seed);
  seedIfEmpty(db, seed);
  seedBrandDeals(db, seed);
  seedMerchants(db);

  const all = (sql: string, ...args: Bindable[]): Row[] => db.prepare(sql).all(...args) as Row[];
  const one = (sql: string, ...args: Bindable[]): Row | undefined =>
    db.prepare(sql).get(...args) as Row | undefined;
  const run = (sql: string, ...args: Bindable[]): void => {
    db.prepare(sql).run(...args);
  };

  // next id in a prefixed sequence, e.g. ["l1","l2"] -> "l3"
  const nextId = (table: string, prefix: string): string => {
    let max = 0;
    for (const row of all(`SELECT id FROM ${table} WHERE id LIKE ?`, `${prefix}%`)) {
      const n = Number(str(row.id).slice(prefix.length));
      if (Number.isInteger(n) && n > max) max = n;
    }
    return `${prefix}${max + 1}`;
  };

  const toUniversity = (r: Row): University => ({
    id: str(r.id),
    name: str(r.name),
    emailDomains: json<string[]>(r.emailDomains, []),
    city: str(r.city),
    state: str(r.state),
    lat: num(r.lat),
    lng: num(r.lng),
  });

  const toUser = (r: Row): User => ({
    id: str(r.id),
    name: str(r.name),
    email: str(r.email),
    universityId: str(r.universityId),
    role: str(r.role) === "admin" ? "admin" : "student",
    verified: bool(r.verified),
    orgType: optStr(r.orgType) as User["orgType"],
    location: str(r.location),
    lat: num(r.lat),
    lng: num(r.lng),
    createdAt: str(r.createdAt),
  });

  const toListing = (r: Row): ListingRow => ({
    id: str(r.id),
    sellerId: str(r.sellerId),
    title: str(r.title),
    description: str(r.description),
    priceCents: num(r.priceCents),
    rateUnit: optStr(r.rateUnit),
    category: str(r.category),
    condition: str(r.condition),
    location: str(r.location),
    lat: num(r.lat),
    lng: num(r.lng),
    meetup: str(r.meetup),
    imageUrl: str(r.imageUrl),
    images: r.images == null ? undefined : json<string[]>(r.images, []),
    unlimited: optBool(r.unlimited),
    status: str(r.status) as ListingRow["status"],
    bedrooms: optNum(r.bedrooms),
    bathrooms: optNum(r.bathrooms),
    bondCents: optNum(r.bondCents),
    availableFrom: optStr(r.availableFrom),
    leaseTerm: optStr(r.leaseTerm),
    furnished: optBool(r.furnished),
    transit: r.transit == null ? undefined : json<TransitLink[]>(r.transit, []),
    inspectionAvailability:
      r.inspectionAvailability == null
        ? undefined
        : json<InspectionAvailability | undefined>(r.inspectionAvailability, undefined),
    createdAt: str(r.createdAt),
    updatedAt: str(r.updatedAt),
  });

  const toBooking = (r: Row): Booking => ({
    id: str(r.id),
    listingId: str(r.listingId),
    buyerId: str(r.buyerId),
    sellerId: str(r.sellerId),
    pinchPaymentId: str(r.pinchPaymentId),
    amountCents: num(r.amountCents),
    status: str(r.status) as BookingStatus,
    buyerConfirmedAt: nullStr(r.buyerConfirmedAt),
    sellerConfirmedAt: nullStr(r.sellerConfirmedAt),
    createdAt: str(r.createdAt),
  });

  const toMessage = (r: Row): Message => ({
    id: str(r.id),
    listingId: str(r.listingId),
    senderId: str(r.senderId),
    recipientId: str(r.recipientId),
    body: str(r.body),
    ...(optStr(r.dealId) ? { dealId: str(r.dealId) } : {}),
    createdAt: str(r.createdAt),
    readAt: nullStr(r.readAt),
  });

  const toNotification = (r: Row): Notification => ({
    id: str(r.id),
    userId: str(r.userId),
    type: str(r.type) as Notification["type"],
    payload: json<Record<string, string>>(r.payload, {}),
    readAt: nullStr(r.readAt),
    createdAt: str(r.createdAt),
  });

  const toDeal = (r: Row): DealRow => ({
    id: str(r.id),
    listingId: str(r.listingId),
    buyerId: str(r.buyerId),
    sellerId: str(r.sellerId),
    kind: str(r.kind) as DealRow["kind"],
    amountCents: optNum(r.amountCents),
    scheduledFor: optStr(r.scheduledFor),
    scheduledAt: optStr(r.scheduledAt),
    note: str(r.note),
    proposedBy: str(r.proposedBy),
    status: str(r.status) as DealStatus,
    paidAt: nullStr(r.paidAt),
    createdAt: str(r.createdAt),
    updatedAt: str(r.updatedAt),
  });

  const toBrandDeal = (r: Row): BrandDeal => ({
    id: str(r.id),
    brand: str(r.brand),
    tagline: str(r.tagline),
    category: str(r.category),
    discount: str(r.discount),
    code: str(r.code),
    tile: str(r.tile),
    logo: str(r.logo) as BrandDeal["logo"],
    url: str(r.url),
  });

  return {
    getUniversities: () => all("SELECT * FROM universities ORDER BY id").map(toUniversity),
    getUniversity: (id) => {
      const r = one("SELECT * FROM universities WHERE id = ?", id);
      return r ? toUniversity(r) : undefined;
    },
    findUniversityByEmail: (email) => {
      const domain = domainOf(email);
      return all("SELECT * FROM universities")
        .map(toUniversity)
        .find((u) => u.emailDomains.includes(domain));
    },

    getUser: (id) => {
      const r = one("SELECT * FROM users WHERE id = ?", id);
      return r ? toUser(r) : undefined;
    },
    getUserByEmail: (email) => {
      const r = one("SELECT * FROM users WHERE LOWER(email) = ?", email.toLowerCase());
      return r ? toUser(r) : undefined;
    },
    createUser: (input: NewUser, passwordHash?: string) => {
      const uni = one("SELECT * FROM universities WHERE id = ?", input.universityId);
      const verified =
        input.verified ??
        (uni ? toUniversity(uni).emailDomains.includes(domainOf(input.email)) : false);
      const user: User = {
        id: nextId("users", "usr"),
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
      run(
        `INSERT INTO users (id,name,email,universityId,role,passwordHash,verified,orgType,location,lat,lng,createdAt)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        user.id,
        user.name,
        user.email,
        user.universityId,
        user.role,
        b(passwordHash),
        user.verified ? 1 : 0,
        null,
        user.location,
        user.lat,
        user.lng,
        user.createdAt,
      );
      return user;
    },
    getPasswordHash: (userId) => optStr(one("SELECT passwordHash FROM users WHERE id = ?", userId)?.passwordHash),
    setPasswordHash: (userId, hash) => {
      run("UPDATE users SET passwordHash = ? WHERE id = ?", hash, userId);
    },
    getPinchPayerId: (userId, merchantId) =>
      optStr(
        one(
          "SELECT payerId FROM pinch_payers WHERE userId = ? AND merchantId = ?",
          userId,
          merchantId,
        )?.payerId,
      ),
    setPinchPayerId: (userId, merchantId, payerId) => {
      run(
        `INSERT INTO pinch_payers (userId, merchantId, payerId) VALUES (?,?,?)
         ON CONFLICT(userId, merchantId) DO UPDATE SET payerId = excluded.payerId`,
        userId,
        merchantId,
        payerId,
      );
    },
    getPinchMerchantId: (userId) =>
      optStr(one("SELECT pinchMerchantId FROM users WHERE id = ?", userId)?.pinchMerchantId),
    setPinchMerchantId: (userId, merchantId) => {
      run("UPDATE users SET pinchMerchantId = ? WHERE id = ?", merchantId, userId);
    },
    updateUser: (id, patch: UserPatch) => {
      if (patch.name !== undefined) run("UPDATE users SET name = ? WHERE id = ?", patch.name, id);
      if (patch.location !== undefined) run("UPDATE users SET location = ? WHERE id = ?", patch.location, id);
      const r = one("SELECT * FROM users WHERE id = ?", id);
      return r ? toUser(r) : undefined;
    },

    getListings: (filter: ListingFilter = {}) => {
      const where: string[] = [];
      const args: Bindable[] = [];
      if (filter.status) {
        where.push("l.status = ?");
        args.push(filter.status);
      }
      if (filter.sellerId) {
        where.push("l.sellerId = ?");
        args.push(filter.sellerId);
      }
      if (filter.category) {
        where.push("LOWER(l.category) = ?");
        args.push(filter.category.toLowerCase());
      }
      if (filter.universityId) {
        where.push("u.universityId = ?");
        args.push(filter.universityId);
      }
      if (filter.city) {
        // matches the listing suburb or the seller's university city
        where.push("(INSTR(LOWER(l.location), ?) > 0 OR LOWER(uni.city) = ?)");
        args.push(filter.city.toLowerCase(), filter.city.toLowerCase());
      }
      const sql = `
        SELECT l.* FROM listings l
        JOIN users u ON u.id = l.sellerId
        LEFT JOIN universities uni ON uni.id = u.universityId
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY l.createdAt DESC, l.id ASC`;
      return all(sql, ...args).map(toListing);
    },
    getListing: (id) => {
      const r = one("SELECT * FROM listings WHERE id = ?", id);
      return r ? toListing(r) : undefined;
    },
    createListing: (sellerId, input: NewListing) => {
      const now = clock();
      const row: ListingRow = {
        id: nextId("listings", "l"),
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
      run(
        `INSERT INTO listings (id,sellerId,title,description,priceCents,rateUnit,category,condition,location,lat,lng,meetup,imageUrl,images,unlimited,status,bedrooms,bathrooms,bondCents,availableFrom,leaseTerm,furnished,transit,inspectionAvailability,createdAt,updatedAt)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        row.id,
        row.sellerId,
        row.title,
        row.description,
        row.priceCents,
        b(row.rateUnit),
        row.category,
        row.condition,
        row.location,
        row.lat,
        row.lng,
        row.meetup,
        row.imageUrl,
        row.images ? JSON.stringify(row.images) : null,
        bBool(row.unlimited),
        row.status,
        b(row.bedrooms),
        b(row.bathrooms),
        b(row.bondCents),
        b(row.availableFrom),
        b(row.leaseTerm),
        bBool(row.furnished),
        row.transit ? JSON.stringify(row.transit) : null,
        row.inspectionAvailability ? JSON.stringify(row.inspectionAvailability) : null,
        row.createdAt,
        row.updatedAt,
      );
      return row;
    },
    updateListing: (id, patch: ListingPatch) => {
      const sets: string[] = [];
      const args: Bindable[] = [];
      const put = (col: string, v: Bindable) => {
        sets.push(`${col} = ?`);
        args.push(v);
      };
      if (patch.title !== undefined) put("title", patch.title);
      if (patch.description !== undefined) put("description", patch.description);
      if (patch.priceCents !== undefined) put("priceCents", patch.priceCents);
      if ("rateUnit" in patch) put("rateUnit", b(patch.rateUnit));
      if (patch.category !== undefined) put("category", patch.category);
      if (patch.condition !== undefined) put("condition", patch.condition);
      if (patch.location !== undefined) put("location", patch.location);
      if (patch.lat !== undefined) put("lat", patch.lat);
      if (patch.lng !== undefined) put("lng", patch.lng);
      if (patch.meetup !== undefined) put("meetup", patch.meetup);
      if (patch.imageUrl !== undefined) put("imageUrl", patch.imageUrl);
      if ("images" in patch) put("images", patch.images ? JSON.stringify(patch.images) : null);
      if ("unlimited" in patch) put("unlimited", bBool(patch.unlimited));
      if (patch.status !== undefined) put("status", patch.status);
      if ("bedrooms" in patch) put("bedrooms", b(patch.bedrooms));
      if ("bathrooms" in patch) put("bathrooms", b(patch.bathrooms));
      if ("bondCents" in patch) put("bondCents", b(patch.bondCents));
      if ("availableFrom" in patch) put("availableFrom", b(patch.availableFrom));
      if ("leaseTerm" in patch) put("leaseTerm", b(patch.leaseTerm));
      if ("transit" in patch) put("transit", patch.transit ? JSON.stringify(patch.transit) : null);
      if ("inspectionAvailability" in patch) {
        put(
          "inspectionAvailability",
          patch.inspectionAvailability ? JSON.stringify(patch.inspectionAvailability) : null,
        );
      }
      if ("furnished" in patch) put("furnished", bBool(patch.furnished));
      put("updatedAt", clock());
      args.push(id);
      run(`UPDATE listings SET ${sets.join(", ")} WHERE id = ?`, ...args);
      const r = one("SELECT * FROM listings WHERE id = ?", id);
      return r ? toListing(r) : undefined;
    },
    deleteListing: (id) => {
      const existed = one("SELECT id FROM listings WHERE id = ?", id) !== undefined;
      if (existed) run("DELETE FROM listings WHERE id = ?", id);
      return existed;
    },

    getBooking: (id) => {
      const r = one("SELECT * FROM bookings WHERE id = ?", id);
      return r ? toBooking(r) : undefined;
    },
    getBookingByPayment: (pinchPaymentId) => {
      const r = one("SELECT * FROM bookings WHERE pinchPaymentId = ?", pinchPaymentId);
      return r ? toBooking(r) : undefined;
    },
    getBookingsForBuyer: (buyerId) =>
      all("SELECT * FROM bookings WHERE buyerId = ? ORDER BY createdAt DESC", buyerId).map(toBooking),
    getBookingsForSeller: (sellerId) =>
      all("SELECT * FROM bookings WHERE sellerId = ? ORDER BY createdAt DESC", sellerId).map(toBooking),
    createBooking: (input: NewBooking) => {
      const booking: Booking = {
        id: nextId("bookings", "bkg"),
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
      run(
        `INSERT INTO bookings (id,listingId,buyerId,sellerId,pinchPaymentId,amountCents,status,buyerConfirmedAt,sellerConfirmedAt,createdAt)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        booking.id,
        booking.listingId,
        booking.buyerId,
        booking.sellerId,
        booking.pinchPaymentId,
        booking.amountCents,
        booking.status,
        null,
        null,
        booking.createdAt,
      );
      return booking;
    },
    updateBookingStatus: (id, status: BookingStatus, at) => {
      run("UPDATE bookings SET status = ? WHERE id = ?", status, id);
      if (status === "RELEASED") run("UPDATE bookings SET buyerConfirmedAt = ? WHERE id = ?", at, id);
      const r = one("SELECT * FROM bookings WHERE id = ?", id);
      return r ? toBooking(r) : undefined;
    },

    getMessages: (listingId, userId) =>
      all(
        `SELECT * FROM messages WHERE listingId = ? AND (senderId = ? OR recipientId = ?)
         ORDER BY createdAt ASC, id ASC`,
        listingId,
        userId,
        userId,
      ).map(toMessage),
    getMessagesForUser: (userId) =>
      all(
        `SELECT * FROM messages WHERE senderId = ? OR recipientId = ? ORDER BY createdAt ASC, id ASC`,
        userId,
        userId,
      ).map(toMessage),
    markThreadRead: (listingId, userId, otherId) => {
      run(
        `UPDATE messages SET readAt = ?
         WHERE listingId = ? AND recipientId = ? AND senderId = ? AND readAt IS NULL`,
        clock(),
        listingId,
        userId,
        otherId,
      );
    },
    createMessage: (input: NewMessage) => {
      const message: Message = {
        id: nextId("messages", "msg"),
        listingId: input.listingId,
        senderId: input.senderId,
        recipientId: input.recipientId,
        body: input.body,
        ...(input.dealId ? { dealId: input.dealId } : {}),
        createdAt: clock(),
        readAt: null,
      };
      run(
        `INSERT INTO messages (id,listingId,senderId,recipientId,body,dealId,createdAt,readAt)
         VALUES (?,?,?,?,?,?,?,?)`,
        message.id,
        message.listingId,
        message.senderId,
        message.recipientId,
        message.body,
        input.dealId ?? null,
        message.createdAt,
        null,
      );
      return message;
    },

    getNotifications: (userId) =>
      all(
        "SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC, id DESC",
        userId,
      ).map(toNotification),
    createNotification: (input: NewNotification) => {
      const notification: Notification = {
        id: nextId("notifications", "ntf"),
        userId: input.userId,
        type: input.type,
        payload: input.payload,
        readAt: null,
        createdAt: clock(),
      };
      run(
        "INSERT INTO notifications (id,userId,type,payload,readAt,createdAt) VALUES (?,?,?,?,?,?)",
        notification.id,
        notification.userId,
        notification.type,
        JSON.stringify(notification.payload),
        null,
        notification.createdAt,
      );
      return notification;
    },
    markNotificationRead: (id) => {
      run("UPDATE notifications SET readAt = ? WHERE id = ?", clock(), id);
      const r = one("SELECT * FROM notifications WHERE id = ?", id);
      return r ? toNotification(r) : undefined;
    },

    getWatchlistIds: (userId) =>
      all("SELECT listingId FROM watchlist WHERE userId = ?", userId).map((r) => str(r.listingId)),
    addToWatchlist: (userId, listingId) => {
      run("INSERT OR IGNORE INTO watchlist (userId, listingId) VALUES (?,?)", userId, listingId);
    },
    removeFromWatchlist: (userId, listingId) => {
      run("DELETE FROM watchlist WHERE userId = ? AND listingId = ?", userId, listingId);
    },

    getBrandDeals: () => all("SELECT * FROM brand_deals ORDER BY id").map(toBrandDeal),

    getDeal: (id) => {
      const r = one("SELECT * FROM deals WHERE id = ?", id);
      return r ? toDeal(r) : undefined;
    },
    getDealsForListing: (listingId) =>
      all(`SELECT * FROM deals WHERE listingId = ? ORDER BY createdAt ASC, id ASC`, listingId).map(
        toDeal,
      ),
    getDealsForThread: (listingId, buyerId, sellerId) =>
      all(
        `SELECT * FROM deals WHERE listingId = ? AND buyerId = ? AND sellerId = ?
         ORDER BY createdAt ASC, id ASC`,
        listingId,
        buyerId,
        sellerId,
      ).map(toDeal),
    getDealsForUser: (userId) =>
      all(
        "SELECT * FROM deals WHERE buyerId = ? OR sellerId = ? ORDER BY createdAt DESC, id DESC",
        userId,
        userId,
      ).map(toDeal),
    createDeal: (buyerId, sellerId, proposedBy, input: NewDeal) => {
      const now = clock();
      const row: DealRow = {
        id: nextId("deals", "dl"),
        listingId: input.listingId,
        buyerId,
        sellerId,
        kind: input.kind,
        amountCents: input.amountCents,
        scheduledFor: input.scheduledFor,
        scheduledAt: input.scheduledAt,
        note: input.note,
        proposedBy,
        status: "pending",
        paidAt: null,
        createdAt: now,
        updatedAt: now,
      };
      run(
        `INSERT INTO deals (id,listingId,buyerId,sellerId,kind,amountCents,scheduledFor,scheduledAt,note,proposedBy,status,paidAt,createdAt,updatedAt)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        row.id,
        row.listingId,
        row.buyerId,
        row.sellerId,
        row.kind,
        b(row.amountCents),
        b(row.scheduledFor),
        b(row.scheduledAt),
        row.note,
        row.proposedBy,
        row.status,
        null,
        row.createdAt,
        row.updatedAt,
      );
      return row;
    },
    updateDealStatus: (id, status: DealStatus) => {
      run("UPDATE deals SET status = ?, updatedAt = ? WHERE id = ?", status, clock(), id);
      const r = one("SELECT * FROM deals WHERE id = ?", id);
      return r ? toDeal(r) : undefined;
    },
    markDealPaid: (id) => {
      const now = clock();
      run("UPDATE deals SET paidAt = ?, updatedAt = ? WHERE id = ?", now, now, id);
      const r = one("SELECT * FROM deals WHERE id = ?", id);
      return r ? toDeal(r) : undefined;
    },
  };
}

// CREATE TABLE IF NOT EXISTS won't add a column to a db that already exists,
// so new optional columns get added in place rather than forcing a reset
function migrate(db: DatabaseSync, seed: SeedData): void {
  const columns = (table: string): string[] =>
    (db.prepare(`PRAGMA table_info(${table})`).all() as Row[]).map((c) => str(c.name));

  if (!columns("listings").includes("leaseTerm")) {
    db.exec("ALTER TABLE listings ADD COLUMN leaseTerm TEXT");
    // rows seeded before the column existed still get their seeded value
    const fill = db.prepare("UPDATE listings SET leaseTerm = ? WHERE id = ? AND leaseTerm IS NULL");
    for (const l of seed.listings) if (l.leaseTerm) fill.run(l.leaseTerm, l.id);
  }

  if (!columns("listings").includes("transit")) {
    db.exec("ALTER TABLE listings ADD COLUMN transit TEXT");
    const fill = db.prepare("UPDATE listings SET transit = ? WHERE id = ? AND transit IS NULL");
    for (const l of seed.listings) if (l.transit) fill.run(JSON.stringify(l.transit), l.id);
  }

  if (!columns("listings").includes("inspectionAvailability")) {
    db.exec("ALTER TABLE listings ADD COLUMN inspectionAvailability TEXT");
    const fill = db.prepare(
      "UPDATE listings SET inspectionAvailability = ? WHERE id = ? AND inspectionAvailability IS NULL",
    );
    for (const l of seed.listings) {
      if (l.inspectionAvailability) fill.run(JSON.stringify(l.inspectionAvailability), l.id);
    }
  }

  if (!columns("deals").includes("scheduledAt")) {
    db.exec("ALTER TABLE deals ADD COLUMN scheduledAt TEXT");
  }

  if (!columns("users").includes("passwordHash")) {
    db.exec("ALTER TABLE users ADD COLUMN passwordHash TEXT");
    // accounts that predate passwords get the shared demo one so they can still sign in
    db.prepare("UPDATE users SET passwordHash = ? WHERE passwordHash IS NULL").run(SEED_PASSWORD_HASH);
  }

  if (!columns("users").includes("pinchPayerId")) {
    db.exec("ALTER TABLE users ADD COLUMN pinchPayerId TEXT");
  }

  if (!columns("users").includes("pinchMerchantId")) {
    db.exec("ALTER TABLE users ADD COLUMN pinchMerchantId TEXT");
  }

  if (!columns("messages").includes("dealId")) {
    db.exec("ALTER TABLE messages ADD COLUMN dealId TEXT");
  }
}

// sellers arrive already able to be paid — a render instance rebuilds its db every
// boot, and a seller with no merchant can't take a booking
function seedMerchants(db: DatabaseSync): void {
  const fill = db.prepare("UPDATE users SET pinchMerchantId = ? WHERE id = ? AND pinchMerchantId IS NULL");
  for (const [userId, merchantId] of Object.entries(SEED_MERCHANTS)) fill.run(merchantId, userId);
}

// brand deals are reference data, so they fill in on any db that lacks them
function seedBrandDeals(db: DatabaseSync, seed: SeedData): void {
  const row = db.prepare("SELECT COUNT(*) AS n FROM brand_deals").get() as Row | undefined;
  if (num(row?.n) > 0) return;
  const insert = db.prepare(
    "INSERT INTO brand_deals (id,brand,tagline,category,discount,code,tile,logo,url) VALUES (?,?,?,?,?,?,?,?,?)",
  );
  for (const d of seed.brandDeals) {
    insert.run(d.id, d.brand, d.tagline, d.category, d.discount, d.code, d.tile, d.logo, d.url);
  }
}

// first run only — an existing db is left alone so real data survives restarts
function seedIfEmpty(db: DatabaseSync, seed: SeedData): void {
  const row = db.prepare("SELECT COUNT(*) AS n FROM universities").get() as Row | undefined;
  if (num(row?.n) > 0) return;

  const insertUni = db.prepare(
    "INSERT INTO universities (id,name,emailDomains,city,state,lat,lng) VALUES (?,?,?,?,?,?,?)",
  );
  const insertUser = db.prepare(
    `INSERT INTO users (id,name,email,universityId,role,passwordHash,verified,orgType,location,lat,lng,createdAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
  );
  const insertListing = db.prepare(
    `INSERT INTO listings (id,sellerId,title,description,priceCents,rateUnit,category,condition,location,lat,lng,meetup,imageUrl,images,unlimited,status,bedrooms,bathrooms,bondCents,availableFrom,leaseTerm,furnished,transit,inspectionAvailability,createdAt,updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  );

  db.exec("BEGIN");
  try {
    for (const u of seed.universities) {
      insertUni.run(u.id, u.name, JSON.stringify(u.emailDomains), u.city, u.state, u.lat, u.lng);
    }
    for (const u of seed.users) {
      insertUser.run(
        u.id,
        u.name,
        u.email,
        u.universityId,
        u.role,
        SEED_PASSWORD_HASH,
        u.verified ? 1 : 0,
        b(u.orgType),
        u.location,
        u.lat,
        u.lng,
        u.createdAt,
      );
    }
    for (const l of seed.listings) {
      insertListing.run(
        l.id,
        l.sellerId,
        l.title,
        l.description,
        l.priceCents,
        b(l.rateUnit),
        l.category,
        l.condition,
        l.location,
        l.lat,
        l.lng,
        l.meetup,
        l.imageUrl,
        l.images ? JSON.stringify(l.images) : null,
        bBool(l.unlimited),
        l.status,
        b(l.bedrooms),
        b(l.bathrooms),
        b(l.bondCents),
        b(l.availableFrom),
        b(l.leaseTerm),
        bBool(l.furnished),
        l.transit ? JSON.stringify(l.transit) : null,
        l.inspectionAvailability ? JSON.stringify(l.inspectionAvailability) : null,
        l.createdAt,
        l.updatedAt,
      );
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
