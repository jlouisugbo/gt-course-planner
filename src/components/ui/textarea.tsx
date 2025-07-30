import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500 dark:bg-input/30 flex field-sizing-content min-h-20 w-full rounded-lg border bg-white px-4 py-3 text-base shadow-sm transition-all duration-200 outline-none focus:shadow-md hover:shadow-md hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
