"use client";

import { useActionState } from "react";
import { deleteUser, type ActionState } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
};

const initialState: ActionState = {};

function DeleteButton({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(
    deleteUser,
    initialState
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Naozaj zmazať tohto používateľa? Táto akcia je nevratná.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="user_id" value={userId} />
      <Button variant="ghost" type="submit" disabled={pending} className="text-destructive">
        {pending ? "Mažem…" : "Zmazať"}
      </Button>
      {state.error && <p className="mt-1 text-xs text-destructive">{state.error}</p>}
    </form>
  );
}

export function UserList({ users }: { users: UserRow[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-secondary/50 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Meno</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Rola</th>
            <th className="px-4 py-3 font-medium">Stav</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                Zatiaľ žiadni používatelia.
              </td>
            </tr>
          )}
          {users.map((u) => (
            <tr key={u.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3">{u.full_name}</td>
              <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
              <td className="px-4 py-3 capitalize">{u.role.replace("_", " ")}</td>
              <td className="px-4 py-3">
                <span
                  className={
                    u.is_active
                      ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                      : "rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive"
                  }
                >
                  {u.is_active ? "aktívny" : "neaktívny"}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <DeleteButton userId={u.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
