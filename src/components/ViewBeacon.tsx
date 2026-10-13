"use client";

import { useEffect } from "react";
import { recordView } from "@/lib/clientView";

/** Fires a single view on mount for a promoted prompt page. */
export default function ViewBeacon({ promptId }: { promptId: string }) {
  useEffect(() => {
    recordView(promptId);
  }, [promptId]);
  return null;
}
