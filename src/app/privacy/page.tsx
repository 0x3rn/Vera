import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Vera",
  description: "Privacy Policy for Vera Legal Document Risk Engine.",
};

export default function PrivacyPolicy() {
  const lastUpdated = "June 22, 2026";

  return (
    <div className="min-h-full flex flex-col">
      <nav className="w-full bg-background/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-8 h-[70px] flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            Vera<span className="text-primary">.</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="flex-grow pt-16 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-8">
          <div className="mb-16 border-b border-border pb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight text-foreground">Privacy Policy</h1>
            <p className="text-lg text-muted-foreground">Effective Date: {lastUpdated}</p>
          </div>

          <div className="space-y-12 text-muted-foreground leading-loose text-base sm:text-lg">
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">1. Introduction to Our Privacy Commitment</h2>
              <div className="space-y-4">
                <p>Welcome to Vera. We understand that legal documents contain highly sensitive and confidential information. This Privacy Policy explains how we collect, use, process, and protect your personal information and uploaded documents when you use our website, platform, and the Vera Risk Engine™ (collectively, the "Service"). Your privacy and data security are our top priorities.</p>
                <p>By using the Service, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, please do not use our Service.</p>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">2. Information We Collect</h2>
              <div className="space-y-4">
                <p>We collect several different types of information for various purposes to provide and improve our Service to you.</p>
                
                <h3 className="text-xl font-semibold text-foreground mt-6">2.1. Account Information</h3>
                <p>When you register for an account, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you. This includes your first and last name, email address, password (which is hashed and securely stored), and account preferences.</p>
                
                <h3 className="text-xl font-semibold text-foreground mt-6">2.2. Uploaded Documents and Contracts</h3>
                <p>The core function of Vera is to analyze documents. When you upload a PDF file or paste text into the Vera Risk Engine™, we collect that document content. This includes the full text of the agreement, identifying metadata, names of contracting parties, and any financial or legal terms contained within the document.</p>
                
                <h3 className="text-xl font-semibold text-foreground mt-6">2.3. Payment Information</h3>
                <p>If you purchase a premium subscription, billing information is required. We use third-party payment processors (such as Stripe) to handle all transactions securely. Vera does not store complete credit card numbers, CVV codes, or full financial data on our servers. We only retain the transaction ID, subscription status, and billing history.</p>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">3. Automatically Collected Data</h2>
              <div className="space-y-4">
                <p>When you access our platform, our servers automatically record certain technical data. This information helps us ensure the security of the platform and understand how users navigate the Service.</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong>Device and Connection Data:</strong> We collect your IP address, browser type, browser version, operating system, and unique device identifiers.</li>
                  <li><strong>Usage Analytics:</strong> We track the pages of our Service that you visit, the time and date of your visit, the time spent on those pages, and interactions with specific features (like the "Scan" button).</li>
                  <li><strong>Log Data:</strong> In the event of an application error, we collect log data regarding performance metrics, crash reports, and system security flags to troubleshoot the issue.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">4. How We Use Your Information</h2>
              <div className="space-y-4">
                <p>Vera uses the collected data for various indispensable purposes:</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong>Providing the Service:</strong> To operate the Vera Risk Engine™, parse your documents, and generate accurate risk reports and plain-English summaries.</li>
                  <li><strong>Account Management:</strong> To maintain your account securely, authenticate your login, and manage your subscription and billing.</li>
                  <li><strong>Customer Support:</strong> To respond to your inquiries, troubleshoot technical issues, and provide assistance when requested.</li>
                  <li><strong>Security and Fraud Prevention:</strong> To monitor for unusual activity, detect potential security breaches, and enforce our Acceptable Use Policy.</li>
                  <li><strong>Service Improvement:</strong> To analyze usage trends and infrastructure load to optimize the speed, reliability, and design of the platform.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">5. How Vera Processes Contracts</h2>
              <div className="space-y-4">
                <p>Because we handle highly sensitive legal documents, we want to be completely transparent about our processing pipeline. When you upload a document:</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li>The document is securely transmitted via encrypted TLS/SSL channels to our isolated processing servers.</li>
                  <li>The text is extracted and fed into the proprietary Vera Risk Engine™ and our trusted AI infrastructure providers for mathematical risk scoring and clause analysis.</li>
                  <li>The analysis is fully automated. No human employee at Vera manually reads or reviews your confidential contracts unless you explicitly request technical support for a specific document issue.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">6. Strict Data Retention Policy</h2>
              <div className="space-y-4">
                <p>We do not hoard your data. Our retention protocols are designed to minimize risk:</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong>Raw Uploaded Contracts:</strong> The original PDF files and pasted raw text are temporarily processed in memory. We actively delete the raw source files from our processing servers immediately after the analysis report is successfully generated. We do not maintain a permanent archive of your raw documents.</li>
                  <li><strong>Generated Reports:</strong> The resulting risk reports, risk scores, and extracted clause summaries are saved to our encrypted database so you can access them later via your user Dashboard. You may delete these reports manually at any time.</li>
                  <li><strong>Account Data:</strong> If you choose to terminate and delete your account, we will permanently purge all your personal information, user metadata, and historical reports from our active databases within 30 days.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">7. Third-Party Sharing and Infrastructure</h2>
              <div className="space-y-4">
                <p>Vera does not sell, rent, or trade your personal information or uploaded documents to data brokers or advertising networks. We only share data with trusted third parties necessary to operate the Service:</p>
                <h3 className="text-xl font-semibold text-foreground mt-6">7.1. Service Providers</h3>
                <p>We utilize industry-leading cloud infrastructure providers (such as Vercel, Firebase, and Google Cloud) to host the application, securely store the generated reports, and manage user authentication. We use Stripe for payment processing. These providers are bound by rigorous confidentiality and data protection agreements.</p>
                
                <h3 className="text-xl font-semibold text-foreground mt-6">7.2. Legal Compliance</h3>
                <p>We may disclose your information if we are required to do so by law, such as to comply with a valid subpoena, binding court order, or formal request from law enforcement authorities.</p>
                
                <h3 className="text-xl font-semibold text-foreground mt-6">7.3. Business Transfers</h3>
                <p>In the event that Vera is involved in a merger, acquisition, bankruptcy, or sale of assets, user information may be transferred as part of that transaction. We will notify users via email or a prominent notice on our website before personal data is transferred and becomes subject to a different Privacy Policy.</p>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">8. Security Measures</h2>
              <div className="space-y-4">
                <p>We implement robust technical and organizational measures to protect your data:</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong>Encryption:</strong> All data transmitted between your browser and our servers is encrypted using modern TLS/SSL protocols. Data at rest in our databases is encrypted using AES-256 standards.</li>
                  <li><strong>Access Controls:</strong> Access to our production databases and AI processing environments is strictly limited to authorized engineering personnel via multi-factor authentication (MFA) and secure VPNs.</li>
                </ul>
                <p>While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security. No method of transmission over the Internet, or method of electronic storage, is 100% secure.</p>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">9. Your Privacy Rights</h2>
              <div className="space-y-4">
                <p>Depending on your jurisdiction (such as the GDPR in Europe or the CCPA in California), you may have specific rights regarding your personal data. Vera extends these core rights to all users globally:</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong>The Right to Access:</strong> You can request a copy of the personal data we hold about you.</li>
                  <li><strong>The Right to Rectification:</strong> You can request that we correct any information you believe is inaccurate or incomplete.</li>
                  <li><strong>The Right to Erasure ("Right to be Forgotten"):</strong> You can request that we erase your personal data and account entirely.</li>
                  <li><strong>The Right to Data Portability:</strong> You can request that we transfer the data we have collected to another organization, or directly to you, under certain conditions.</li>
                </ul>
                <p>To exercise any of these rights, please contact us at <a href="mailto:privacy@verahq.xyz" className="text-primary hover:underline">privacy@verahq.xyz</a>. We will respond to your request within 30 days.</p>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">10. Cookies and Tracking</h2>
              <div className="space-y-4">
                <p>Vera uses cookies and similar tracking technologies to track activity on our Service and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier.</p>
                <p>We use <strong>Essential Cookies</strong> strictly necessary to authenticate users, prevent fraudulent use of user accounts, and maintain secure sessions. We may also use <strong>Analytics Cookies</strong> to understand how users interact with the platform. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent, but some portions of the Service may not function properly without them.</p>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">11. Changes to this Privacy Policy</h2>
              <div className="space-y-4">
                <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Effective Date" at the top. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>
              </div>
            </section>

            <hr className="border-border my-16" />

            <div className="space-y-8">
              <section className="bg-card p-8 rounded-2xl border border-border">
                <h3 className="text-xl font-bold mb-4 text-foreground">Data Security & Confidentiality</h3>
                <p className="leading-relaxed">Because Vera processes legal agreements, we treat every uploaded contract as strictly confidential. Access to the production database is heavily restricted. Your documents are encrypted during transmission and securely processed in isolated memory environments to generate your report.</p>
              </section>

              <section className="bg-card p-8 rounded-2xl border border-border">
                <h3 className="text-xl font-bold mb-4 text-foreground">AI Processing Disclosure</h3>
                <p className="leading-relaxed">Vera utilizes advanced machine-learning models and automated systems to analyze documents. By uploading a document, you acknowledge that it is being read and processed by an AI algorithm (the Vera Risk Engine™). We explicitly <strong>do not</strong> permit our AI infrastructure providers (such as OpenAI or DeepSeek) to use your confidential documents to train, fine-tune, or improve their foundational public models.</p>
              </section>

              <section className="bg-card p-8 rounded-2xl border border-primary/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Legal Disclaimer
                </h3>
                <p className="leading-relaxed">Vera is an analytical tool designed to assist in contract review. <strong>Vera is not a law firm.</strong> We do not provide legal advice, legal opinions, or representation. Using our service does not create an attorney-client relationship. The AI-generated outputs may be imperfect and should not be used as a substitute for professional counsel from a licensed attorney.</p>
              </section>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground bg-background">
        <p>© {new Date().getFullYear()} Vera Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}