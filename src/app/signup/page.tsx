import type { Metadata } from "next";
import AuthScreen from "@/components/AuthScreen";

export const metadata: Metadata = {
  title: "Create Account · ThoughtDrop",
  description: "Create a ThoughtDrop account and join the collaboration network.",
};

export default function SignupPage() {
  return <AuthScreen mode="signup" />;
}
