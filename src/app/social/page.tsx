"use client";

import { useState } from "react";
import { SocialMediaPanel } from "@/components/social-media-panel";

export default function SocialPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SocialMediaPanel />
    </main>
  );
}