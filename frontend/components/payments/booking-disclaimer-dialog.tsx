"use client"

import Link from "next/link"

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

interface BookingDisclaimerDialogProps {
  open: boolean
  title: string
  confirmLabel: string
  isWorking?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function BookingDisclaimerDialog({
  open,
  title,
  confirmLabel,
  isWorking = false,
  onOpenChange,
  onConfirm,
}: BookingDisclaimerDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                By proceeding with this booking, you acknowledge that cancellation
                charges may apply depending on the situation. In some cases, charges
                may be up to 30% of the booking amount.
              </p>
              <p>
                Refunds are not processed automatically through the system. If you
                believe your case requires review, please contact us through the{" "}
                <Link href="/support" className="font-medium text-primary underline-offset-4 hover:underline">
                  Support
                </Link>{" "}
                section, where our support team will assist you.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isWorking}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isWorking}
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
