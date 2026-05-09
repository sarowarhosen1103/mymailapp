import Link from 'next/link';
import { ArrowRight, Mail, Zap, BarChart, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-indigo-500/30">
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Mail className="h-6 w-6 text-indigo-500" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">MailDash</span>
            </Link>
          </div>
          <div className="flex flex-1 justify-end items-center gap-4">
            <Link href="/login" className="text-sm font-semibold leading-6 text-slate-300 hover:text-white transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white/20 border border-white/10 transition-all backdrop-blur-md"
            >
              Sign up <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center relative isolate pt-14">
        {/* Decorative background */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="py-24 sm:py-32 lg:pb-40 w-full max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="hidden sm:mb-8 sm:flex sm:justify-center">
              <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-slate-400 ring-1 ring-white/10 hover:ring-white/20 transition-colors">
                Announcing our next-generation email APIs.{' '}
                <Link href="/signup" className="font-semibold text-indigo-400">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Read more <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              Emails made <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">beautiful</span> and trackable.
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              The modern email marketing and transactional platform built for developers and creators. Track opens, clicks, and scale effortlessly with our robust queues.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/signup"
                className="group rounded-full bg-indigo-500 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 transition-all flex items-center gap-2"
              >
                Get started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/login" className="text-sm font-semibold leading-6 text-slate-300 hover:text-white transition-colors">
                Live demo <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          
          <div className="mt-20 sm:mt-24 md:mx-auto md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: <Zap className="h-6 w-6 text-yellow-400" />,
                  title: 'Lightning Fast',
                  desc: 'Powered by BullMQ and Redis for instant delivery and intelligent retries.'
                },
                {
                  icon: <BarChart className="h-6 w-6 text-cyan-400" />,
                  title: 'Deep Analytics',
                  desc: 'Real-time open and click tracking with beautiful dashboard visualizations.'
                },
                {
                  icon: <Shield className="h-6 w-6 text-green-400" />,
                  title: 'Secure & Reliable',
                  desc: 'Bring your own Gmail SMTP or scale with enterprise providers securely.'
                }
              ].map((feature, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative background bottom */}
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
        </div>
      </main>
    </div>
  );
}
