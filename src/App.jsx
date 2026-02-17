import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import Footer from './components/Footer';
import Auth from './components/Auth';
import TodosSection from './components/TodosSection';
import './App.css';
import './css/Todos.css';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
