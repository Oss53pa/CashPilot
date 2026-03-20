import { z } from "zod";

/**
 * Email address schema.
 */
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address");

/**
 * Password schema — minimum 8 characters, must include uppercase, lowercase,
 * and at least one digit.
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

/**
 * Positive monetary amount schema.
 */
export const amountSchema = z
  .number({ required_error: "Amount is required", invalid_type_error: "Amount must be a number" })
  .positive("Amount must be greater than zero");

/**
 * Date range schema with start and optional end date.
 * Validates that end date is not before start date when both are provided.
 */
export const dateRangeSchema = z
  .object({
    startDate: z.coerce.date({ required_error: "Start date is required" }),
    endDate: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: "End date must be on or after the start date",
      path: ["endDate"],
    },
  );

/**
 * Phone number schema — accepts common international formats.
 * Examples: +1234567890, (123) 456-7890, 123-456-7890
 */
export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(
    /^\+?[\d\s\-().]{7,20}$/,
    "Invalid phone number format",
  );
