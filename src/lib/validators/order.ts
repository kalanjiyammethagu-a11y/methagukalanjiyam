import { z } from "zod";

export const addressSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  phone: z.string().regex(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number"),
  house_name: z.string().min(2, "Flat/House/Building details required"),
  street: z.string().optional(),
  landmark: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^[0-9]{6}$/, "Enter a valid 6-digit postal pincode"),
  label: z.string().default("Home"),
  is_default: z.boolean().default(false),
});

export const orderItemSchema = z.object({
  book_id: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  title: z.string(),
  cover_url: z.string().optional().nullable(),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Order must contain at least one book"),
  shipping_address: addressSchema,
  customer_notes: z.string().optional(),
  is_guest_checkout: z.boolean().default(false),
  guest_phone: z.string().optional(),
  guest_email: z.string().email().optional(),
});

export const setTrackingSchema = z.object({
  courier: z.enum(["india_post", "st_courier", "professional_courier"]),
  tracking_number: z.string().min(3, "Tracking / AWB number is required"),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type SetTrackingInput = z.infer<typeof setTrackingSchema>;
