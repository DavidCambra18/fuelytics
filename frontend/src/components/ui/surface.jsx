import { cn } from "@/lib/utils";

export function Surface({ as: Component = "div", variant = "workspace", className, ...props }) {
  return <Component className={cn("fl-surface", className)} data-surface={variant} {...props} />;
}
