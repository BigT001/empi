import { Navigation } from "../components/Navigation";
import { MobileHeader } from "../components/MobileHeader";
import { Footer } from "../components/Footer";

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-white text-gray-900 flex flex-col">
            <Navigation />
            <MobileHeader />
            <main className="flex-1 max-w-4xl mx-auto px-6 py-12 md:py-24 mt-16">
                <h1 className="text-4xl font-extrabold mb-8 bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent">
                    Terms of Service
                </h1>

                <div className="prose prose-lime max-w-none space-y-6 text-gray-700">
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
                        <p>
                            By accessing or using EMPI Costumes website, you agree to be bound by these Terms of Service.
                            If you disagree with any part of the terms, you may not access the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Rental and Purchase Policy</h2>
                        <p>
                            EMPI Costumes provides both rental and purchase options for costumes.
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Rentals:</strong> All rented items must be returned in the same condition as received. Late fees may apply for overdue returns.</li>
                            <li><strong>Purchases:</strong> Once a purchase is finalized, refunds are only available in cases of manufacturing defects reported within 24 hours of delivery.</li>
                            <li><strong>Custom Orders:</strong> Custom-made costumes require a non-refundable deposit. Final delivery is subject to agreed timelines.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Payments</h2>
                        <p>
                            All payments are processed securely. We use Paystack for all online transactions. EMPI Costumes
                            does not store your full card details on our servers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Intellectual Property</h2>
                        <p>
                            The Service and its original content, features, and functionality are and will remain the
                            exclusive property of EMPI Costumes and its licensors.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Limitation of Liability</h2>
                        <p>
                            In no event shall EMPI Costumes, nor its directors, employees, partners, agents, suppliers,
                            or affiliates, be liable for any indirect, incidental, special, consequential or punitive
                            damages, including without limitation, loss of profits, data, use, goodwill, or other
                            intangible losses.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Governing Law</h2>
                        <p>
                            These Terms shall be governed and construed in accordance with the laws of Nigeria,
                            without regard to its conflict of law provisions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact Us</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at:
                            <br />
                            <a href="mailto:empicostumes@gmail.com" className="text-lime-600 font-semibold hover:underline">
                                empicostumes@gmail.com
                            </a>
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}
