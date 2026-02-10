"use client";

import { Sparkles, Hammer, Clock, Rocket } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

interface ComingSoonProps {
    category: string;
}

export function ComingSoon({ category }: ComingSoonProps) {
    const { theme } = useTheme();

    return (
        <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden py-24 px-6">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className={`absolute top-[10%] left-[10%] w-72 h-72 rounded-full blur-[120px] animate-pulse ${theme === 'dark' ? 'bg-lime-500/10' : 'bg-lime-500/20'
                    }`} />
                <div className={`absolute bottom-[10%] right-[10%] w-80 h-80 rounded-full blur-[140px] animate-pulse ${theme === 'dark' ? 'bg-green-500/5' : 'bg-green-500/15'
                    }`} style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto text-center space-y-12">
                {/* Animated Icon Cluster */}
                <div className="flex justify-center items-center gap-6 mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-lime-500/30 rounded-full blur-xl animate-ping" />
                        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-lime-500 to-green-600 flex items-center justify-center shadow-2xl shadow-lime-500/30">
                            <Hammer className="h-10 w-10 text-white animate-bounce" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-500/10 border border-lime-500/20 text-lime-600 dark:text-lime-400 text-xs md:text-sm font-black tracking-widest uppercase">
                        <Clock className="h-4 w-4" />
                        In the Works
                    </div>

                    <h2 className="text-5xl md:text-8xl font-black leading-none tracking-tight">
                        {category}&apos;s <span className="bg-gradient-to-r from-lime-600 to-green-600 dark:from-lime-400 dark:to-green-400 bg-clip-text text-transparent italic">Magic</span>
                    </h2>

                    <p className="text-xl md:text-3xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
                        We are handcrafting a magical collection for kids. The masterpieces are almost ready for their grand reveal.
                    </p>
                </div>

                {/* Feature Grid (Coming Soon Style) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
                    {[
                        { icon: <Sparkles className="h-6 w-6" />, title: "Themed Adventures", desc: "Superheroes, royalty, and mythical beasts." },
                        { icon: <Rocket className="h-6 w-6" />, title: "Premium Comfort", desc: "Crafted with child-friendly materials." },
                        { icon: <Hammer className="h-6 w-6" />, title: "Custom Fit", desc: "Bespoke options for growing legends." }
                    ].map((feature, idx) => (
                        <div key={idx} className="p-8 rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-lime-500 transition-all duration-500">
                            <div className="text-lime-600 dark:text-lime-400 mb-4 flex justify-center">{feature.icon}</div>
                            <h3 className="text-lg font-black mb-2">{feature.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Call to Action */}
                <div className="pt-8">
                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Stay Tuned</p>
                    <div className="w-1.5 h-12 bg-lime-500 mx-auto rounded-full animate-bounce" />
                </div>
            </div>
        </section>
    );
}
