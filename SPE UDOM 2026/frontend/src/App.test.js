import { render, screen } from '@testing-library/react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';

test('renders the home page and main navigation', () => {
  render(
    <AuthProvider>
      <Navbar />
      <Home />
    </AuthProvider>
  );

  expect(
    screen.getByRole('heading', { name: /spe udom student chapter/i })
  ).toBeInTheDocument();
  expect(screen.getByText(/^spe udom$/i)).toBeInTheDocument();
  expect(screen.getByText(/^gu$/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /about spe udom chapter/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /leadership/i })).toBeInTheDocument();
});
