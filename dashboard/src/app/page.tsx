import { LandingPage } from "@/components/landing-page"
import { isFeatureEnabled } from "@/lib/feature-flags"

export default async function Home() {
  const showPricing = await isFeatureEnabled('PRICING_PAGE')
  return <LandingPage showPricing={showPricing} />
}
