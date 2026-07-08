import type { PresentedGeneration } from "@/lib/present";

export type GenerateResponse =
  | { status: "ok"; result: PresentedGeneration }
  | { status: "blocked"; result: PresentedGeneration | null; message: string }
  | { status: "gate"; requiresEmail: boolean; message: string }
  | { status: "error"; message: string };

export type { PresentedGeneration };
