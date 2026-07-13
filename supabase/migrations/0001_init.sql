-- =========================================================
-- EDUFAKE.SK — Initial schema
-- Core: schools, roles/permissions (RBAC), profiles, classes,
-- subjects, students/teachers/parents, grades, attendance,
-- homework, timetable, messaging, notifications, audit log.
-- =========================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ---------- ENUMS ----------

create type user_role as enum (
  'administrator',
  'director',
  'deputy_director',
  'teacher',
  'class_teacher',
  'parent',
  'student',
  'school_psychologist',
  'economy',
  'secretary',
  'reception',
  'it_administrator',
  'guest'
);

create type attendance_status as enum (
  'present', 'absent', 'excused', 'late', 'early_leave', 'doctor_excuse', 'parent_excuse'
);

create type homework_status as enum ('assigned', 'submitted', 'missing', 'late', 'reviewed');

-- ---------- SCHOOLS & SETTINGS ----------

create table schools (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'EDUFAKE.SK',
  address text,
  email text,
  phone text,
  website text,
  logo_url text,
  favicon_url text,
  primary_color text default '#1a56db',
  timezone text default 'Europe/Bratislava',
  language text default 'sk',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table school_years (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  label text not null, -- e.g. "2026/2027"
  start_date date not null,
  end_date date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table semesters (
  id uuid primary key default gen_random_uuid(),
  school_year_id uuid not null references school_years(id) on delete cascade,
  name text not null, -- "1st semester" / "2nd semester"
  start_date date not null,
  end_date date not null
);

create table buildings (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null
);

create table classrooms (
  id uuid primary key default gen_random_uuid(),
  building_id uuid references buildings(id) on delete set null,
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,
  capacity int
);

create table bell_schedule (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  period_number int not null,
  start_time time not null,
  end_time time not null,
  unique (school_id, period_number)
);

create table departments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null
);

create table subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  department_id uuid references departments(id) on delete set null,
  name text not null,
  code text,
  created_at timestamptz not null default now()
);

-- ---------- IDENTITY / RBAC ----------

-- profiles mirrors auth.users 1:1
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid references schools(id) on delete set null,
  full_name text not null,
  email text not null unique,
  phone text,
  avatar_url text,
  role user_role not null default 'guest',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Fine-grained, admin-editable permissions layered on top of the coarse `role` enum.
create table permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique, -- e.g. "grades.edit", "attendance.view_all"
  description text
);

create table custom_roles (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,
  base_role user_role, -- optional: inherit defaults from a built-in role
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

create table custom_role_permissions (
  custom_role_id uuid not null references custom_roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (custom_role_id, permission_id)
);

create table user_custom_roles (
  user_id uuid not null references profiles(id) on delete cascade,
  custom_role_id uuid not null references custom_roles(id) on delete cascade,
  primary key (user_id, custom_role_id)
);

-- ---------- CLASSES / STUDENTS / TEACHERS / PARENTS ----------

create table classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  school_year_id uuid not null references school_years(id) on delete cascade,
  name text not null, -- e.g. "3.A"
  class_teacher_id uuid references profiles(id) on delete set null,
  homeroom_id uuid references classrooms(id) on delete set null,
  created_at timestamptz not null default now()
);

create table students (
  id uuid primary key references profiles(id) on delete cascade,
  class_id uuid references classes(id) on delete set null,
  student_number text unique,
  birth_date date,
  enrolled_at date not null default current_date
);

create table teachers (
  id uuid primary key references profiles(id) on delete cascade,
  department_id uuid references departments(id) on delete set null,
  title text
);

create table parents (
  id uuid primary key references profiles(id) on delete cascade
);

