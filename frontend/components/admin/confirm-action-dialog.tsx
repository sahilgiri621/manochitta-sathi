"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmActionDialogProps {
  open: boolean
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  isWorking?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ConfirmActionDialog({
  open,
  title = "Are you sure?",
  description = "This action will update the selected record.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  isWorking = false,
  onOpenChange,
  onConfirm,
}: ConfirmActionDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isWorking}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={isWorking}
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
            }}
          >
            {isWorking ? "Working..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
