"use client"

import { useSearchParams } from "next/navigation"
import { Check, Shield, CreditCard, Loader2 } from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import Link from "next/link"

function BillingContent() {
    const searchParams = useSearchParams()
    const plan = searchParams.get("plan") || "pow-pro"

    // safe map for plan details
    const planDetails: Record<string, { name: string; price: string; features: string[] }> = {
        "free": {
            name: "Free",
            price: "$0",
            features: ["Basic moderation", "5 Forms", "Community Support"]
        },
        "pow-pro": {
            name: "POW Pro",
            price: "$5.99/mo",
            features: ["Raid Detection", "25 Forms", "CSV Exports", "Priority Support"]
        },
        "pow-max": {
            name: "POW Max",
            price: "$14.99/mo",
            features: ["Unlimited Everything", "White-label Bot", "Custom Branding", "dedicated Support"]
        }
    }

    const selectedPlan = planDetails[plan] || planDetails["pow-pro"]
    const [loading, setLoading] = useState(false)

    const handleSubscribe = () => {
        setLoading(true)
        // Simulate processing
        setTimeout(() => {
            // In a real app, this would redirect to Stripe Checkout
            alert("Payment integration is currently in sandbox mode. Please contact administration to upgrade.")
            setLoading(false)
        }, 1500)
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
            <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 bg-[#111] rounded-2xl border border-[#222] overflow-hidden">
                {/* Left: Summary */}
                <div className="p-8 flex flex-col justify-between bg-zinc-900/50">
                    <div>
                        <div className="flex items-center gap-2 text-zinc-400 mb-6">
                            <Shield className="h-5 w-5" />
                            <span>Project Overwatch Secure Checkout</span>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Subscribe to {selectedPlan.name}</h1>
                        <p className="text-4xl font-bold text-blue-400 mb-6">{selectedPlan.price}</p>

                        <ul className="space-y-3">
                            {selectedPlan.features.map((f, i) => (
                                <li key={i} className="flex items-center gap-2 text-zinc-300">
                                    <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <Check className="h-3 w-3 text-blue-400" />
                                    </div>
                                    {f}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10 text-xs text-zinc-500">
                        <p>By subscribing, you agree to our Terms of Service and Privacy Policy.</p>
                    </div>
                </div>

                {/* Right: Payment Method (Mock) */}
                <div className="p-8 flex flex-col justify-center">
                    <h2 className="text-xl font-bold mb-6">Payment Method</h2>

                    <div className="space-y-4 mb-8">
                        <div className="p-4 border border-blue-500/50 bg-blue-500/10 rounded-xl flex items-center gap-4 cursor-pointer">
                            <CreditCard className="h-6 w-6 text-blue-400" />
                            <div>
                                <p className="font-semibold text-white">Credit Card</p>
                                <p className="text-sm text-zinc-400">Powered by Stripe</p>
                            </div>
                            <div className="ml-auto h-4 w-4 rounded-full border-2 border-blue-500 bg-blue-500" />
                        </div>

                        <div className="p-4 border border-[#333] bg-[#1a1a1a] rounded-xl flex items-center gap-4 opacity-50 cursor-not-allowed">
                            <div className="h-6 w-6 rounded bg-zinc-700" /> {/* PayPal icon placeholder */}
                            <div>
                                <p className="font-semibold text-zinc-400">PayPal</p>
                                <p className="text-sm text-zinc-500">Currently unavailable</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSubscribe}
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                        {loading ? "Processing..." : `Pay ${selectedPlan.price}`}
                    </button>

                    <Link href="/pricing" className="mt-4 text-center text-sm text-zinc-500 hover:text-zinc-300">
                        Cancel and return
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default function BillingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>}>
            <BillingContent />
        </Suspense>
    )
}
