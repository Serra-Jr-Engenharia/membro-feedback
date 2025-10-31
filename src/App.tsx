import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EvaluationForm } from './components/Form';
import { EvaluationDashboard } from './components/Dashboard';

const LoginPage = () => (
    <main className="min-h-screen w-full flex items-center justify-center p-4" style={{ backgroundImage: `url('/banner-back 1.png')` }}>
        <div className="absolute inset-0 bg-black/70 z-0" />
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="w-full z-10 flex justify-center"
        >
            /* AQUI PODE SER O AUTORIZADOR */
            <h1 className="text-3xl text-white">Página de Login (Placeholder)</h1>
        </motion.div>
    </main>
);

const FormPage = () => (
  <main className="min-h-screen w-full flex items-center justify-center p-4 relative bg-cover bg-center bg-fixed" style={{ backgroundImage: `url('/banner-back 1.png')` }}>
    <div className="absolute inset-0 bg-black/70 z-0" />
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="w-full z-10 flex justify-center"
    >
      /* AQUI É ONDE VAI ENTRAR O FORMULÁRIO NOVO */
      <EvaluationForm />
    </motion.div>
  </main>
);

const DashboardPage = () => (
    <main className="min-h-screen w-full bg-gray-900 text-white p-4 sm:p-8 relative">
        /* AQUI É ONDE VAI ENTRAR O DASHBOARD NOVO */
        <EvaluationDashboard />
    </main>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        /* PEGAR AUTH DA GABI PARA FAZER UMA ROTA DE LOGIN/AUTORIZAÇÃO */
        <Route path="/" element={<FormPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;