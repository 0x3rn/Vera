import Link from "next/link";

export const metadata = {
  title: "Terms of Service | Vera",
  description: "Terms of Service for Vera Legal Document Risk Engine.",
};

export default function TermsOfService() {
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
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight text-foreground">Terms of Service</h1>
            <p className="text-lg text-muted-foreground">Effective Date: {lastUpdated}</p>
          </div>

          <div className="space-y-12 text-muted-foreground leading-loose text-base sm:text-lg">
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">1. Introduction and Acceptance of Terms</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground mt-6">1.1. Welcome to Vera</h3>
                <p>Welcome to Vera ("Vera," "we," "us," or "our"). These Terms of Service ("Terms") constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and Vera Inc., concerning your access to and use of our website as well as any other media form, media channel, mobile website, or mobile application related, linked, or otherwise connected thereto (collectively, the "Service").</p>
                
                <h3 className="text-xl font-semibold text-foreground mt-6">1.2. Acceptance of Terms</h3>
                <p>By accessing, browsing, creating an account, or using the Service in any way, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree with all of these Terms, then you are expressly prohibited from using the Service and you must discontinue use immediately. Supplemental terms and conditions or documents that may be posted on the Service from time to time are hereby expressly incorporated herein by reference.</p>
                
                <h3 className="text-xl font-semibold text-foreground mt-6">1.3. Modifications to the Terms</h3>
                <p>We reserve the right, in our sole and absolute discretion, to make changes or modifications to these Terms at any time and for any reason. We will alert you about any changes by updating the "Effective Date" of these Terms, and you waive any right to receive specific notice of each such change. It is your responsibility to periodically review these Terms to stay informed of updates. You will be subject to, and will be deemed to have been made aware of and to have accepted, the changes in any revised Terms by your continued use of the Service after the date such revised Terms are posted.</p>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">2. Eligibility and Account Registration</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground mt-6">2.1. Minimum Age Requirement</h3>
                <p>The Service is intended for users who are at least eighteen (18) years old. Persons under the age of 18 are not permitted to use or register for the Service. By using the Service, you represent and warrant that you are at least 18 years of age and possess the legal capacity and authority to enter into these Terms.</p>
                
                <h3 className="text-xl font-semibold text-foreground mt-6">2.2. User Authority to Enter Agreements</h3>
                <p>If you are using the Service on behalf of a company, business, or other legal entity, you represent and warrant that you have the authority to bind such entity to these Terms, in which case the terms "you" and "your" shall refer to such entity.</p>
                
                <h3 className="text-xl font-semibold text-foreground mt-6">2.3. Account Creation and Security</h3>
                <p>You may be required to register with the Service to access certain features. You agree to keep your password confidential and will be responsible for all use of your account and password. You must provide accurate, current, and complete information during the registration process. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.</p>
                <p>You are entirely responsible for maintaining the security of your account. You agree to notify us immediately of any unauthorized use of your account or any other breach of security. Vera will not be liable for any losses or damages arising from your failure to comply with this security obligation.</p>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">3. Description of Services</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground mt-6">3.1. Core Functionality</h3>
                <p>Vera provides a sophisticated software-as-a-service (SaaS) platform that allows users to upload, paste, or otherwise transmit legal documents, contracts, agreements, and policies. Upon submission, the Vera Risk Engine™ processes the text using advanced natural language processing and artificial intelligence to identify potential risks, extract key metadata, and generate plain-English summaries.</p>
                
                <h3 className="text-xl font-semibold text-foreground mt-6">3.2. Evolution of the Service</h3>
                <p>We are constantly innovating and changing our Service to provide the best possible experience for our users. You acknowledge and agree that the form and nature of the Service which Vera provides may change from time to time without prior notice to you. You may stop using the Service at any time.</p>

                <div className="bg-card border border-amber-500/50 p-6 sm:p-8 rounded-2xl my-8 relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
                  <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
                    <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Critical Disclaimer: No Legal Advice
                  </h3>
                  <p className="text-foreground leading-relaxed mb-4 font-medium">Vera is a software development company providing analytical tools. We are not a law firm. We do not provide legal advice, legal representation, legal opinions, or legal strategy.</p>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>The use of the Service does not create an attorney-client relationship between you and Vera.</li>
                    <li>The summaries, risk scores, and outputs generated by the Vera Risk Engine™ are for informational and educational purposes only.</li>
                    <li>You should not rely on the Service as an alternative to seeking legal counsel from a qualified, licensed attorney in your jurisdiction.</li>
                    <li>We cannot guarantee the accuracy, completeness, or legal validity of any analysis provided by the Service.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">4. Acceptable Use Policy</h2>
              <div className="space-y-4">
                <p>As a condition of your use of the Service, you agree not to use the Service for any purpose that is unlawful or prohibited by these Terms. You are solely responsible for all of your activity in connection with the Service.</p>
                <h3 className="text-xl font-semibold text-foreground mt-6">4.1. Prohibited Conduct</h3>
                <p>You agree that you will not, under any circumstances:</p>
                <ul className="list-disc pl-6 space-y-3">
                  <li>Systematically retrieve data or other content from the Service to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</li>
                  <li>Circumvent, disable, or otherwise interfere with security-related features of the Service, including features that prevent or restrict the use or copying of any content.</li>
                  <li>Engage in unauthorized framing of or linking to the Service.</li>
                  <li>Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.</li>
                  <li>Make improper use of our support services or submit false reports of abuse or misconduct.</li>
                  <li>Use the Service as part of any effort to compete with us or otherwise use the Service and/or the Content for any revenue-generating endeavor or commercial enterprise.</li>
                  <li>Decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Service, specifically including the Vera Risk Engine™ and its underlying algorithms.</li>
                  <li>Upload or transmit (or attempt to upload or to transmit) viruses, Trojan horses, or other material that interferes with any party's uninterrupted use and enjoyment of the Service.</li>
                  <li>Attempt to bypass any measures of the Service designed to prevent or restrict access to the Service, including circumventing payment gateways or exploiting free trial mechanisms.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">5. User Content and Ownership</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground mt-6">5.1. Your Ownership Rights</h3>
                <p>You retain all ownership rights to the documents, text, and files you upload, transmit, or otherwise provide to the Service ("User Content"). Vera claims no intellectual property rights over the material you provide to the Service.</p>
                
                <h3 className="text-xl font-semibold text-foreground mt-6">5.2. Limited License to Process</h3>
                <p>By uploading or submitting User Content to the Service, you grant Vera a limited, worldwide, non-exclusive, royalty-free license to parse, process, copy, and temporarily store such User Content strictly for the purpose of analyzing the document, generating risk reports, and providing the features of the Service to you. This license does not grant Vera the right to sell, publish, or publicly distribute your confidential documents.</p>
                
                <h3 className="text-xl font-semibold text-foreground mt-6">5.3. Warranties Regarding User Content</h3>
                <p>You represent and warrant that: (1) you are the creator and owner of or have the necessary licenses, rights, consents, and permissions to use and to authorize us to use your User Content in the manner contemplated by the Service and these Terms; and (2) your User Content does not and will not infringe, violate, or misappropriate any third-party right, including any copyright, trademark, patent, trade secret, moral right, privacy right, right of publicity, or any other intellectual property or proprietary right.</p>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">6. Vera's Intellectual Property</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground mt-6">6.1. Proprietary Rights</h3>
                <p>Unless otherwise indicated, the Service is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Service (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws and various other intellectual property rights and unfair competition laws of the United States, foreign jurisdictions, and international conventions.</p>
                
                <h3 className="text-xl font-semibold text-foreground mt-6">6.2. Restrictions</h3>
                <p>The Content and the Marks are provided on the Service "AS IS" for your information and personal use only. Except as expressly provided in these Terms, no part of the Service and no Content or Marks may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our express prior written permission.</p>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">7. Payment Terms and Subscriptions</h2>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-foreground mt-6">7.1. Fees and Billing</h3>
                <p>Certain aspects of the Service are provided for a fee. You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Service. You further agree to promptly update account and payment information, including email address, payment method, and payment card expiration date, so that we can complete your transactions and contact you as needed. We bill you through an online billing account for purchases made via the Service. Sales tax will be added to the price of purchases as deemed required by us. We may change prices at any time.</p>
                
                <h3 className="text-xl font-semibold text-foreground mt-6">7.2. Subscription Renewals</h3>
                <p>If you purchase a subscription to the Service (such as the Pro tier), your subscription will automatically renew at the end of each billing cycle (e.g., monthly or annually) unless you cancel your subscription through your account management page prior to the renewal date. By maintaining an active subscription, you authorize us (or our third-party payment processors) to charge your payment method on a recurring basis.</p>
                
                <h3 className="text-xl font-semibold text-foreground mt-6">7.3. Refunds</h3>
                <p>All purchases are non-refundable. You can cancel your subscription at any time, and you will continue to have access to the premium features of the Service through the end of your current paid billing period. We do not provide refunds or credits for any partial-month subscription periods or unused scans.</p>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">8. Disclaimer of Warranties and Accuracy</h2>
              <div className="space-y-4">
                <div className="bg-card border border-red-500/50 p-6 sm:p-8 rounded-2xl my-8 relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
                  <h3 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Service Provided "As Is"
                  </h3>
                  <p className="text-foreground leading-relaxed">
                    THE SERVICE IS PROVIDED ON AN "AS-IS" AND "AS-AVAILABLE" BASIS. YOU AGREE THAT YOUR USE OF THE SERVICE WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, VERA DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SERVICE AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                  </p>
                  <p className="text-foreground leading-relaxed mt-4">
                    WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR COMPLETENESS OF THE VERA RISK ENGINE'S ANALYSIS, ALGORITHMIC OUTPUTS, OR RISK SCORES. THE AI MAY PRODUCE HALLUCINATIONS, MISINTERPRET CLAUSES, OR FAIL TO DETECT CRITICAL LIABILITIES. YOU ASSUME FULL RESPONSIBILITY FOR ANY CONSEQUENCES ARISING FROM CONTRACTS YOU SIGN.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">9. Limitation of Liability</h2>
              <div className="space-y-4">
                <p className="uppercase tracking-wide font-medium text-foreground">IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, LEGAL FEES, CONTRACTUAL DISPUTES, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
                <p>If you enter into a legal agreement based on the analysis provided by Vera, and that agreement results in financial loss, litigation, or regulatory action against you, Vera shall bear absolute zero liability. Your sole recourse for dissatisfaction with the Service is to stop using the Service.</p>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">10. Indemnification</h2>
              <div className="space-y-4">
                <p>You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all of our respective officers, agents, partners, and employees, from and against any loss, damage, liability, claim, or demand, including reasonable attorneys' fees and expenses, made by any third party due to or arising out of:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your use of the Service.</li>
                  <li>A breach of these Terms.</li>
                  <li>Any breach of your representations and warranties set forth in these Terms.</li>
                  <li>Your violation of the rights of a third party, including but not nil to intellectual property rights.</li>
                  <li>Any overt harmful act toward any other user of the Service.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">11. Term and Termination</h2>
              <div className="space-y-4">
                <p>These Terms shall remain in full force and effect while you use the Service. WITHOUT LIMITING ANY OTHER PROVISION OF THESE TERMS, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SERVICE (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON, INCLUDING WITHOUT LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANTY, OR COVENANT CONTAINED IN THESE TERMS OR OF ANY APPLICABLE LAW OR REGULATION.</p>
                <p>We may terminate your use or participation in the Service or delete your account and any content or information that you posted at any time, without warning, in our sole discretion.</p>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">12. Governing Law and Dispute Resolution</h2>
              <div className="space-y-4">
                <p>These Terms and your use of the Service are governed by and construed in accordance with the laws of the State of Delaware, United States, applicable to agreements made and to be entirely performed within the State of Delaware, without regard to its conflict of law principles.</p>
                <p>Any legal action of whatever nature brought by either you or us shall be commenced or prosecuted in the state and federal courts located in Delaware, and the parties hereby consent to, and waive all defenses of lack of personal jurisdiction and forum non conveniens with respect to venue and jurisdiction in such state and federal courts.</p>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">13. Miscellaneous</h2>
              <div className="space-y-4">
                <p>These Terms and any policies or operating rules posted by us on the Service constitute the entire agreement and understanding between you and us. Our failure to exercise or enforce any right or provision of these Terms shall not operate as a waiver of such right or provision. These Terms operate to the fullest extent permissible by law. We may assign any or all of our rights and obligations to others at any time. We shall not be responsible or liable for any loss, damage, delay, or failure to act caused by any cause beyond our reasonable control.</p>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">14. Contact Information</h2>
              <div className="space-y-4">
                <p>In order to resolve a complaint regarding the Service or to receive further information regarding use of the Service, please contact our legal team at:</p>
                <p className="font-medium text-foreground">Vera Legal Department<br />
                <a href="mailto:legal@verahq.xyz" className="text-primary hover:underline">legal@verahq.xyz</a></p>
              </div>
            </section>

          </div>
        </div>
      </main>
      
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground bg-background">
        <p>© {new Date().getFullYear()} Vera Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}