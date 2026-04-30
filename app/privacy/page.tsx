export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <p className="text-zinc-400 mb-4">
        We respect your privacy and protect your data.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. Data Collected</h2>
      <p className="text-zinc-400">
        We collect email and account data necessary to operate the platform.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. Usage</h2>
      <p className="text-zinc-400">
        Your data is used to provide and improve TradeRadar services.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Security</h2>
      <p className="text-zinc-400">
        We use secure systems (Supabase) to store and protect your data.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Sharing</h2>
      <p className="text-zinc-400">
        We do not sell or share your personal data with third parties.
      </p>
    </main>
  );
}