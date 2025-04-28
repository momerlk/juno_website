import React, { useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import JunoApp from './components/JunoApp';
import JunoStudio from './components/JunoStudio';
import Pricing from './components/Pricing';
import Team from './components/Team';
import Mission from './components/Mission';
import Contact from './components/Contact';
import DownloadSection from './components/DownloadSection';
import Footer from './components/Footer';

function App() {
  useEffect(() => {
    // Update page title
    document.title = 'Juno - Swipe to Shop Fashion App';
    
    // If the title element has a data-default attribute, remove it
    const titleElement = document.querySelector('title');
    if (titleElement && titleElement.hasAttribute('data-default')) {
      titleElement.removeAttribute('data-default');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />
      <main>
        <Hero />
        <JunoApp />
        <Mission />
        <JunoStudio />
        <Pricing />
        <Team />
        <DownloadSection />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;