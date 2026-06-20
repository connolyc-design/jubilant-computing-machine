import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSession, hasAdminUnlock } from "@/lib/auth";
import { getMembers } from "@/lib/data";
import PaidToggle from "./PaidToggle";

export default async function AdminMembersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!(await hasAdminUnlock())) redirect("/admin");

  const t = await getTranslations("admin");
  const tPot = await getTranslations("pot");
  const members = await getMembers();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold text-pitch">{t("members")}</h1>
      <p className="mb-4 text-xs text-neutral-500">{t("membersHint")}</p>
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 last:border-0"
          >
            <div>
              <div className="text-sm font-semibold">
                {m.name}
                {m.is_admin && (
                  <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                    admin
                  </span>
                )}
              </div>
              {m.email && <div className="text-xs text-neutral-400">{m.email}</div>}
            </div>
            <PaidToggle
              memberId={m.id}
              initialPaid={m.paid}
              paidLabel={tPot("paid")}
              unpaidLabel={tPot("unpaid")}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
