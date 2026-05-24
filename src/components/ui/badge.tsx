import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
  dot?: "red" | "amber" | "green" | "blue" | "purple" | "gray";
}

const dotColors = {
  red: "bg-red-500",
  amber: "bg-yellow-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  gray: "bg-muted-foreground",
};

export function Badge({ children, className, dot }: Props) {
  return (
    <span className={cn("badge", className)}>
      {dot && <span className={cn("dot", dotColors[dot])} />}
      {children}
    </span>
  );
}
