import type { ComponentProps } from "react";

type LinkProps = {
  href: string;
  children: React.ReactNode;
} & Omit<ComponentProps<"a">, "href">;

export function Link({ href, children, ...props }: LinkProps) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}