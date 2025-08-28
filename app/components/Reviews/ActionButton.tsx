"use client";

type Props = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  variant?: "regen" | "edit" | "publish";
};

export default function ActionButton({
  label,
  onClick,
  disabled = false,
  title,
  variant = "regen",
}: Props) {
  const base =
    "w-full inline-flex items-center justify-center rounded-full text-[11px] font-medium " +
    "px-2 py-1 transition-colors whitespace-nowrap select-none " +
    "focus:outline-none focus:ring-2 focus:ring-offset-1 " +
    "disabled:opacity-50 disabled:cursor-not-allowed h-7";

  const variants = {
    regen: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-400",
    edit: "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400",
    publish:
      "bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-400",
  };

  const prettyLabel =
    label.length > 0
      ? label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()
      : "";

  return (
    <button
      type="button"
      className={`${base} ${variants[variant]}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {prettyLabel}
    </button>
  );
}
