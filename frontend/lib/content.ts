import type { FAQ } from "@/lib/types"

export const faqEntries: FAQ[] = [
  {
    id: "getting-started",
    question: "How do I get started with Manochitta Sathi?",
    answer:
      "Create an account, complete your basic profile, browse approved therapists, and book a session from a real availability slot that fits your schedule.",
    order: 1,
  },
  {
    id: "session-types",
    question: "What types of sessions are available?",
    answer:
      "Therapists can currently offer video, audio, and chat-based sessions depending on their profile and the appointment you choose.",
    order: 2,
  },
  {
    id: "privacy",
    question: "Is my information private?",
    answer:
      "The platform uses authenticated accounts, role-based permissions, and protected APIs so your bookings, messages, feedback, and profile data are only visible to the people who should access them.",
    order: 3,
  },
  {
    id: "availability",
    question: "Can I only book from therapist availability?",
    answer:
      "Yes. Appointments start from therapist-defined availability slots, and a slot is removed from open booking only after successful payment confirmation.",
    order: 4,
  },
  {
    id: "therapist-approval",
    question: "How are therapists approved?",
    answer:
      "Therapists apply through the platform and stay pending until an admin reviews and approves their profile in the admin portal.",
    order: 5,
  },
  {
    id: "resources",
    question: "Who can publish resources?",
    answer:
      "Published resources are available to everyone. Admins manage all resources, and therapists can also manage their own resources through the therapist portal.",
    order: 6,
  },
  {
    id: "feedback",
    question: "Can I leave feedback after a session?",
    answer:
      "Yes. Completed appointments can be reviewed from the dashboard feedback page, and submitted feedback is also visible in the admin portal.",
    order: 7,
  },
  {
    id: "record-access",
    question: "Can I view my medical or therapy records?",
    answer:
      "Yes, user/patient records updated by therapists can generally be viewed by the user/patient. Users have the right to access their own records, ensuring transparency and better understanding of their progress and care.",
    order: 8,
  },
  {
    id: "support",
    question: "How do I contact support?",
    answer:
      "Use the contact page for direct support details and email-based contact. Crisis or emergency situations should be handled through emergency or crisis services rather than the platform.",
    order: 9,
  },
]
