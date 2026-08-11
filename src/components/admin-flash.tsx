"use client";

import { useEffect } from "react";
import { toast, Toaster } from "sonner";

export type AdminFlashMessage = {
  id: string;
  message: string;
  type?: "success" | "warning" | "info";
};

export function AdminFlash({ flash }: { flash?: AdminFlashMessage | null }) {
  useEffect(() => {
    if (!flash) {
      return;
    }

    document.cookie = "admin_flash=; Max-Age=0; path=/";

    if (flash.type === "warning") {
      toast.warning(flash.message, { id: flash.id });
      return;
    }

    if (flash.type === "info") {
      toast.info(flash.message, { id: flash.id });
      return;
    }

    toast.success(flash.message, { id: flash.id });
  }, [flash]);

  return (
    <Toaster
      closeButton
      position="top-right"
      richColors
      toastOptions={{
        className: "border-white/10 bg-card text-foreground",
      }}
    />
  );
}
