"use client";

import { useActionState } from "react";
import { createGrade, type ActionState } from "@/actions/grades";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const initialState: ActionState = {};

export function CreateGradeForm({
  students,
  subjects,
  semesters,
}: {
  students: { id: string; full_name: string }[];
  subjects: { id: string; name: string }[];
  semesters: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createGrade, initialState);

  return (
    <Card className="p-5">
      <h2 className="mb-4 font-semibold">Zapísať známku</h2>
      <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-3" key={state.success}>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Žiak</label>
          <select
            name="student_id"
            required
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">— vyber —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Predmet</label>
          <select
            name="subject_id"
            required
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">— vyber —</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Semester</label>
          <select
            name="semester_id"
            required
            className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">— vyber —</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Známka (1–5)</label>
          <Input name="value" type="number" min={1} max={5} step={1} required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Váha</label>
          <Input name="weight" type="number" min={1} max={5} step={1} defaultValue={1} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Komentár</label>
          <Input name="comment" placeholder="voliteľné" />
        </div>

        <div className="sm:col-span-3">
          {state.error && <p className="mb-2 text-sm text-destructive">{state.error}</p>}
          {state.success && <p className="mb-2 text-sm text-primary">{state.success}</p>}
          <Button type="submit" disabled={pending}>
            {pending ? "Zapisujem…" : "Zapísať známku"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
