import { auth } from "@/auth";
import { getTripBySlug, type SavedTrip } from "./queries";

export type TripAccess = {
  trip: SavedTrip;
  userId: string | null;
  /** True when the viewer may change progress or add memories. */
  canEdit: boolean;
};

/**
 * A trip with no owner stays editable by anyone holding the link, which keeps
 * trips planned before signing in usable. An owned trip is editable only by its owner.
 */
export async function tripAccess(slug: string): Promise<TripAccess | null> {
  const trip = await getTripBySlug(slug);
  if (!trip) return null;

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const canEdit = trip.userId === null || trip.userId === userId;

  return { trip, userId, canEdit };
}
