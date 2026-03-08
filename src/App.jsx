import './styles/variables.css';
import { ThemeProvider } from './context/ThemeContext';
import { WardrobeProvider } from './context/WardrobeContext';
import Layout from './components/Layout/Layout';

function App() {
  return (
    <ThemeProvider>
      <WardrobeProvider>
        <Layout />
      </WardrobeProvider>
    </ThemeProvider>
  );
}

export default App;
