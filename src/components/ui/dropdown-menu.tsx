"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";

interface DropdownMenuProps {
  children: React.ReactNode;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            isOpen,
            setIsOpen,
          });
        }
        return child;
      })}
    </div>
  );
};

interface DropdownMenuTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ className, children, asChild, isOpen, setIsOpen, ...props }, ref) => {
    const handleClick = () => {
      setIsOpen?.(!isOpen);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: handleClick,
      });
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        className={className}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "center" | "end";
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, children, align = "end", isOpen, setIsOpen, ...props }, ref) => {
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
          setIsOpen?.(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen, setIsOpen]);

    if (!isOpen) return null;

    const alignmentClasses = {
      start: "left-0",
      center: "left-1/2 -translate-x-1/2",
      end: "right-0",
    };

    return (
      <div
        ref={contentRef}
        className={cn(
          "absolute top-full mt-2 z-50 min-w-[200px] rounded-xl border-2 border-gray-200 bg-white p-2 text-sm text-gray-900 shadow-xl",
          alignmentClasses[align],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuContent.displayName = "DropdownMenuContent";

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, children, asChild, ...props } , ref) => {
    if (asChild && React.isValidElement(children)) {
      const childElement = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(childElement, {
        className: cn(
          "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none transition hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900",
          childElement.props.className
        ),
      });
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none transition hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("my-2 h-px bg-gray-200", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
