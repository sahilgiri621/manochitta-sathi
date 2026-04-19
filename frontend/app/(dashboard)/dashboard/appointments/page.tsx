"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { toTitleCaseSession } from "@/lib/api";
import { appointmentService, feedbackService } from "@/services";
import type { Appointment } from "@/lib/types";

function getMeetingCode(meetingLink: string) {
  if (!meetingLink) return "";
  try {
    const url = new URL(meetingLink);
    return url.pathname.replace(/^\/+/, "");
  } catch {
    return "";
  }
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeFeedbackAppointmentId, setActiveFeedbackAppointmentId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [serviceRating, setServiceRating] = useState<number | null>(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSavingAction, setIsSavingAction] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = async () => {
    setIsLoading(true);
    try {
      setAppointments(await appointmentService.list());
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load appointments.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const upcoming = useMemo(
    () =>
      appointments.filter((item) =>
        [
          "pending_payment",
          "pending",
          "confirmed",
          "accepted",
          "rescheduled",
        ].includes(item.status) && !item.requiresAttendanceConfirmation,
      ),
    [appointments],
  );
  const history = useMemo(
    () =>
      appointments.filter((item) =>
        ["completed", "cancelled", "rejected", "missed"].includes(item.status),
      ),
    [appointments],
  );

  const followUps = useMemo(
    () => appointments.filter((item) => item.requiresAttendanceConfirmation),
    [appointments],
  );

  const handleCancel = async (appointment: Appointment) => {
    try {
      await appointmentService.cancel(
        appointment.id,
        "Cancelled from dashboard",
      );
      toast.success("Appointment cancelled.");
      await loadAppointments();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to cancel appointment.",
      );
    }
  };

  const canPay = (appointment: Appointment) =>
    ["pending_payment", "pending"].includes(appointment.status) &&
    ["unpaid", "pending", "failed", "cancelled", "expired"].includes(
      appointment.paymentStatus,
    );

  const canJoinMeeting = (appointment: Appointment) =>
    Boolean(appointment.meetingLink) &&
    appointment.meetingStatus === "ready" &&
    ["confirmed", "accepted", "rescheduled", "completed"].includes(
      appointment.status,
    );

  const handleCopyMeetingLink = async (meetingLink: string) => {
    try {
      await navigator.clipboard.writeText(meetingLink);
      toast.success("Meeting link copied.");
    } catch {
      toast.error("Unable to copy the meeting link.");
    }
  };

  const handleConfirmAttendance = async (appointment: Appointment, attended: boolean) => {
    try {
      setIsSavingAction(true);
      await appointmentService.confirmAttendance(
        appointment.id,
        attended,
        attended ? "User confirmed they joined the meeting." : "User reported they did not join the meeting.",
      );
      toast.success(attended ? "Session marked completed." : "Session marked missed.");
      await loadAppointments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to confirm attendance.");
    } finally {
      setIsSavingAction(false);
    }
  };

  const handleSubmitFeedback = async (appointment: Appointment) => {
    try {
      setIsSavingAction(true);
      await feedbackService.submit(appointment.id, feedbackRating, feedbackComment.trim(), serviceRating);
      toast.success("Rating submitted.");
      setActiveFeedbackAppointmentId(null);
      setFeedbackRating(5);
      setServiceRating(5);
      setFeedbackComment("");
      await loadAppointments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit rating.");
    } finally {
      setIsSavingAction(false);
    }
  };

  const renderStatusBadge = (appointment: Appointment) => (
    <Badge variant={appointment.status === "completed" ? "default" : appointment.status === "missed" || appointment.status === "cancelled" ? "secondary" : "outline"} className="capitalize">
      {appointment.status === "confirmed" || appointment.status === "accepted" || appointment.status === "rescheduled"
        ? "booked"
        : appointment.status.replaceAll("_", " ")}
    </Badge>
  );

  const renderAttendancePrompt = (appointment: Appointment) =>
    appointment.requiresAttendanceConfirmation ? (
      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="font-medium text-amber-950">Did you join the meeting?</p>
        <p className="mt-1 text-sm text-amber-900">
          This session time has passed. Confirming attendance updates the appointment status.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => handleConfirmAttendance(appointment, true)} disabled={isSavingAction}>
            Yes, I joined
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleConfirmAttendance(appointment, false)} disabled={isSavingAction}>
            No, I missed it
          </Button>
        </div>
      </div>
    ) : null;

  const renderFeedbackPrompt = (appointment: Appointment) =>
    appointment.status === "completed" && !appointment.hasFeedback ? (
      <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
        {activeFeedbackAppointmentId === appointment.id ? (
          <div className="space-y-4">
            <div>
              <Label>How would you rate your therapist?</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Button key={value} type="button" size="sm" variant={feedbackRating === value ? "default" : "outline"} onClick={() => setFeedbackRating(value)}>
                    {value}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>How would you rate our service?</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Button key={value} type="button" size="sm" variant={serviceRating === value ? "default" : "outline"} aria-label={`service rating ${value}`} onClick={() => setServiceRating(value)}>
                    {value}
                  </Button>
                ))}
                <Button type="button" size="sm" variant={serviceRating === null ? "default" : "outline"} onClick={() => setServiceRating(null)}>
                  Skip
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor={`feedback-comment-${appointment.id}`}>Comment</Label>
              <Textarea id={`feedback-comment-${appointment.id}`} value={feedbackComment} onChange={(event) => setFeedbackComment(event.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleSubmitFeedback(appointment)} disabled={isSavingAction}>
                Submit Rating
              </Button>
              <Button size="sm" variant="outline" onClick={() => setActiveFeedbackAppointmentId(null)} disabled={isSavingAction}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Rate this completed session</p>
              <p className="text-sm text-muted-foreground">Your rating helps improve therapist and service quality.</p>
            </div>
            <Button size="sm" onClick={() => setActiveFeedbackAppointmentId(appointment.id)}>
              Rate Session
            </Button>
          </div>
        )}
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-muted-foreground">
            Manage your upcoming and past sessions.
          </p>
        </div>
        <Button asChild>
          <Link href="/therapists">Book New Session</Link>
        </Button>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="follow-up">Follow Up</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6 space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading appointments...</p>
          ) : error ? (
            <Card>
              <CardContent className="py-12 text-center text-destructive">
                {error}
              </CardContent>
            </Card>
          ) : upcoming.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No upcoming appointments.
              </CardContent>
            </Card>
          ) : (
            upcoming.map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="font-semibold">{appointment.therapistName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(appointment.scheduledStart).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {toTitleCaseSession(appointment.sessionType)} session
                    </p>
                    {appointment.status === "pending_payment" ? (
                      <p className="text-sm text-amber-700">
                        Proceed to payment to confirm this booking.
                      </p>
                    ) : appointment.status === "confirmed" ? (
                      <p className="text-sm text-emerald-700">
                        This session is confirmed. No further therapist approval
                        is required.
                      </p>
                    ) : null}
                    <p className="text-sm text-muted-foreground capitalize">
                      Payment: {appointment.paymentStatus}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      Meeting: {appointment.meetingStatus || "not created"}
                    </p>
                    {appointment.meetingLink ? (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Join link is ready for this session.</p>
                        <p className="break-all">
                          Link: {appointment.meetingLink}
                        </p>
                        {getMeetingCode(appointment.meetingLink) ? (
                          <p>
                            Meeting code:{" "}
                            {getMeetingCode(appointment.meetingLink)}
                          </p>
                        ) : null}
                      </div>
                    ) : appointment.paymentStatus === "paid" ? (
                      <p className="text-sm text-muted-foreground">
                        Payment is verified. Meeting link will appear once
                        prepared.
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStatusBadge(appointment)}
                    {canPay(appointment) ? (
                      <Button asChild>
                        <Link
                          href={`/dashboard/appointments/payment/${appointment.id}`}
                        >
                          Pay with Khalti
                        </Link>
                      </Button>
                    ) : null}
                    {canJoinMeeting(appointment) ? (
                      <Button asChild variant="outline">
                        <Link
                          href={appointment.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Join Meeting
                        </Link>
                      </Button>
                    ) : null}
                    {appointment.meetingLink ? (
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleCopyMeetingLink(appointment.meetingLink)
                        }
                      >
                        Copy Link
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      onClick={() => handleCancel(appointment)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="follow-up" className="mt-6 space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading session follow-ups...</p>
          ) : error ? (
            <Card>
              <CardContent className="py-12 text-center text-destructive">
                {error}
              </CardContent>
            </Card>
          ) : followUps.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No sessions need attendance confirmation.
              </CardContent>
            </Card>
          ) : (
            followUps.map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold">{appointment.therapistName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appointment.scheduledStart).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {toTitleCaseSession(appointment.sessionType)} session
                      </p>
                    </div>
                    {renderStatusBadge(appointment)}
                  </div>
                  {renderAttendancePrompt(appointment)}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6 space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground">
              Loading appointment history...
            </p>
          ) : error ? (
            <Card>
              <CardContent className="py-12 text-center text-destructive">
                {error}
              </CardContent>
            </Card>
          ) : history.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No past appointments.
              </CardContent>
            </Card>
          ) : (
            history.map((appointment) => (
              <Card key={appointment.id}>
                <CardContent className="p-6">
                  <p className="font-semibold">{appointment.therapistName}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(appointment.scheduledStart).toLocaleString()}
                  </p>
                  <p className="text-sm capitalize text-muted-foreground mt-1">
                    Payment: {appointment.paymentStatus}
                  </p>
                  <p className="text-sm capitalize text-muted-foreground mt-1">
                    Meeting: {appointment.meetingStatus || "not created"}
                  </p>
                  {appointment.meetingLink ? (
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p className="break-all">
                        Link: {appointment.meetingLink}
                      </p>
                      {getMeetingCode(appointment.meetingLink) ? (
                        <p>
                          Meeting code:{" "}
                          {getMeetingCode(appointment.meetingLink)}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {canJoinMeeting(appointment) ? (
                    <div className="mt-3 flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={appointment.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Join Meeting
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCopyMeetingLink(appointment.meetingLink)
                        }
                      >
                        Copy Link
                      </Button>
                    </div>
                  ) : null}
                  <p className="text-sm capitalize text-muted-foreground mt-1">
                    {renderStatusBadge(appointment)}
                  </p>
                  {renderFeedbackPrompt(appointment)}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
