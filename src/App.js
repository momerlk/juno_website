import logo from './logo.svg';
import './App.css';
import GlobalStyles from './styles/GlobalStyles';
import { ThemeProvider } from 'styled-components';
import { dark, light } from './styles/Themes';
import Navigation from './components/Navigation';
import Home from './components/sections/Home';
import About from './components/sections/About';
import Roadmap from './components/sections/Roadmap';
import Showcase from './components/sections/Showcase';
import Faq from './components/sections/Faq';
import Team from './components/sections/Team';
import Footer from './components/Footer';

function App() {
  return (
    <>
    <GlobalStyles />
    <ThemeProvider theme={dark}>
      <Navigation />
      <Home />
      <About />
      <Roadmap />
      <Showcase />
      <Faq />
      <Team />
      <Footer />
    </ThemeProvider>
    </>
  );
}

export default App;
