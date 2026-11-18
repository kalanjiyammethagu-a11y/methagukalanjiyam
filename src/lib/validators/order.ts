import { z } from "zod";

/**
 * Strict regex for Indian phone numbers (10 digits)
 */
const PHONE_REGEX = /^[6-9][0-9]{9}$/;

/**
 * Strict regex for Indian Postal Pincode (6 digits, non-zero first digit)
 */
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

/**
 * Strict regex for Razorpay Entity Identifiers
 */
const RAZORPAY_ORDER_ID_REGEX = /^order_[a-zA-Z0-9]{10,30}$/;
const RAZORPAY_PAYMENT_ID_REGEX = /^pay_[a-zA-Z0-9]{10,30}$/;
const RAZORPAY_SIGNATURE_REGEX = /^[a-f0-9]{64}$/;

export const addressSchema = z
  .object({
    full_name: z.string().trim().min(2, "Full name is required").max(100, "Name too long"),
    phone: z.string().trim().regex(PHONE_REGEX, "Enter a valid 10-digit mobile number"),
    house_name: z.string().trim().min(2, "Flat/House/Building details required").max(150, "House details too long"),
    street: z.string().trim().max(150, "Street address too long").optional(),
    landmark: z.string().trim().max(150, "Landmark too long").optional(),
    city: z.string().trim().min(2, "City is required").max(80, "City name too long"),
    state: z.string().trim().min(2, "State is required").max(80, "State name too long"),
    pincode: z.string().trim().regex(PINCODE_REGEX, "Enter a valid 6-digit postal pincode"),
    label: z.string().trim().max(30).default("Home"),
    is_default: z.boolean().default(false),
  })
  .strict();

export const orderItemSchema = z
  .object({
    book_id: z.string().trim().min(1, "Book ID is required").max(60, "Invalid book ID length"),
    quantity: z.number().int().min(1, "Quantity must be at least 1").max(50, "Maximum 50 copies per item"),
    price: z.number().positive().max(100000).optional(),
    title: z.string().trim().max(200).optional(),
    cover_url: z.string().trim().max(500).optional().nullable(),
  })
  .strict();

export const createOrderSchema = z
  .object({
    items: z.array(orderItemSchema).min(1, "Order must contain at least one book").max(50, "Maximum 50 unique items per order"),
    shipping_address: addressSchema,
    customer_notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional(),
    is_guest_checkout: z.boolean().default(false),
    guest_phone: z.string().trim().regex(PHONE_REGEX, "Enter a valid 10-digit mobile number").optional(),
    guest_email: z.string().trim().email("Enter a valid email address").max(150).optional(),
  })
  .strict();

export const verifyPaymentSchema = z
  .object({
    razorpay_order_id: z.string().trim().regex(RAZORPAY_ORDER_ID_REGEX, "Invalid Razorpay order ID format"),
    razorpay_payment_id: z.string().trim().regex(RAZORPAY_PAYMENT_ID_REGEX, "Invalid Razorpay payment ID format"),
    razorpay_signature: z.string().trim().regex(RAZORPAY_SIGNATURE_REGEX, "Invalid Razorpay cryptographic signature format"),
  })
  .strict();

export const setTrackingSchema = z
  .object({
    courier: z.enum(["india_post", "st_courier", "professional_courier"]),
    tracking_number: z.string().trim().min(3, "Tracking / AWB number is required").max(60, "Tracking number too long"),
  })
  .strict();

export type AddressInput = z.infer<typeof addressSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type SetTrackingInput = z.infer<typeof setTrackingSchema>;
