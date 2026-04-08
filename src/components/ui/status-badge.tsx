type Props = {
  status: string;
};

function getStatusClasses(status: string) {
  switch (status) {
    case "READY":
    case "ACCEPTED":
      return "bg-green-100 text-green-700 border-green-200";
    case "PROCESSING":
    case "PENDING":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "FAILED":
    case "DECLINED":
    case "EXPIRED":
      return "bg-red-100 text-red-700 border-red-200";
    case "DRAFT":
      return "bg-neutral-100 text-neutral-700 border-neutral-200";
    default:
      return "bg-neutral-100 text-neutral-700 border-neutral-200";
  }
}

export function StatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusClasses(
        status
      )}`}
    >
      {status}
    </span>
  );
}
