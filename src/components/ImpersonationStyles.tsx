"use client";

export default function ImpersonationStyles() {
    return (
        <style jsx global>{`
      body.has-impersonation-banner nav.fixed {
        top: 40px; /* Height of the impersonation banner */
      }
      body.has-impersonation-banner .h-16 {
        height: 4.5rem; /* Increased height to account for the banner */
      }
      body.has-impersonation-banner {
        padding-top: 40px; /* Add padding for the banner */
      }
    `}</style>
    );
}