create table parent_student (
  parent_id uuid not null references parents(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  relationship text default 'parent',
  primary key (parent_id, student_id)
);

create table teacher_subjects (
  teacher_id uuid not null references teachers(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  primary key (teacher_id, subject_id)
);

-- ---------- TIMETABLE ----------

create table timetable_entries (
  id uuid primary key default gen_random_uuid(),
  school_year_id uuid not null references school_years(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  teacher_id uuid not null references teachers(id) on delete cascade,
  classroom_id uuid references classrooms(id) on delete set null,
  day_of_week int not null check (day_of_week between 1 and 7),
  period_number int not null,
  created_at timestamptz not null default now()
);

create table substitutions (
  id uuid primary key default gen_random_uuid(),
  timetable_entry_id uuid not null references timetable_entries(id) on delete cascade,
  date date not null,
  substitute_teacher_id uuid references teachers(id) on delete set null,
  substitute_classroom_id uuid references classrooms(id) on delete set null,
  reason text,
  approved_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- CLASS REGISTER / LESSONS ----------

create table lessons (
  id uuid primary key default gen_random_uuid(),
  timetable_entry_id uuid references timetable_entries(id) on delete set null,
  class_id uuid not null references classes(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  teacher_id uuid not null references teachers(id) on delete cascade,
  date date not null,
  topic text,
  objectives text,
  notes text,
  created_at timestamptz not null default now()
);

create table lesson_attachments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  file_path text not null, -- Supabase Storage path
  file_name text not null,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- ATTENDANCE ----------

create table attendance_records (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  status attendance_status not null default 'present',
  note text,
  recorded_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (lesson_id, student_id)
);

create table absence_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  submitted_by uuid not null references profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  document_path text, -- doctor confirmation PDF/image in Storage
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- HOMEWORK ----------

create table homework (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  teacher_id uuid not null references teachers(id) on delete cascade,
  title text not null,
  description text,
  due_date date not null,
  created_at timestamptz not null default now()
);

create table homework_attachments (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references homework(id) on delete cascade,
  file_path text not null,
  file_name text not null
);

create table homework_submissions (
  id uuid primary key default gen_random_uuid(),
  homework_id uuid not null references homework(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  status homework_status not null default 'assigned',
  submitted_at timestamptz,
  file_path text,
  teacher_comment text,
  unique (homework_id, student_id)
);

-- ---------- GRADES ----------

create table grade_categories (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  name text not null, -- "Test", "Homework", "Oral"
  weight numeric not null default 1
);

create table grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  subject_id uuid not null references subjects(id) on delete cascade,
  category_id uuid references grade_categories(id) on delete set null,
  semester_id uuid not null references semesters(id) on delete cascade,
  teacher_id uuid not null references teachers(id) on delete cascade,
  value numeric not null,
  weight numeric not null default 1,
  comment text,
  created_at timestamptz not null default now()
);

-- ---------- BEHAVIOR ----------

create table behavior_marks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  recorded_by uuid not null references profiles(id) on delete cascade,
  type text not null check (type in ('positive','negative')),
  description text not null,
  created_at timestamptz not null default now()
);

-- ---------- MESSAGING / NOTIFICATIONS ----------

create table messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  subject text,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references profiles(id) on delete cascade, -- null = broadcast to scope below
  school_id uuid references schools(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- AUDIT LOG ----------

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  table_name text,
  record_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- =========================================================
-- INDEXES
-- =========================================================

create index idx_students_class on students(class_id);
create index idx_grades_student on grades(student_id);
create index idx_grades_subject on grades(subject_id);
create index idx_attendance_student on attendance_records(student_id);
create index idx_homework_class on homework(class_id);
create index idx_timetable_class on timetable_entries(class_id);
create index idx_messages_recipient on messages(recipient_id);
create index idx_notifications_recipient on notifications(recipient_id);
create index idx_audit_actor on audit_logs(actor_id);

-- =========================================================
-- updated_at trigger helper
-- =========================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger trg_schools_updated_at before update on schools
  for each row execute function set_updated_at();

-- Auto-create a profile row whenever a Supabase Auth user is created
create or replace function handle_new_auth_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'guest')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_auth_user();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table schools enable row level security;
alter table profiles enable row level security;
alter table classes enable row level security;
alter table students enable row level security;
alter table teachers enable row level security;
alter table parents enable row level security;
alter table parent_student enable row level security;
alter table grades enable row level security;
alter table attendance_records enable row level security;
alter table homework enable row level security;
alter table homework_submissions enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table absence_requests enable row level security;
alter table behavior_marks enable row level security;
alter table audit_logs enable row level security;

-- Helper: current user's role, read from profiles (SECURITY DEFINER avoids RLS recursion)
create or replace function current_role_name()
returns user_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function is_staff()
returns boolean as $$
  select current_role_name() in (
    'administrator','director','deputy_director','teacher','class_teacher',
    'school_psychologist','economy','secretary','reception','it_administrator'
  );
$$ language sql stable security definer;

create or replace function is_admin()
returns boolean as $$
  select current_role_name() = 'administrator';
$$ language sql stable security definer;

-- profiles: everyone can read their own row; staff can read all; admin can write all
create policy profiles_select_own on profiles for select
  using (id = auth.uid() or is_staff());
create policy profiles_update_own on profiles for update
  using (id = auth.uid() or is_admin());
create policy profiles_admin_insert on profiles for insert
  with check (is_admin());
create policy profiles_admin_delete on profiles for delete
  using (is_admin());

-- schools: readable by all authenticated users of that school; writable by admin
create policy schools_select on schools for select
  using (auth.role() = 'authenticated');
create policy schools_admin_write on schools for all
  using (is_admin()) with check (is_admin());

-- students: staff full read; student reads own; parent reads linked children
create policy students_select on students for select
  using (
    is_staff()
    or id = auth.uid()
    or exists (
      select 1 from parent_student ps where ps.student_id = students.id and ps.parent_id = auth.uid()
    )
  );
create policy students_staff_write on students for all
  using (is_staff()) with check (is_staff());

-- grades: staff (teachers/admin) write; student/parent read own
create policy grades_select on grades for select
  using (
    is_staff()
    or student_id = auth.uid()
    or exists (select 1 from parent_student ps where ps.student_id = grades.student_id and ps.parent_id = auth.uid())
  );
create policy grades_teacher_write on grades for all
  using (is_staff()) with check (is_staff());

-- attendance: same pattern as grades
create policy attendance_select on attendance_records for select
  using (
    is_staff()
    or student_id = auth.uid()
    or exists (select 1 from parent_student ps where ps.student_id = attendance_records.student_id and ps.parent_id = auth.uid())
  );
create policy attendance_staff_write on attendance_records for all
  using (is_staff()) with check (is_staff());

-- homework: class-visible to its students/parents/teachers; staff manage
create policy homework_select on homework for select
  using (
    is_staff()
    or exists (
      select 1 from students s where s.class_id = homework.class_id and s.id = auth.uid()
    )
    or exists (
      select 1 from students s
      join parent_student ps on ps.student_id = s.id
      where s.class_id = homework.class_id and ps.parent_id = auth.uid()
    )
  );
create policy homework_staff_write on homework for all
  using (is_staff()) with check (is_staff());

create policy homework_submissions_select on homework_submissions for select
  using (
    is_staff()
    or student_id = auth.uid()
    or exists (select 1 from parent_student ps where ps.student_id = homework_submissions.student_id and ps.parent_id = auth.uid())
  );
create policy homework_submissions_write on homework_submissions for all
  using (is_staff() or student_id = auth.uid())
  with check (is_staff() or student_id = auth.uid());

-- messages: only sender or recipient
create policy messages_select on messages for select
  using (sender_id = auth.uid() or recipient_id = auth.uid());
create policy messages_insert on messages for insert
  with check (sender_id = auth.uid());
create policy messages_update_read on messages for update
  using (recipient_id = auth.uid());

-- notifications: recipient, or broadcast scoped to their school/class
create policy notifications_select on notifications for select
  using (
    recipient_id = auth.uid()
    or (recipient_id is null and is_staff())
    or (recipient_id is null and exists (
      select 1 from students s where s.class_id = notifications.class_id and s.id = auth.uid()
    ))
  );
create policy notifications_staff_write on notifications for all
  using (is_staff()) with check (is_staff());

-- absence requests: parent/student submit + view own; staff review all
create policy absence_select on absence_requests for select
  using (
    is_staff()
    or student_id = auth.uid()
    or exists (select 1 from parent_student ps where ps.student_id = absence_requests.student_id and ps.parent_id = auth.uid())
  );
create policy absence_insert on absence_requests for insert
  with check (
    submitted_by = auth.uid() and (
      student_id = auth.uid()
      or exists (select 1 from parent_student ps where ps.student_id = absence_requests.student_id and ps.parent_id = auth.uid())
    )
  );
create policy absence_staff_review on absence_requests for update
  using (is_staff());

-- behavior marks: staff write; student/parent read own
create policy behavior_select on behavior_marks for select
  using (
    is_staff()
    or student_id = auth.uid()
    or exists (select 1 from parent_student ps where ps.student_id = behavior_marks.student_id and ps.parent_id = auth.uid())
  );
create policy behavior_staff_write on behavior_marks for all
  using (is_staff()) with check (is_staff());

-- audit logs: admin only
create policy audit_admin_only on audit_logs for select using (is_admin());

-- classes/teachers/parents/parent_student: staff manage, self read
create policy classes_select on classes for select using (auth.role() = 'authenticated');
create policy classes_staff_write on classes for all using (is_staff()) with check (is_staff());

create policy teachers_select on teachers for select using (auth.role() = 'authenticated');
create policy teachers_staff_write on teachers for all using (is_staff()) with check (is_staff());

create policy parents_select on parents for select
  using (id = auth.uid() or is_staff());
create policy parents_staff_write on parents for all using (is_staff()) with check (is_staff());

create policy parent_student_select on parent_student for select
  using (parent_id = auth.uid() or is_staff());
create policy parent_student_staff_write on parent_student for all using (is_staff()) with check (is_staff());

-- =========================================================
-- SEED: default school + default administrator
-- NOTE: the auth.users row for the admin must be created via
-- Supabase Auth (see seed script / README) — this migration
-- only seeds the school + permission catalogue.
-- =========================================================

insert into schools (name, email, timezone, language)
values ('EDUFAKE.SK', 'admin@edufake.sk', 'Europe/Bratislava', 'sk');

insert into permissions (key, description) values
  ('users.manage', 'Create, edit, deactivate any user'),
  ('roles.manage', 'Create and edit custom roles and permissions'),
  ('grades.edit', 'Enter and edit grades'),
  ('grades.view_all', 'View grades for all students'),
  ('attendance.edit', 'Record attendance'),
  ('attendance.view_all', 'View attendance for all students'),
  ('homework.manage', 'Create/edit/delete homework'),
  ('timetable.manage', 'Edit timetable and substitutions'),
  ('reports.export', 'Export PDF/Excel reports'),
  ('settings.manage', 'Edit school-wide settings'),
  ('messages.broadcast', 'Send school-wide notifications');
