"use server";

import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { db } from "@/database/drizzle";
import { hash } from "bcryptjs";
import { signIn } from "@/auth";
import { headers } from "next/headers";
import ratelimit from "@/lib/ratelimit";
import { redirect } from "next/navigation";
import { workflowClient } from "@/lib/workflow";
import config from "@/config";

type AuthResult = {
  success: boolean;
  error?: string;
  redirect?: string;
};

export const signInWithCredentials = async (
  params: Pick<AuthCredentials, "email" | "password">,
) => {
  const { email, password } = params;

  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return { success: false, redirect: "/too-fast" };
  }

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      // throw new Error(result.error);
      return { success: false, error: result?.error };
    }

    return { success: true };
  } catch (error) {
    console.log(error, "Sign In error");
    // throw new Error("Sign In error");
    return { success: false, error: "Sign In error" };
  }
};

export const signUp = async (params: AuthCredentials): Promise<AuthResult> => {
  //     sign up functionality
  const { fullName, email, universityId, password, universityCard } = params;

  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return { success: false, redirect: "/too-fast" };
  }

  // check if the user already exists.

  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    return { success: false, error: "User already exist" };
  }

  const hashedPassword = await hash(password, 10);

  try {
    await db.insert(users).values({
      fullName,
      email,
      universityId,
      universityCard,
      password: hashedPassword,
    });

    await workflowClient.trigger({
      url: `${config.env.prodApiEndpoint}/api/workflows/onboarding`,
      body: {
        email,
        fullName,
      },
    });

    await signInWithCredentials({ email, password });

    return { success: true };
  } catch (error) {
    console.log(error, "Signup error");
    return { success: false, error: "Signup error" };
  }
};
