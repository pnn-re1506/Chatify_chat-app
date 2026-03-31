const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl bg-card text-card-foreground shadow-sm rounded-lg p-8 space-y-6 border border-border">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
          <p>By accessing or using the Chatify application and services, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">2. Description of Service</h2>
          <p>Chatify is a real-time chat platform that allows users to communicate with each other. We reserve the right to modify or discontinue, temporarily or permanently, the service with or without notice.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">3. User Conduct</h2>
          <p>You agree not to use the service to:</p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
            <li>Upload, post, or transmit any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable.</li>
            <li>Impersonate any person or entity, or falsely state or otherwise misrepresent your affiliation with a person or entity.</li>
            <li>Interfere with or disrupt the service or servers or networks connected to the service.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">4. User Accounts</h2>
          <p>You are responsible for safeguarding the credentials that you use to access the service (including your Google OAuth login) and for any activities or actions under your account.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">5. Contact Us</h2>
          <p>If you have any questions about these Terms, please contact us at notifications@send.joinchatify.site.</p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
