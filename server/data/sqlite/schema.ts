// money is always INTEGER cents; booleans are 0/1; optional values are NULL
// ids stay TEXT ("l1", "usr2", "dl3") so seed ids remain stable and readable
export const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS universities (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  emailDomains  TEXT NOT NULL,
  city          TEXT NOT NULL,
  state         TEXT NOT NULL,
  lat           REAL NOT NULL,
  lng           REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  universityId  TEXT NOT NULL REFERENCES universities(id),
  role          TEXT NOT NULL,
  passwordHash  TEXT,
  pinchPayerId  TEXT,
  pinchMerchantId TEXT,
  verified      INTEGER NOT NULL DEFAULT 0,
  orgType       TEXT,
  location      TEXT NOT NULL,
  lat           REAL NOT NULL,
  lng           REAL NOT NULL,
  createdAt     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- a pinch payer belongs to one merchant, so the same student has a separate payer
-- record under every seller they buy from. merchantId is '' for our own account
CREATE TABLE IF NOT EXISTS pinch_payers (
  userId      TEXT NOT NULL REFERENCES users(id),
  merchantId  TEXT NOT NULL,
  payerId     TEXT NOT NULL,
  PRIMARY KEY (userId, merchantId)
);

CREATE TABLE IF NOT EXISTS brand_deals (
  id        TEXT PRIMARY KEY,
  brand     TEXT NOT NULL,
  tagline   TEXT NOT NULL DEFAULT '',
  category  TEXT NOT NULL DEFAULT '',
  discount  TEXT NOT NULL DEFAULT '',
  code      TEXT NOT NULL,
  tile      TEXT NOT NULL DEFAULT '',
  logo      TEXT NOT NULL DEFAULT 'circle',
  url       TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS listings (
  id            TEXT PRIMARY KEY,
  sellerId      TEXT NOT NULL REFERENCES users(id),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  priceCents    INTEGER NOT NULL,
  rateUnit      TEXT,
  category      TEXT NOT NULL,
  condition     TEXT NOT NULL DEFAULT '',
  location      TEXT NOT NULL DEFAULT '',
  lat           REAL NOT NULL DEFAULT 0,
  lng           REAL NOT NULL DEFAULT 0,
  meetup        TEXT NOT NULL DEFAULT '',
  imageUrl      TEXT NOT NULL DEFAULT '',
  images        TEXT,
  unlimited     INTEGER,
  status        TEXT NOT NULL DEFAULT 'active',
  bedrooms      INTEGER,
  bathrooms     INTEGER,
  bondCents     INTEGER,
  availableFrom TEXT,
  leaseTerm     TEXT,
  furnished     INTEGER,
  transit       TEXT,
  inspectionAvailability TEXT,
  createdAt     TEXT NOT NULL,
  updatedAt     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(sellerId);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);

CREATE TABLE IF NOT EXISTS bookings (
  id               TEXT PRIMARY KEY,
  listingId        TEXT NOT NULL REFERENCES listings(id),
  buyerId          TEXT NOT NULL REFERENCES users(id),
  sellerId         TEXT NOT NULL REFERENCES users(id),
  pinchPaymentId   TEXT NOT NULL,
  amountCents      INTEGER NOT NULL,
  status           TEXT NOT NULL,
  buyerConfirmedAt TEXT,
  sellerConfirmedAt TEXT,
  createdAt        TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bookings_buyer ON bookings(buyerId);

CREATE TABLE IF NOT EXISTS messages (
  id           TEXT PRIMARY KEY,
  listingId    TEXT NOT NULL,
  senderId     TEXT NOT NULL REFERENCES users(id),
  recipientId  TEXT NOT NULL REFERENCES users(id),
  body         TEXT NOT NULL,
  dealId       TEXT,
  createdAt    TEXT NOT NULL,
  readAt       TEXT
);
CREATE INDEX IF NOT EXISTS idx_messages_listing ON messages(listingId);
CREATE INDEX IF NOT EXISTS idx_messages_parties ON messages(senderId, recipientId);

CREATE TABLE IF NOT EXISTS notifications (
  id        TEXT PRIMARY KEY,
  userId    TEXT NOT NULL REFERENCES users(id),
  type      TEXT NOT NULL,
  payload   TEXT NOT NULL,
  readAt    TEXT,
  createdAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId);

CREATE TABLE IF NOT EXISTS watchlist (
  userId    TEXT NOT NULL REFERENCES users(id),
  listingId TEXT NOT NULL REFERENCES listings(id),
  PRIMARY KEY (userId, listingId)
);

CREATE TABLE IF NOT EXISTS deals (
  id           TEXT PRIMARY KEY,
  listingId    TEXT NOT NULL REFERENCES listings(id),
  buyerId      TEXT NOT NULL REFERENCES users(id),
  sellerId     TEXT NOT NULL REFERENCES users(id),
  kind         TEXT NOT NULL,
  amountCents  INTEGER,
  scheduledFor TEXT,
  scheduledAt  TEXT,
  note         TEXT NOT NULL DEFAULT '',
  proposedBy   TEXT NOT NULL REFERENCES users(id),
  status       TEXT NOT NULL,
  paidAt       TEXT,
  createdAt    TEXT NOT NULL,
  updatedAt    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_deals_thread ON deals(listingId, buyerId, sellerId);
`;
