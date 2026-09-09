import { Link } from 'react-router-dom';
import { 
  Search, Target, FileText, Mail, BarChart3, Zap, 
  CheckCircle2, ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const features = [
    {
      icon: Search,
      title: 'Multi-Platform Job Search',
      description: 'Searches Internshala, LinkedIn, Naukri, Indeed & Glassdoor daily for the best opportunities.'
    },
    {
      icon: Target,
      title: 'AI Match Scoring',
      description: 'Get 0-100% match score per job, highlighting exactly what skills you need.'
    },
    {
      icon: FileText,
      title: 'Smart Resume Optimization',
      description: 'AI tailors your resume to each job description automatically.'
    },
    {
      icon: Mail,
      title: 'Cover Letter Generator',
      description: 'Personalized, compelling cover letters generated in seconds.'
    },
    {
      icon: Zap,
      title: 'Instant Notifications',
      description: 'Get alerts as soon as new jobs matching your profile are posted.'
    },
    {
      icon: BarChart3,
      title: 'Application Tracker',
      description: 'Track all your applications in one organized dashboard.'
    },
  ];

  const testimonials = [
    {
      name: 'Rahul Sharma',
      role: 'IIT Delhi Student',
      quote: 'Got an internship at a top startup in just 2 weeks! The AI match scoring is incredible.',
      avatar: 'RS'
    },
    {
      name: 'Priya Patel',
      role: 'Tier-2 College Fresher',
      quote: 'JobCopilot helped me land my first job at an MNC. The resume tailoring was a game-changer.',
      avatar: 'PP'
    },
    {
      name: 'Amit Kumar',
      role: 'Working Professional',
      quote: 'Switched jobs with 50% higher CTC in 1 month. The application tracker kept me organized.',
      avatar: 'AK'
    },
  ];

  const pricingPlans = [
    {
      name: 'Free',
      price: '₹0',
      period: '/month',
      features: [
        '10 jobs per day',
        '3 AI resumes per month',
        'Basic match scoring',
        'Email support'
      ],
      popular: false
    },
    {
      name: 'Pro',
      price: '₹499',
      period: '/month',
      features: [
        'Unlimited jobs daily',
        'Unlimited AI resumes',
        'AI cover letters',
        'Priority support'
      ],
      popular: true
    },
    {
      name: 'Premium',
      price: '₹999',
      period: '/month',
      features: [
        'Everything in Pro',
        'One-click apply automation',
        'Interview preparation',
        'LinkedIn profile optimization',
        'Dedicated support'
      ],
      popular: false
    },
  ];

  const faqs = [
    { question: 'How does JobCopilot find the best jobs for me?', answer: 'Our AI compares your profile with job descriptions and ranks opportunities by fit, role, and location.' },
    { question: 'Can I use my existing resume?', answer: 'Yes! Upload your master resume and JobCopilot creates optimized versions for every target role.' },
    { question: 'Does this support remote job searches?', answer: 'Absolutely! Filter by remote, hybrid, or on-site opportunities and keep your search focused.' },
    { question: 'Is there a free trial available?', answer: 'Yes! You can use our Free plan forever, and upgrade when you need more features.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
            JobCopilot
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-600 hover:text-slate-900 font-medium">Features</a>
            <a href="#pricing" className="text-slate-600 hover:text-slate-900 font-medium">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost">Login</Link>
            <Link to="/register" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-semibold">AI Career Copilot</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight max-w-4xl mx-auto">
            Land Better Jobs with Your Personal AI Career Assistant
          </h1>

          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Find jobs, optimize resumes, generate cover letters, and track applications in one premium workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/register" className="btn-primary flex items-center gap-2">
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="btn-secondary">
              Watch Demo
            </button>
          </div>

          {/* Trust Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 pb-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-slate-900">10,000+</p>
              <p className="text-slate-600">Active Job Seekers</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-slate-900">1,200+</p>
              <p className="text-slate-600">Interviews Scheduled</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-slate-900">98%</p>
              <p className="text-slate-600">Resume Match Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Powerful Features</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Everything you need to get hired faster</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="card-hover p-6"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Simple, Transparent Pricing</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Choose the plan that fits your career goals</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={`
                  relative card-soft p-8 ${
                    plan.popular ? 'border-primary shadow-lg shadow-primary/10' : ''
                  }
                `}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-slate-600">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`block w-full text-center py-2.5 rounded-lg font-semibold transition-all ${
                    plan.popular ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">What Our Users Say</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Real success stories from real users</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="card-soft p-6">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(n => <Star key={n} className="w-5 h-5 text-warning fill-warning" />)}
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed">{testimonial.quote}</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{testimonial.name}</p>
                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Frequently Asked Questions</h2>
            <p className="text-slate-600">Everything you need to know</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="card-soft p-6">
                <h3 className="font-bold text-slate-900 mb-2">{faq.question}</h3>
                <p className="text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-xl font-bold bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
              JobCopilot
            </div>
            <div className="flex gap-6 text-slate-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-400">
            <p>© {new Date().getFullYear()} JobCopilot. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
