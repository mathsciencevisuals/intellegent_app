type Props = {
  role: string;
};

function getRoleClasses(role: string) {
  switch (role) {
    case "OWNER":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "ADMIN":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "MEMBER":
      return "bg-neutral-100 text-neutral-700 border-neutral-200";
    default:
      return "bg-neutral-100 text-neutral-700 border-neutral-200";
  }
}

export function RoleBadge({ role }: Props) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getRoleClasses(
        role
      )}`}
    >
      {role}
    </span>
  );
}
