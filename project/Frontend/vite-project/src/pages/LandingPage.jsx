import { Link } from 'react-router';

const LandingPage = () => {
  return (
    <div className="font-sans bg-gray-100 text-gray-800 min-h-screen">
      {/* Import Inter font via CDN */}
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white sticky top-0 z-20 shadow-lg">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-3xl font-bold tracking-tight">CodeVibin</div>
          <div className="space-x-8">
            <Link to="/home" className="text-lg hover:text-cyan-200 transition duration-300">Home</Link>
            <Link to="/login" className="text-lg hover:text-cyan-200 transition duration-300">Login</Link>
            <Link to="/signup" className="text-lg hover:text-cyan-200 transition duration-300">Sign Up</Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-cyan-100 py-20 overflow-hidden">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 animate-fade-in">
            Master DSA with CodeVibin
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-gray-700 animate-fade-in-up">
            Solve curated data structures and algorithms problems, compete globally, and ace your coding interviews.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/login"
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition transform hover:scale-105 animate-pulse"
            >
              Start Solving Now
            </Link>
            <Link
              to="/signup"
              className="inline-block bg-transparent border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-600 hover:text-white transition transform hover:scale-105"
            >
              Join Now
            </Link>
          </div>
        </div>
        {/* Background Illustration */}
        <div className="absolute bottom-0 left-0 w-full opacity-10">
          <img
            src="https://cdn.pixabay.com/photo/2017/08/07/14/02/code-2605559_1280.jpg"
            alt="Coding Illustration"
            className="w-full h-auto"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800 animate-fade-in">Why Choose CodeVibin?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl shadow-lg text-center transform transition duration-300 hover:scale-105 animate-fade-in-up delay-100">
              <svg className="w-12 h-12 mx-auto mb-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
              <h3 className="text-xl font-semibold mb-3">Handpicked Problems</h3>
              <p className="text-gray-600">Tackle curated DSA challenges from beginner to expert levels.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl shadow-lg text-center transform transition duration-300 hover:scale-105 animate-fade-in-up delay-200">
              <svg className="w-12 h-12 mx-auto mb-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
              </svg>
              <h3 className="text-xl font-semibold mb-3">Interactive Coding</h3>
              <p className="text-gray-600">Code in real-time with instant feedback and detailed solutions.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl shadow-lg text-center transform transition duration-300 hover:scale-105 animate-fade-in-up delay-300">
              <svg className="w-12 h-12 mx-auto mb-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              <h3 className="text-xl font-semibold mb-3">Compete & Grow</h3>
              <p className="text-gray-600">Join contests, climb the leaderboard, and showcase your skills.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-cyan-500 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6 text-white animate-fade-in">Ready to Excel in DSA?</h2>
          <p className="text-lg mb-8 text-white max-w-2xl mx-auto animate-fade-in-up">
            Join CodeVibin and start solving problems to become a coding pro today!
          </p>
          <Link
            to="/signup"
            className="inline-block bg-white text-blue-600 px-10 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition transform hover:scale-105 animate-pulse"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-800 text-white py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="mb-4 text-sm">© 2025 CodeVibin. All rights reserved.</p>
          <div className="flex justify-center space-x-6 mb-4">
            <a href="https://www.linkedin.com/in/abhi-jain-2a5716289" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-200 transition">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.024-3.037-1.85-3.037-1.85 0-2.133 1.446-2.133 2.94v5.666H9.356V9.136h3.413v1.537h.048c.475-.898 1.635-1.846 3.365-1.846 3.598 0 4.262 2.368 4.262 5.446v6.179zM5.337 7.599c-1.14 0-2.063-.928-2.063-2.063 0-1.135.923-2.063 2.063-2.063 1.135 0 2.063.928 2.063 2.063 0 1.135-.928 2.063-2.063 2.063zm1.777 12.853H3.56V9.136h3.554v11.316zM22.225 0H1.771C.792 0 0 .792 0 1.771v20.458C0 23.208.792 24 1.771 24h20.454c.979 0 1.771-.792 1.771-1.771V1.771C24 .792 23.208 0 22.225 0z"></path>
              </svg>
            </a>
            <a href="mailto:abhijain1722@gmail.com" className="hover:text-cyan-200 transition">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"></path>
              </svg>
            </a>
          </div>
          <div className="space-x-6 text-sm">
            <Link to="#" className="hover:text-cyan-200 transition">Privacy Policy</Link>
            <Link to="#" className="hover:text-cyan-200 transition">Terms of Service</Link>
            <a href="mailto:abhijain1722@gmail.com" className="hover:text-cyan-200 transition">Contact: abhijain1722@gmail.com</a>
          </div>
        </div>
      </footer>

      {/* Custom Tailwind Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 1s ease-out;
          }
          .animate-fade-in-up {
            animation: fadeInUp 1s ease-out;
          }
          .delay-100 { animation-delay: 100ms; }
          .delay-200 { animation-delay: 200ms; }
          .delay-300 { animation-delay: 300ms; }
        `}
      </style>
    </div>
  );
};

export default LandingPage;
