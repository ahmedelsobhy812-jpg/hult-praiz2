/* The five committees. One rendering system reads this list.
   TODO: the definitions and skills below are placeholders until the approved text arrives.
   Only the skill NAME is saved to the sheet, never the description. */
window.HP_COMMITTEES = [
  {
    id: "events",
    name: "Events Team",
    definition: "Plans and runs the competition days, workshops and the final event.",
    skills: [
      { name: "Event Planning", desc: "Build schedules, run sheets and checklists." },
      { name: "Logistics", desc: "Venues, equipment, transport and on-site flow." },
      { name: "Hosting & Moderation", desc: "Welcome guests and run sessions on stage." },
      { name: "Budget Tracking", desc: "Keep event spending organized and on target." }
    ]
  },
  {
    id: "experts",
    name: "Experts & Judges Support Team",
    definition: "Invites, supports and coordinates the experts and judges.",
    skills: [
      { name: "Professional Outreach", desc: "Write and send invitations to experts." },
      { name: "Scheduling", desc: "Coordinate availability across many people." },
      { name: "Hospitality", desc: "Look after guests before and during events." },
      { name: "Evaluation Support", desc: "Prepare scoring sheets and judging materials." }
    ]
  },
  {
    id: "media",
    name: "Media Team",
    definition: "Tells the story of the competition across social media and design.",
    skills: [
      { name: "Graphic Design", desc: "Posters, social posts and visual identity." },
      { name: "Video Editing", desc: "Cut short videos and event recaps." },
      { name: "Photography", desc: "Capture events and team moments." },
      { name: "Content Writing", desc: "Captions, articles and announcements in English." },
      { name: "Social Media Management", desc: "Plan and publish a posting calendar." }
    ]
  },
  {
    id: "partnerships",
    name: "Partnerships & Relations Team",
    definition: "Builds relationships with sponsors, universities and organizations.",
    skills: [
      { name: "Sponsorship Outreach", desc: "Contact companies and present the opportunity." },
      { name: "Negotiation", desc: "Agree on clear terms with partners." },
      { name: "Proposal Writing", desc: "Prepare partnership decks and one-pagers." },
      { name: "Relationship Management", desc: "Keep partners updated and engaged." }
    ]
  },
  {
    id: "startups",
    name: "Startups Team",
    definition: "Supports participating teams with their ideas, pitches and progress.",
    skills: [
      { name: "Business Modeling", desc: "Help teams shape a clear business model." },
      { name: "Pitch Coaching", desc: "Improve how teams present their idea." },
      { name: "Market Research", desc: "Find and summarize data about a market." },
      { name: "Mentoring", desc: "Guide teams through each competition stage." }
    ]
  }
];
