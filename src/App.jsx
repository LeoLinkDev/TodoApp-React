import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Auth from './features/auth/Auth';
import TasksSection from './features/dashboard/TaskSection';
import './styles/App.css';

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
          <TasksSection />
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
