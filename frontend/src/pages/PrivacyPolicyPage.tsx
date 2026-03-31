const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl bg-card text-card-foreground shadow-sm rounded-lg p-8 space-y-6 border border-border">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">1. Introduction</h2>
          <p>Welcome to Chatify. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our application and tell you about your privacy rights and how the law protects you.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">2. Data We Collect</h2>
          <p>When you use Google OAuth to sign in, we collect the following information:</p>
          <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
            <li>Your name and email address</li>
            <li>Your Google profile picture</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">3. How We Use Your Data</h2>
          <p>We use your data only to provide and improve the Chatify service. Specifically, your Google profile information is used to create your account, identify you to other users in chats, and personalize your experience.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">4. Data Storage and Security</h2>
          <p>We implement appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. We do not sell or share your personal data with third parties for marketing purposes.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">5. Contact Us</h2>
          <p>If you have any questions about this privacy policy, please contact us at notifications@send.joinchatify.site.</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
