"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAYPAL_API = process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";
  const secret   = process.env.PAYPAL_CLIENT_SECRET ?? "";
  if (!clientId || !secret) throw new Error("PayPal credentials not configured");

  const b64 = Buffer.from(clientId + ":" + secret).toString("base64");
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/x-www-form-urlencoded",
      Authorization:   `Basic ${b64}`,
    },
    body:  "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

// ── Step 1: create PayPal order server-side (never trust client price) ─────────
export async function createPaypalOrder(
  variantId: string,
  quantity: number,
): Promise<{ orderId?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "not_logged_in" };

  const qty = Math.max(1, Math.min(10, Math.floor(quantity)));

  const variant = await prisma.productVariant.findUnique({
    where:   { id: variantId },
    include: { product: { select: { basePrice: true, name: true } } },
  });
  if (!variant) return { error: "product_not_found" };

  const unit     = Number(variant.product.basePrice) + Number(variant.priceDelta);
  const subtotal = Math.round(unit * qty * 100) / 100;
  const tax      = Math.round(subtotal * 0.08 * 100) / 100;
  const total    = Math.round((subtotal + tax) * 100) / 100;

  try {
    const token = await getAccessToken();
    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        intent:         "CAPTURE",
        purchase_units: [{
          amount: {
            currency_code: "USD",
            value:         total.toFixed(2),
            breakdown: {
              item_total: { currency_code: "USD", value: subtotal.toFixed(2) },
              tax_total:  { currency_code: "USD", value: tax.toFixed(2) },
              shipping:   { currency_code: "USD", value: "0.00" },
            },
          },
          items: [{
            name:        variant.product.name,
            unit_amount: { currency_code: "USD", value: unit.toFixed(2) },
            quantity:    String(qty),
            category:    "PHYSICAL_GOODS",
          }],
        }],
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error("PayPal createOrder error:", txt);
      return { error: "paypal_error" };
    }
    const data = await res.json() as { id: string };
    return { orderId: data.id };
  } catch (e) {
    console.error("createPaypalOrder threw:", e);
    return { error: "server_error" };
  }
}

// ── Cart checkout: create PayPal order from the user's live server-side cart ─────
export async function createPaypalOrderForCart(): Promise<{ orderId?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "not_logged_in" };

  const cart = await prisma.cart.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          variant: { include: { product: { select: { basePrice: true, name: true } } } },
        },
      },
    },
  });
  if (!cart?.items.length) return { error: "cart_empty" };

  const lines = cart.items.map((item) => {
    // Round unit to cents first to avoid floating-point drift in PayPal amount strings
    const unit  = Math.round((Number(item.variant.product.basePrice) + Number(item.variant.priceDelta)) * 100) / 100;
    const qty   = Math.max(1, Math.min(10, item.quantity));
    const lineTotal = Math.round(unit * qty * 100) / 100;
    return { name: item.variant.product.name, unit, qty, lineTotal };
  });

  const subtotal = Math.round(lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
  const tax      = Math.round(subtotal * 0.08 * 100) / 100;
  const total    = Math.round((subtotal + tax) * 100) / 100;

  try {
    const token = await getAccessToken();
    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        intent:         "CAPTURE",
        purchase_units: [{
          amount: {
            currency_code: "USD",
            value: total.toFixed(2),
            breakdown: {
              item_total: { currency_code: "USD", value: subtotal.toFixed(2) },
              tax_total:  { currency_code: "USD", value: tax.toFixed(2) },
              shipping:   { currency_code: "USD", value: "0.00" },
            },
          },
          items: lines.map((l) => ({
            name:        l.name,
            unit_amount: { currency_code: "USD", value: l.unit.toFixed(2) },
            quantity:    String(l.qty),
            category:    "PHYSICAL_GOODS",
          })),
        }],
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error("PayPal createOrder (cart) error:", txt);
      return { error: "paypal_error" };
    }
    const data = await res.json() as { id: string };
    return { orderId: data.id };
  } catch (e) {
    console.error("createPaypalOrderForCart threw:", e);
    return { error: "server_error" };
  }
}

