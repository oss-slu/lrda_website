"use client";
import React from "react";
import { useReveal, motionVariants } from "@/app/lib/utils/motion";

export default function AboutIntro() {
  const { ref, isVisible } = useReveal<HTMLDivElement>();
  return (
    <section id="aboutSection" ref={ref} className="w-full py-14 sm:py-20 relative overflow-hidden" data-reveal={isVisible}>
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-bl from-slate-50 via-white to-blue-100/30"></div>
      <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-blue-400/30 to-blue-600/20 rounded-full blur-3xl"></div>

      <div className="relative z-10 mx-auto max-w-6xl px-4">
      {/* Header section */}
      <div className={`text-center mb-20 `}>
        <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 mb-6">
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-blue-600">ABOUT THE PLATFORM</span>
        </h2>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Building the Where's Religion platform with cutting-edge technology and innovative design
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        {/* Mission Statement Highlight */}
        <div
          className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 p-6 sm:p-8 rounded-r-lg ${motionVariants.fadeInUp}`}
          data-reveal={isVisible}
        >
          <p className="text-lg sm:text-xl leading-relaxed text-slate-800 italic">
            "Advancing the study of lived religion through rigorous scholarly methods that account for embodied experiences, improvised
            practices, material cultures, and shared spaces."
          </p>
        </div>

        {/* Main Description */}
        <div className={`mt-12 grid md:grid-cols-2 gap-8 items-start ${motionVariants.fadeInUp}`} data-reveal={isVisible}>
          <div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Our Platform</h3>
            <p className="text-base sm:text-lg leading-7 text-slate-700">
              Where's Religion? is an open-source application developed by humanities faculty and IT professionals at Saint Louis University
              that supports in-person research, remote data entry, media sharing, and mapping. The app is designed to facilitate a more
              robust public understanding of religion through rigorous scholarly methods.
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">Our Approach</h3>
            <p className="text-base sm:text-lg leading-7 text-slate-700">
              Through a research methodology that moves beyond analysis of sacred texts, creeds, and official teachings, Where's Religion?
              provides a platform to diversify the data we study and to advance the study of religion we all encounter in everyday life.
            </p>
          </div>
        </div>

        {/* Funding Stats */}
        <div className={`mt-20 relative ${motionVariants.fadeInUp}`} data-reveal={isVisible}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-3xl blur-2xl opacity-30" />
          <div className="relative bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-3xl p-10 sm:p-12 shadow-md border border-slate-200">
            <div className="text-center mb-10">
              <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">Support & Recognition</h3>
              <p className="text-slate-600">Funded by the Henry Luce Foundation</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-8 mb-10">
              <div className="text-center group">
                <div className="inline-block p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl border border-slate-100 backdrop-blur-sm mb-4 group-hover:scale-[1.01] transition-transform duration-300">
                  <div className="text-5xl sm:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
                    $870K
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-900 mb-1">Total Funding</div>
                <div className="text-xs text-slate-500">Henry Luce Foundation</div>
              </div>

              <div className="text-center group">
                <div className="inline-block p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-slate-100 backdrop-blur-sm mb-4 group-hover:scale-[1.01] transition-transform duration-300">
                  <div className="text-5xl sm:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-500">
                    2018
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-900 mb-1">Initial Award</div>
                <div className="text-xs text-slate-500">$400,000</div>
              </div>

              <div className="text-center group">
                <div className="inline-block p-6 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-2xl border border-slate-100 backdrop-blur-sm mb-4 group-hover:scale-[1.01] transition-transform duration-300">
                  <div className="text-5xl sm:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500">
                    2022
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-900 mb-1">Follow-up Award</div>
                <div className="text-xs text-slate-500">$470,000</div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-200">
              <p className="text-sm text-slate-700 leading-relaxed text-center max-w-4xl mx-auto">
                <span className="font-bold text-slate-900">Institutional Support:</span> College of Arts & Sciences · Office for the Vice
                President for Research · Research Computing Group · Open Source with SLU · Walter J. Ong, S.J., Center for Digital
                Humanities · CREST Research Center
              </p>
            </div>
          </div>
        </div>

        {/* Center Connection */}
        <div className={`mt-16 text-center ${motionVariants.fadeInUp}`} data-reveal={isVisible}>
          <div className="inline-block bg-gradient-to-r from-blue-50 via-slate-50 to-blue-100/50 border-2 border-blue-200 rounded-2xl px-8 py-6 shadow-md">
            <p className="text-lg sm:text-xl text-slate-700">
              A keystone outcome of the{" "}
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700">
                Center on Lived Religion
              </span>{" "}
              at Saint Louis University
            </p>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
