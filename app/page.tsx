import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Benefits } from "@/components/landing/benefits";
import { ContactForm } from "@/components/landing/contact-form";
import { FooterLanding } from "@/components/landing/footer-landing";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <Benefits />
      <ContactForm />
      <FooterLanding />
    </>
  );
}
