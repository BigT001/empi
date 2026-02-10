import { Navigation } from "../components/Navigation";
import { MobileHeader } from "../components/MobileHeader";
import { Footer } from "../components/Footer";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-white text-gray-900 flex flex-col">
            <Navigation />
            <MobileHeader />
            <main className="flex-1 max-w-4xl mx-auto px-6 py-12 md:py-24 mt-16">
                <h1 className="text-4xl font-extrabold mb-8 bg-gradient-to-r from-lime-600 to-green-600 bg-clip-text text-transparent">
                    Privacy Policy
                </h1>

                <div className="prose prose-lime max-w-none space-y-6 text-gray-700">
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                        <p>
                            Welcome to EMPI Costumes. We respect your privacy and are committed to protecting your personal data.
                            This privacy policy will inform you about how we look after your personal data when you visit our
                            website and tell you about your privacy rights and how the law protects you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Data We Collect</h2>
                        <p>
                            We may collect, use, store and transfer different kinds of personal data about you which we have
                            grouped together as follows:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                            <li><strong>Contact Data:</strong> includes billing address, delivery address, email address and telephone numbers.</li>
                            <li><strong>Financial Data:</strong> includes payment card details (processed securely via Paystack).</li>
                            <li><strong>Transaction Data:</strong> includes details about payments to and from you and other details of products and services you have purchased from us.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Data</h2>
                        <p>
                            We will only use your personal data when the law allows us to. Most commonly, we will use your
                            personal data in the following circumstances:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>To register you as a new customer.</li>
                            <li>To process and deliver your order.</li>
                            <li>To manage our relationship with you.</li>
                            <li>To enable you to partake in a prize draw, competition or complete a survey.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
                        <p>
                            We have put in place appropriate security measures to prevent your personal data from being
                            accidentally lost, used or accessed in an unauthorized way, altered or disclosed.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Contact Us</h2>
                        <p>
                            If you have any questions about this privacy policy or our privacy practices, please contact us at:
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
