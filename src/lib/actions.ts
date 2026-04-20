"use server";

import { db } from "./db";
import { users, onboardingProfiles, subscriptions, collectionItems, swapOrders, favorites, boards, artworks, plans } from "./schema";
import { eq, and } from "drizzle-orm";
import { hashSync } from "bcryptjs";
import { auth } from "./auth";
import crypto from "crypto";

function genId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 25);
}

async function getUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user;
}

export async function signUp(data: { name: string; email: string; password: string }) {
  const [existing] = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
  if (existing) return { error: "Email already in use" };

  const id = genId();
  await db.insert(users).values({
    id,
    name: data.name,
    email: data.email,
    passwordHash: hashSync(data.password, 10),
    createdAt: new Date(),
  });

  return { success: true, userId: id };
}

export async function saveOnboarding(data: {
  styles: string[];
  colors: string[];
  roomType: string;
  wallWidth: number;
  wallHeight: number;
  lighting: string;
  budgetTier: string;
}) {
  const user = await getUser();
  const [existing] = await db.select().from(onboardingProfiles).where(eq(onboardingProfiles.userId, user.id)).limit(1);

  const values = {
    styles: JSON.stringify(data.styles),
    colors: JSON.stringify(data.colors),
    roomType: data.roomType,
    wallWidth: data.wallWidth,
    wallHeight: data.wallHeight,
    lighting: data.lighting,
    budgetTier: data.budgetTier,
  };

  if (existing) {
    await db.update(onboardingProfiles).set(values).where(eq(onboardingProfiles.userId, user.id));
  } else {
    await db.insert(onboardingProfiles).values({ id: genId(), userId: user.id, ...values });
  }

  return { success: true };
}

export async function subscribeToPlan(planId: string) {
  const user = await getUser();
  const [existing] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id)).limit(1);
  if (existing) {
    await db.update(subscriptions)
      .set({ planId, status: "active", startDate: new Date(), nextSwapDate: getNextSwapDate() })
      .where(eq(subscriptions.userId, user.id));
  } else {
    await db.insert(subscriptions).values({
      id: genId(),
      userId: user.id,
      planId,
      status: "active",
      startDate: new Date(),
      nextSwapDate: getNextSwapDate(),
    });
  }
  return { success: true };
}

export async function cancelSubscription() {
  const user = await getUser();
  await db.update(subscriptions).set({ status: "canceled" }).where(eq(subscriptions.userId, user.id));
  return { success: true };
}

export async function addToCollection(artworkId: string) {
  const user = await getUser();

  const [sub] = await db.select().from(subscriptions)
    .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")))
    .limit(1);
  if (!sub) return { error: "No active subscription" };

  const [plan] = await db.select().from(plans).where(eq(plans.id, sub.planId)).limit(1);
  const activeItems = await db.select().from(collectionItems)
    .where(and(eq(collectionItems.userId, user.id), eq(collectionItems.status, "ACTIVE")));

  if (plan && activeItems.length >= plan.piecesAllowed) {
    return { error: `Your plan allows ${plan.piecesAllowed} piece(s). Schedule a swap to change artwork.` };
  }

  const [artwork] = await db.select().from(artworks).where(eq(artworks.id, artworkId)).limit(1);
  if (!artwork || !artwork.available) return { error: "Artwork not available" };

  await db.insert(collectionItems).values({
    id: genId(),
    userId: user.id,
    artworkId,
    status: "ACTIVE",
    startDate: new Date(),
  });

  await db.update(artworks).set({ available: false }).where(eq(artworks.id, artworkId));

  return { success: true };
}

export async function scheduleSwap(data: { scheduledDate: string; scheduledTime: string; deliveryType: string }) {
  const user = await getUser();
  const scheduledAt = new Date(`${data.scheduledDate}T${data.scheduledTime}`);

  const activeItems = await db.select().from(collectionItems)
    .where(and(eq(collectionItems.userId, user.id), eq(collectionItems.status, "ACTIVE")));

  for (const item of activeItems) {
    await db.update(collectionItems)
      .set({ status: "RETURNED", endDate: new Date() })
      .where(eq(collectionItems.id, item.id));
    await db.update(artworks)
      .set({ available: true })
      .where(eq(artworks.id, item.artworkId));
  }

  await db.insert(swapOrders).values({
    id: genId(),
    userId: user.id,
    status: "scheduled",
    scheduledAt,
    deliveryType: data.deliveryType,
    createdAt: new Date(),
  });

  await db.update(subscriptions)
    .set({ nextSwapDate: getNextSwapDate() })
    .where(eq(subscriptions.userId, user.id));

  return { success: true };
}

export async function toggleFavorite(artworkId: string, boardId?: string) {
  const user = await getUser();
  const [existing] = await db.select().from(favorites)
    .where(and(eq(favorites.userId, user.id), eq(favorites.artworkId, artworkId)))
    .limit(1);

  if (existing) {
    await db.delete(favorites).where(eq(favorites.id, existing.id));
    return { favorited: false };
  }

  await db.insert(favorites).values({
    id: genId(),
    userId: user.id,
    artworkId,
    boardId: boardId || null,
  });
  return { favorited: true };
}

export async function createBoard(name: string) {
  const user = await getUser();
  const id = genId();
  await db.insert(boards).values({ id, userId: user.id, name });
  return { success: true, id };
}

export async function moveFavoriteToBoard(favoriteId: string, boardId: string | null) {
  const user = await getUser();
  await db.update(favorites)
    .set({ boardId })
    .where(and(eq(favorites.id, favoriteId), eq(favorites.userId, user.id)));
  return { success: true };
}

export async function updateProfile(data: { name: string }) {
  const user = await getUser();
  await db.update(users).set({ name: data.name }).where(eq(users.id, user.id));
  return { success: true };
}

function getNextSwapDate(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d;
}
