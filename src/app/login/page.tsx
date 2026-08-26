import type { Metadata } from "next";
import AuthScreen from "@/components/AuthScreen";

export const metadata: Metadata = {
  title: "Sign In · ThoughtDrop",
  description: "Sign in to ThoughtDrop and start dropping ideas.",
};

export default function LoginPage() {
  return <AuthScreen mode="signin" />;
}
