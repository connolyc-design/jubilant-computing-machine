"use client";

import { useState, useTransition } from "react";
import { setPaidAction } from "../actions";

export default function PaidToggle({
  memberId,
  initialPaid,
  paidLabel,
  unpaidLabel,
}: {
  memberId: string;
  initialPaid: boolean;
  paidLabel: string;
  unpaidLabel: string;
}) {
  const [paid, setPaid] = useState(initialPaid);
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (pending) return;
    const next = !paid;
    setPaid(next);
    startTransition(async () => {
      const res = await setPaidAction(memberId, next);
      if (!res.ok) setPaid(!next);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={paid}
      className={
        paid
          ? "rounded-full bg-pitch px-3 py-1 text-xs font-semibold text-white"
          : "rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-500"
      }
    >
      {paid ? paidLabel : unpaidLabel}
    </button>
  );
}
