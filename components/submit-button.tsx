"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";

type SubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pendingLabel?: ReactNode;
};

/**
 * Drop-in replacement for a form's submit button. Must render inside the
 * <form action={serverAction}> it belongs to — useFormStatus reads the
 * nearest parent form's pending state, which is how every mutating form in
 * the app surfaces an in-flight loading state without per-form plumbing.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      type="submit"
      className={className}
      disabled={pending || disabled}
      aria-busy={pending}
    >
      {pending ? (
        <>
          <Loader2 size={16} aria-hidden="true" className="spin" />
          {pendingLabel ?? "Working..."}
        </>
      ) : (
        children
      )}
    </button>
  );
}