// ── Cart checkout: capture + record multi-item order, then clear the cart ────────
export async function capturePaypalOrderForCart(
  paypalOrderId: string,
): Promise<{ orderId?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "not_logged_in" };
  const userId = session.user.id;

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          variant: { include: { product: { select: { basePrice: true } } } },
        },
      },
    },
  });
  if (!cart?.items.length) return { error: "cart_empty" };

  const lines = cart.items.map((item) => {
    const unit = Math.round((Number(item.variant.product.basePrice) + Number(item.variant.priceDelta)) * 100) / 100;
    const qty  = Math.max(1, Math.min(10, item.quantity));
    return { variantId: item.variant.id, unit, qty };
  });

  const subtotal = Math.round(lines.reduce((s, l) => s + l.unit * l.qty, 0) * 100) / 100;
  const tax      = Math.round(subtotal * 0.08 * 100) / 100;
  const total    = Math.round((subtotal + tax) * 100) / 100;

  try {
    const token = await getAccessToken();
    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      cache:   "no-store",
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error("PayPal capture (cart) error:", txt);
      return { error: "capture_failed" };
    }
    const captured = await res.json() as { status: string };
    if (captured.status !== "COMPLETED") return { error: "capture_incomplete" };

    // Create Order + OrderItems + clear cart — all in one transaction
    const order = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          userId,
          status:        "PAID",
          total,
          paypalOrderId,
          items: {
            create: lines.map((l) => ({ variantId: l.variantId, quantity: l.qty, unitPrice: l.unit })),
          },
        },
      });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return o;
    });

    // Loyalty: 1 point per $1 of total, rounded down
    const points = Math.floor(total);
    if (points > 0) {
      await prisma.$transaction([
        prisma.loyaltyTransaction.create({
          data: { userId, orderId: order.id, pointsDelta: points, reason: "PURCHASE" },
        }),
        prisma.loyaltyAccount.upsert({
          where:  { userId },
          update: { pointsBalance: { increment: points } },
          create: { userId, pointsBalance: points },
        }),
      ]);
    }

    return { orderId: order.id };
  } catch (e) {
    console.error("capturePaypalOrderForCart threw:", e);
    return { error: "server_error" };
  }
}

// ── Step 2: capture + record the order only after PayPal confirms payment ───────
export async function capturePaypalOrder(
  paypalOrderId: string,
  variantId:     string,
  quantity:      number,
): Promise<{ orderId?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "not_logged_in" };
  const userId = session.user.id;

  const qty = Math.max(1, Math.min(10, Math.floor(quantity)));

  const variant = await prisma.productVariant.findUnique({
    where:   { id: variantId },
    include: { product: { select: { basePrice: true } } },
  });
  if (!variant) return { error: "product_not_found" };

  const unit     = Number(variant.product.basePrice) + Number(variant.priceDelta);
  const subtotal = Math.round(unit * qty * 100) / 100;
  const tax      = Math.round(subtotal * 0.08 * 100) / 100;
  const total    = Math.round((subtotal + tax) * 100) / 100;

  try {
    const token = await getAccessToken();
    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      cache:   "no-store",
    });
    if (!res.ok) {
      const txt = await res.text();
      console.error("PayPal capture error:", txt);
      return { error: "capture_failed" };
    }
    const captured = await res.json() as { status: string };
    if (captured.status !== "COMPLETED") return { error: "capture_incomplete" };

    // Only create the Order record after payment is actually confirmed
    const order = await prisma.order.create({
      data: {
        userId,
        status:        "PAID",
        total,
        paypalOrderId,
        items: {
          create: [{ variantId, quantity: qty, unitPrice: unit }],
        },
      },
    });

    // Loyalty: 1 point per $1 of total, rounded down
    const points = Math.floor(total);
    if (points > 0) {
      await prisma.$transaction([
        prisma.loyaltyTransaction.create({
          data: { userId, orderId: order.id, pointsDelta: points, reason: "PURCHASE" },
        }),
        prisma.loyaltyAccount.upsert({
          where:  { userId },
          update: { pointsBalance: { increment: points } },
          create: { userId, pointsBalance: points },
        }),
      ]);
    }

    return { orderId: order.id };
  } catch (e) {
    console.error("capturePaypalOrder threw:", e);
    return { error: "server_error" };
  }
}
