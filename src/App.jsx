import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import Footer from './components/Footer';
import Auth from './components/Auth';
import TodosSection from './components/TodosSection';
import './App.css';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="container">
        {!isAuthenticated ? (
          <section className="grid" aria-label="User access">
            <Auth />
          </section>
        ) : (
          <TodosSection />
        )}
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
