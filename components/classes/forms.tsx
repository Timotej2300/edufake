"use client";

import { useActionState } from "react";
import {
  createSchoolYear,
  createClass,
  createSubject,
  assignTeacherSubject,
  type ActionState,
} from "@/actions/classes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const initialState: ActionState = {};

function FormMessage({ state }: { state: ActionState }) {
  if (state.error) return <p className="mt-2 text-sm text-destructive">{state.error}</p>;
  if (state.success) return <p className="mt-2 text-sm text-primary">{state.success}</p>;
  return null;
}

export function SchoolYearForm() {
  const [state, formAction, pending] = useActionState(createSchoolYear, initialState);
  return (
    <Card className="p-5">
      <h2 className="mb-4 font-semibold">Nový školský rok</h2>
      <form action={formAction} className="flex flex-wrap items-end gap-3" key={state.success}>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Označenie</label>
          <Input name="label" required placeholder="2026/2027" className="w-40" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Začiatok</label>
          <Input name="start_date" type="date" required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Koniec</label>
          <Input name="end_date" type="date" required />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Vytváram…" : "Vytvoriť"}
        </Button>
      </form>
      <FormMessage state={state} />
    </Card>
  );
}

export function ClassForm({
  schoolYears,
  teachers,
}: {
  schoolYears: { id: string; label: string }[];
  teachers: { id: string; full_name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createClass, initialState);
  return (
    <Card className="p-5">
      <h2 className="mb-4 font-semibold">Nová trieda</h2>
      <form action={formAction} className="flex flex-wrap items-end gap-3" key={state.success}>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Názov</label>
          <Input name="name" required placeholder="3.A" className="w-28" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Školský rok</label>
          <select
            name="school_year_id"
            required
            className="min-w-40 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">— vyber —</option>
            {schoolYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Triedny učiteľ</label>
          <select
            name="class_teacher_id"
            className="min-w-40 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">— nepriradené —</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Vytváram…" : "Vytvoriť"}
        </Button>
      </form>
      <FormMessage state={state} />
    </Card>
  );
}

export function SubjectForm() {
  const [state, formAction, pending] = useActionState(createSubject, initialState);
  return (
    <Card className="p-5">
      <h2 className="mb-4 font-semibold">Nový predmet</h2>
      <form action={formAction} className="flex flex-wrap items-end gap-3" key={state.success}>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Názov</label>
          <Input name="name" required placeholder="Matematika" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Skratka</label>
          <Input name="code" placeholder="MAT" className="w-24" />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Vytváram…" : "Vytvoriť"}
        </Button>
      </form>
      <FormMessage state={state} />
    </Card>
  );
}

export function TeacherSubjectForm({
  teachers,
  subjects,
}: {
  teachers: { id: string; full_name: string }[];
  subjects: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(assignTeacherSubject, initialState);
  return (
    <Card className="p-5">
      <h2 className="mb-4 font-semibold">Priradiť učiteľa k predmetu</h2>
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Učiteľ</label>
          <select
            name="teacher_id"
            required
            className="min-w-40 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">— vyber —</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Predmet</label>
          <select
            name="subject_id"
            required
            className="min-w-40 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">— vyber —</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Priraďujem…" : "Priradiť"}
        </Button>
      </form>
      <FormMessage state={state} />
    </Card>
  );
}
