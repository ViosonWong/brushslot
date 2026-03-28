export type UserRole = "CUSTOMER" | "ARTIST" | "ADMIN";

export type User = {
  id: string;
  phone: string;
  role: UserRole;
  name: string;
};

export type Artist = {
  id: string;
  displayName: string;
  bio?: string | null;
  slotDurationMin: number;
  advanceDays: number;
};

export type SlotStatus = "AVAILABLE" | "BOOKED" | "BLOCKED" | "OFF";

export type ArtistTimeSlot = {
  id: string;
  startAt: string;
  endAt: string;
  status: SlotStatus;
  note?: string | null;
  booking?: {
    id: string;
    status: BookingStatus;
    contactName: string;
    contactPhone?: string | null;
    requestNote?: string | null;
    createdAt: string;
  } | null;
};

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export type Booking = {
  id: string;
  status: BookingStatus;
  contactName: string;
  contactPhone?: string | null;
  requestNote?: string | null;
  adminNote?: string | null;
  cancelledAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  artist: { id: string; displayName: string };
  slot: { id: string | null; startAt: string; endAt: string; status?: SlotStatus | null };
};

export type ArtistBookingView = {
  id: string;
  status: BookingStatus;
  contactName: string;
  contactPhone?: string | null;
  requestNote?: string | null;
  adminNote?: string | null;
  cancelledAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  slot: { id: string | null; startAt: string; endAt: string };
};

export type WeeklyScheduleTemplate = {
  id?: string;
  weekday: number;
  startTime: string;
  endTime: string;
  isEnabled: boolean;
};

export type AdminArtist = {
  id: string;
  displayName: string;
  bio?: string | null;
  isActive: boolean;
  slotDurationMin: number;
  advanceDays: number;
  createdAt: string;
  user: {
    id: string;
    phone: string;
    name: string;
    isActive: boolean;
  };
};

export type AdminBooking = {
  id: string;
  status: BookingStatus;
  contactName: string;
  contactPhone?: string | null;
  requestNote?: string | null;
  adminNote?: string | null;
  cancelledAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  customer: { id: string; phone: string; name: string };
  artist: { id: string; displayName: string };
  slot: { id: string | null; startAt: string; endAt: string };
};

export type AdminLog = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  payload?: unknown;
  createdAt: string;
  adminUser: { id: string; phone: string; name: string };
};
