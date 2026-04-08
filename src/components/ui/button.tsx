import * as React from "react";
import Link from "next/link";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "default" | "outline" | "ghost";
type ButtonSize = "default" | "sm" | "lg";

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  asChild?: boolean;
  children: React.ReactNode;
};

type ButtonProps = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">;

function getVariantClasses(variant: ButtonVariant) {
  switch (variant) {
    case "outline":
      return "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50";
    case "ghost":
      return "bg-transparent text-neutral-900 hover:bg-neutral-100";
    default:
      return "bg-neutral-900 text-white hover:bg-neutral-800";
  }
}

function getSizeClasses(size: ButtonSize) {
  switch (size) {
    case "sm":
      return "h-9 px-3 text-sm";
    case "lg":
      return "h-11 px-6 text-sm";
    default:
      return "h-10 px-4 py-2 text-sm";
  }
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const classes = cn(
      "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
      getVariantClasses(variant),
      getSizeClasses(size),
      className
    );

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;

      return React.cloneElement(child, {
        className: cn(classes, child.props.className),
      });
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Link };
