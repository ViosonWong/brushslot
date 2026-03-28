"use client";

import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "./store";
import { clearSession, setSession } from "./authSlice";
import type {
  AdminArtist,
  AdminBooking,
  AdminLog,
  Artist,
  ArtistBookingView,
  ArtistTimeSlot,
  Booking,
  BookingStatus,
  SlotStatus,
  User,
  WeeklyScheduleTemplate,
} from "@/lib/types";

type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

type CreateArtistInput = {
  phone: string;
  password: string;
  name: string;
  displayName: string;
  bio?: string;
  slotDurationMin?: number;
  advanceDays?: number;
};

type UpdateArtistInput = {
  displayName?: string;
  bio?: string;
  isActive?: boolean;
  slotDurationMin?: number;
  advanceDays?: number;
};

const baseUrl = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api`;

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, api) => {
    const state = api.getState() as RootState;
    if (state.auth.accessToken) {
      headers.set("authorization", `Bearer ${state.auth.accessToken}`);
    }
    headers.set("content-type", "application/json");
    return headers;
  },
});

const baseQueryWithReauth: typeof rawBaseQuery = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  // If access token expired, try refresh once.
  if (result.error && (result.error as FetchBaseQueryError).status === 401) {
    const state = api.getState() as RootState;
    const refreshToken = state.auth.refreshToken;
    if (!refreshToken) {
      api.dispatch(clearSession());
      return result;
    }

    const refreshResult = await rawBaseQuery(
      {
        url: "/auth/refresh",
        method: "POST",
        body: { refreshToken },
      },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      const data = refreshResult.data as AuthResponse;
      api.dispatch(setSession(data));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearSession());
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Me",
    "Artists",
    "ArtistSlots",
    "Bookings",
    "ArtistSchedule",
    "AdminArtists",
    "AdminTemplates",
    "AdminSlots",
    "AdminBookings",
    "AdminLogs",
  ],
  endpoints: (build) => ({
    register: build.mutation<AuthResponse, { phone: string; password: string; name: string }>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      invalidatesTags: ["Me"],
    }),
    login: build.mutation<AuthResponse, { phone: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      invalidatesTags: ["Me"],
    }),
    logout: build.mutation<{ ok: true }, { refreshToken: string }>({
      query: (body) => ({ url: "/auth/logout", method: "POST", body }),
      invalidatesTags: ["Me"],
    }),
    me: build.query<User, void>({
      query: () => ({ url: "/auth/me" }),
      providesTags: ["Me"],
    }),

    artists: build.query<Artist[], void>({
      query: () => ({ url: "/artists" }),
      providesTags: ["Artists"],
    }),
    artist: build.query<Artist, string>({
      query: (artistId) => ({ url: `/artists/${artistId}` }),
      providesTags: (_r, _e, id) => [{ type: "Artists", id }],
    }),
    artistSlots: build.query<ArtistTimeSlot[], { artistId: string; from?: string; to?: string }>({
      query: ({ artistId, from, to }) => ({
        url: `/artists/${artistId}/slots`,
        params: { from, to },
      }),
      providesTags: (_r, _e, arg) => [{ type: "ArtistSlots", id: arg.artistId }],
    }),

    createBooking: build.mutation<
      {
        id: string;
        status: BookingStatus;
        contactName: string;
        contactPhone?: string | null;
        requestNote?: string | null;
        createdAt: string;
        slot: { id: string; startAt: string; endAt: string };
        artist: { id: string; displayName: string };
      },
      { slotId: string; contactName: string; contactPhone?: string; requestNote?: string }
    >({
      query: (body) => ({ url: "/bookings", method: "POST", body }),
      invalidatesTags: ["Bookings", "ArtistSlots", "ArtistSchedule", "AdminBookings"],
    }),
    myBookings: build.query<Booking[], void>({
      query: () => ({ url: "/bookings/me" }),
      providesTags: ["Bookings"],
    }),
    cancelBooking: build.mutation<{ ok: true }, { bookingId: string }>({
      query: ({ bookingId }) => ({ url: `/bookings/${bookingId}/cancel`, method: "PATCH" }),
      invalidatesTags: ["Bookings", "ArtistSchedule", "AdminBookings"],
    }),

    artistSchedule: build.query<ArtistTimeSlot[], { from?: string; to?: string }>({
      query: ({ from, to }) => ({ url: "/artist/me/schedule", params: { from, to } }),
      providesTags: ["ArtistSchedule"],
    }),
    artistBookings: build.query<ArtistBookingView[], { status?: BookingStatus }>({
      query: ({ status }) => ({ url: "/artist/me/bookings", params: { status } }),
      providesTags: ["ArtistSchedule"],
    }),

    adminArtists: build.query<AdminArtist[], void>({
      query: () => ({ url: "/admin/artists" }),
      providesTags: ["AdminArtists"],
    }),
    adminCreateArtist: build.mutation<AdminArtist, CreateArtistInput>({
      query: (body) => ({ url: "/admin/artists", method: "POST", body }),
      invalidatesTags: ["AdminArtists", "Artists"],
    }),
    adminUpdateArtist: build.mutation<AdminArtist, { artistId: string; body: UpdateArtistInput }>({
      query: ({ artistId, body }) => ({ url: `/admin/artists/${artistId}`, method: "PATCH", body }),
      invalidatesTags: ["AdminArtists", "Artists"],
    }),

    adminGetTemplates: build.query<WeeklyScheduleTemplate[], { artistId: string }>({
      query: ({ artistId }) => ({ url: `/admin/artists/${artistId}/schedule-templates` }),
      providesTags: (_r, _e, arg) => [{ type: "AdminTemplates", id: arg.artistId }],
    }),
    adminUpsertTemplates: build.mutation<
      { ok: true },
      { artistId: string; templates: WeeklyScheduleTemplate[] }
    >({
      query: ({ artistId, templates }) => ({
        url: `/admin/artists/${artistId}/schedule-templates`,
        method: "PUT",
        body: { templates },
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: "AdminTemplates", id: arg.artistId }],
    }),
    adminGenerateSlots: build.mutation<{ created: number }, { artistId: string; from?: string; to?: string }>({
      query: ({ artistId, from, to }) => ({
        url: `/admin/artists/${artistId}/slots/generate`,
        method: "POST",
        body: { from, to },
      }),
      invalidatesTags: (_r, _e, arg) => [
        { type: "AdminSlots", id: arg.artistId },
        { type: "ArtistSlots", id: arg.artistId },
      ],
    }),
    adminSlots: build.query<ArtistTimeSlot[], { artistId: string; from?: string; to?: string }>({
      query: ({ artistId, from, to }) => ({ url: `/admin/artists/${artistId}/slots`, params: { from, to } }),
      providesTags: (_r, _e, arg) => [{ type: "AdminSlots", id: arg.artistId }],
    }),
    adminPatchSlot: build.mutation<
      {
        id: string;
        artistId: string;
        startAt: string;
        endAt: string;
        status: SlotStatus;
        note?: string | null;
      },
      { slotId: string; status: Exclude<SlotStatus, "BOOKED">; note?: string; artistId?: string }
    >({
      query: ({ slotId, status, note }) => ({ url: `/admin/slots/${slotId}`, method: "PATCH", body: { status, note } }),
      invalidatesTags: (_r, _e, arg) =>
        arg.artistId
          ? [
              { type: "AdminSlots", id: arg.artistId },
              { type: "ArtistSlots", id: arg.artistId },
              "ArtistSchedule",
            ]
          : ["AdminSlots", "ArtistSchedule"],
    }),
    adminSetAttendance: build.mutation<
      {
        id: string;
        artistId: string;
        workDate: string;
        status: "NORMAL" | "LEAVE" | "ABSENT" | "PAUSED";
        note?: string | null;
      },
      {
        artistId: string;
        workDate: string;
        status: "NORMAL" | "LEAVE" | "ABSENT" | "PAUSED";
        note?: string;
      }
    >({
      query: (body) => ({ url: "/admin/attendance", method: "POST", body }),
      invalidatesTags: ["AdminSlots", "ArtistSchedule"],
    }),

    adminBookings: build.query<AdminBooking[], { status?: BookingStatus }>({
      query: ({ status }) => ({ url: "/admin/bookings", params: { status } }),
      providesTags: ["AdminBookings"],
    }),
    adminUpdateBookingStatus: build.mutation<
      { ok: true },
      { bookingId: string; status: BookingStatus; adminNote?: string }
    >({
      query: ({ bookingId, ...body }) => ({
        url: `/admin/bookings/${bookingId}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["AdminBookings", "Bookings", "ArtistSchedule"],
    }),

    adminLogs: build.query<AdminLog[], { targetType?: string }>({
      query: ({ targetType }) => ({ url: "/admin/logs", params: { targetType } }),
      providesTags: ["AdminLogs"],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
  useArtistsQuery,
  useArtistQuery,
  useArtistSlotsQuery,
  useCreateBookingMutation,
  useMyBookingsQuery,
  useCancelBookingMutation,
  useArtistScheduleQuery,
  useAdminArtistsQuery,
  useAdminCreateArtistMutation,
  useAdminUpdateArtistMutation,
  useAdminGetTemplatesQuery,
  useAdminUpsertTemplatesMutation,
  useAdminGenerateSlotsMutation,
  useAdminSlotsQuery,
  useAdminPatchSlotMutation,
  useAdminSetAttendanceMutation,
  useAdminBookingsQuery,
  useAdminUpdateBookingStatusMutation,
  useAdminLogsQuery,
} = api;
