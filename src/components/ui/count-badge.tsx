type Props = {
  count: number;
};

export function CountBadge({ count }: Props) {
  if (count <= 0) return null;

  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-black px-1.5 py-0.5 text-xs font-medium text-white">
      {count}
    </span>
  );
}
