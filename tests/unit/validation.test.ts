import { describe, expect, it } from "vitest";

import {
  PostValidation,
  ProfileValidation,
  SigninValidation,
  SignupValidation,
} from "@/lib/validation";

describe("validation schemas", () => {
  it("accepts a valid signup payload", () => {
    expect(
      SignupValidation.safeParse({
        name: "Alex",
        username: "alex",
        email: "alex@example.com",
        password: "password123",
      }).success
    ).toBe(true);
  });

  it("rejects a weak signup password", () => {
    expect(
      SignupValidation.safeParse({
        name: "Alex",
        username: "alex",
        email: "alex@example.com",
        password: "short",
      }).success
    ).toBe(false);
  });

  it("rejects invalid signin email", () => {
    expect(
      SigninValidation.safeParse({
        email: "not-an-email",
        password: "password123",
      }).success
    ).toBe(false);
  });

  it("accepts a post with caption, file array, location, and tags", () => {
    expect(
      PostValidation.safeParse({
        caption: "A test caption",
        file: [],
        location: "Ahmedabad",
        tags: "test,snapgram",
      }).success
    ).toBe(true);
  });

  it("rejects a short post caption", () => {
    expect(
      PostValidation.safeParse({
        caption: "Hey",
        file: [],
        location: "Ahmedabad",
        tags: "",
      }).success
    ).toBe(false);
  });

  it("rejects a post without location", () => {
    expect(
      PostValidation.safeParse({
        caption: "A test caption",
        file: [],
        location: "",
        tags: "",
      }).success
    ).toBe(false);
  });

  it("accepts an editable profile payload", () => {
    expect(
      ProfileValidation.safeParse({
        file: [],
        name: "Alex",
        username: "alex",
        email: "alex@example.com",
        bio: "Frontend engineer",
      }).success
    ).toBe(true);
  });
});
