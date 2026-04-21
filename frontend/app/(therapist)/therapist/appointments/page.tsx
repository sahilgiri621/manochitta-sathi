"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { appointmentService } from "@/services";
import type { Appointment } from "@/lib/types";

const emptyCompletionForm = {
  notes: "",
  sessionSummary: "",
  patientProgress: "",
  recommendations: "",
  nextSteps: "",
  riskFlag: "",
  diagnosisNotes: "",
};

function getMeetingCode(meetingLink: string) {
  if (!meetingLink) return "";
  try {
    const url = new URL(meetingLink);
    return url.pathname.replace(/^\/+/, "");
  } catch {
    return "";
  }
}

export default function TherapistAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeCompletionAppointmentId, setActiveCompletionAppointmentId] =
    useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [completionForm, setCompletionForm] = useState(emptyCompletionForm);
  const [activeAttendanceAppointmentId, setActiveAttendanceAppointmentId] =
    useState<string | null>(null);
  const [attendanceForm, setAttendanceForm] = useState({
    attended: true,
    note: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
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
    loadAppointments().catch(() => undefined);
  }, []);

  const upcoming = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          ["confirmed", "accepted", "rescheduled"].includes(appointment.status) &&
          !appointment.requiresAttendanceConfirmation,
      ),
    [appointments],
  );
  const followUps = useMemo(
    () => appointments.filter((appointment) => appointment.requiresAttendanceConfirmation),
    [appointments],
  );
  const history = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          !["confirmed", "accepted", "rescheduled", "pending_payment"].includes(
            appointment.status,
          ) || appointment.status === "missed",
      ),
    [appointments],
  );

  const canJoinMeeting = (appointment: Appointment) =>
    Boolean(appointment.meetingLink) &&
    appointment.meetingStatus === "ready" &&
    ["confirmed", "accepted", "rescheduled", "completed"].includes(
      appointment.status,
    );

  useEffect(() => {
    if (followUps.length > 0) {
      setActiveTab("follow-up");
    } else if (upcoming.length > 0) {
      setActiveTab("upcoming");
    } else {
      setActiveTab("history");
    }
  }, [followUps.length, upcoming.length]);

  const handleCopyMeetingLink = async (meetingLink: string) => {
    try {
      await navigator.clipboard.writeText(meetingLink);
      toast.success("Meeting link copied.");
    } catch {
      toast.error("Unable to copy the meeting link.");
    }
  };

  const openCompletionForm = (appointmentId: string) => {
    setActiveCompletionAppointmentId(appointmentId);
    setCompletionForm(emptyCompletionForm);
  };

  const handleComplete = async (appointment: Appointment) => {
    try {
      setIsSavingCompletion(true);
      await appointmentService.complete(appointment.id, completionForm);
      toast.success("Appointment completed.");
      setActiveCompletionAppointmentId(null);
      setCompletionForm(emptyCompletionForm);
      await loadAppointments();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update appointment.",
      );
    } finally {
      setIsSavingCompletion(false);
    }
  };

  const openAttendanceForm = (appointmentId: string, attended = true) => {
    setActiveAttendanceAppointmentId(appointmentId);
    setAttendanceForm({ attended, note: "" });
  };

  const handleConfirmAttendance = async (appointment: Appointment) => {
    try {
      setIsSavingAttendance(true);
      await appointmentService.confirmAttendance(
        appointment.id,
        attendanceForm.attended,
        attendanceForm.note,
      );
      toast.success(
        attendanceForm.attended
          ? "Attendance confirmed."
          : "Session marked missed.",
      );
      setActiveAttendanceAppointmentId(null);
      setAttendanceForm({ attended: true, note: "" });
      await loadAppointments();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to confirm attendance.",
      );
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const renderList = (items: Appointment[], showActions = false) => (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-muted-foreground">
          No appointments in this section.
        </p>
      ) : (
        items.map((appointment) => (
          <div
            key={appointment.id}
            className="rounded-lg border border-border p-4"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{appointment.userName}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(appointment.scheduledStart).toLocaleString()}
                </p>
                <Badge variant={appointment.status === "completed" ? "default" : appointment.status === "missed" || appointment.status === "cancelled" ? "secondary" : "outline"} className="mt-2 capitalize">
                  {["confirmed", "accepted", "rescheduled"].includes(appointment.status) ? "booked" : appointment.status.replaceAll("_", " ")}
                </Badge>
                <p className="text-sm text-muted-foreground capitalize">
                  Payment: {appointment.paymentStatus}
                </p>
                <p className="text-sm text-muted-foreground capitalize">
                  Meeting: {appointment.meetingStatus || "not created"}
                </p>
                {appointment.meetingLink ? (
                  <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                    <p className="break-all">Link: {appointment.meetingLink}</p>
                    {getMeetingCode(appointment.meetingLink) ? (
                      <p>
                        Meeting code: {getMeetingCode(appointment.meetingLink)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {appointment.status === "confirmed" ? (
                  <p className="text-sm text-emerald-700">
                    Confirmed automatically after verified payment.
                  </p>
                ) : null}
              </div>
              {showActions ? (
                <div className="flex flex-wrap gap-2">
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
                  {appointment.requiresAttendanceConfirmation ? (
                    <Button onClick={() => openCompletionForm(appointment.id)}>
                      Complete Session Record
                    </Button>
                  ) : null}
                  {appointment.requiresAttendanceConfirmation ? (
                    <Button
                      variant="outline"
                      onClick={() => openAttendanceForm(appointment.id, false)}
                    >
                      Mark Missed
                    </Button>
                  ) : null}
                  {["confirmed", "accepted", "rescheduled"].includes(
                    appointment.status,
                  ) && !appointment.requiresAttendanceConfirmation ? (
                    <p className="text-sm text-muted-foreground">
                      Completion opens after the scheduled end time.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {showActions && activeCompletionAppointmentId === appointment.id ? (
              <div className="mt-4 space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium">
                  Complete session record before marking the appointment
                  complete.
                </p>

                <div>
                  <Label htmlFor={`completion-notes-${appointment.id}`}>
                    Session Notes
                  </Label>
                  <Textarea
                    id={`completion-notes-${appointment.id}`}
                    value={completionForm.notes}
                    onChange={(event) =>
                      setCompletionForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor={`completion-summary-${appointment.id}`}>
                    Session Summary
                  </Label>
                  <Textarea
                    id={`completion-summary-${appointment.id}`}
                    value={completionForm.sessionSummary}
                    onChange={(event) =>
                      setCompletionForm((current) => ({
                        ...current,
                        sessionSummary: event.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor={`completion-progress-${appointment.id}`}>
                    Patient Progress / Condition
                  </Label>
                  <Textarea
                    id={`completion-progress-${appointment.id}`}
                    value={completionForm.patientProgress}
                    onChange={(event) =>
                      setCompletionForm((current) => ({
                        ...current,
                        patientProgress: event.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label
                    htmlFor={`completion-recommendations-${appointment.id}`}
                  >
                    Recommendations / Follow-up
                  </Label>
                  <Textarea
                    id={`completion-recommendations-${appointment.id}`}
                    value={completionForm.recommendations}
                    onChange={(event) =>
                      setCompletionForm((current) => ({
                        ...current,
                        recommendations: event.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor={`completion-next-steps-${appointment.id}`}>
                    Next Steps
                  </Label>
                  <Textarea
                    id={`completion-next-steps-${appointment.id}`}
                    value={completionForm.nextSteps}
                    onChange={(event) =>
                      setCompletionForm((current) => ({
                        ...current,
                        nextSteps: event.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor={`completion-diagnosis-${appointment.id}`}>
                    Diagnosis Notes
                  </Label>
                  <Textarea
                    id={`completion-diagnosis-${appointment.id}`}
                    value={completionForm.diagnosisNotes}
                    onChange={(event) =>
                      setCompletionForm((current) => ({
                        ...current,
                        diagnosisNotes: event.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor={`completion-risk-${appointment.id}`}>
                    Risk / Flag
                  </Label>
                  <Input
                    id={`completion-risk-${appointment.id}`}
                    value={completionForm.riskFlag}
                    onChange={(event) =>
                      setCompletionForm((current) => ({
                        ...current,
                        riskFlag: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleComplete(appointment)}
                    disabled={isSavingCompletion}
                  >
                    {isSavingCompletion ? "Saving..." : "Save and Complete"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setActiveCompletionAppointmentId(null)}
                    disabled={isSavingCompletion}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}

            {showActions && activeAttendanceAppointmentId === appointment.id
              ? renderAttendanceForm(appointment)
              : null}
          </div>
        ))
      )}
    </div>
  );

  const renderAttendanceForm = (appointment: Appointment) => (
    <div className="mt-4 space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-sm font-medium">
        Why was this session missed?
      </p>
      <p className="text-sm text-muted-foreground">
        Add the therapist reason for the missed session. Missed sessions do not
        generate earnings unless the appointment is later completed.
      </p>

      <div>
        <Label htmlFor={`attendance-note-${appointment.id}`}>
          Therapist reason
        </Label>
        <Textarea
          id={`attendance-note-${appointment.id}`}
          value={attendanceForm.note}
          onChange={(event) =>
            setAttendanceForm((current) => ({
              ...current,
              note: event.target.value,
            }))
          }
          placeholder="Explain why the session was missed..."
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => handleConfirmAttendance(appointment)}
          disabled={isSavingAttendance || !attendanceForm.note.trim()}
        >
          {isSavingAttendance ? "Saving..." : "Mark Session Missed"}
        </Button>
        <Button
          variant="outline"
          onClick={() => setActiveAttendanceAppointmentId(null)}
          disabled={isSavingAttendance}
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Appointments</h1>
        <p className="text-muted-foreground">
          Review paid bookings, join sessions, and complete sessions with
          required records.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="mb-4 text-muted-foreground">
              Loading appointments...
            </p>
          ) : null}
          {error ? <p className="mb-4 text-destructive">{error}</p> : null}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="upcoming">Confirmed</TabsTrigger>
              <TabsTrigger value="follow-up">Follow Up</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="mt-4">
              {renderList(upcoming, true)}
            </TabsContent>
            <TabsContent value="follow-up" className="mt-4">
              {renderList(followUps, true)}
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              {renderList(history)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
