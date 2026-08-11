"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type ConfirmSubmitButtonProps = React.ComponentProps<typeof Button> & {
  message: string;
  title?: string;
};

export function ConfirmSubmitButton({
  message,
  onClick,
  title = "Confirm Action",
  ...props
}: ConfirmSubmitButtonProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<HTMLFormElement | null>(null);

  return (
    <>
      <Button
        {...props}
        onClick={(event) => {
          onClick?.(event);

          if (event.defaultPrevented) {
            return;
          }

          event.preventDefault();
          setForm(event.currentTarget.form);
          setOpen(true);
        }}
      />

      {open ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 backdrop-blur-sm"
          role="dialog"
        >
          <div className="w-full max-w-sm overflow-hidden rounded-lg border border-white/10 bg-card text-card-foreground shadow-2xl shadow-black/50">
            <div className="border-b border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-md border border-destructive/25 bg-destructive/15 text-destructive">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <h2 className="font-black">{title}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Action ini akan langsung diproses.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <p className="text-sm text-muted-foreground">{message}</p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <Button
                  className="w-full"
                  onClick={() => setOpen(false)}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  className="w-full"
                  onClick={() => {
                    setOpen(false);
                    window.setTimeout(() => form?.requestSubmit(), 0);
                  }}
                  type="button"
                  variant="destructive"
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
