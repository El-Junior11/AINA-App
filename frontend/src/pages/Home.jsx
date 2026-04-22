import { Link } from 'react-router-dom';
import { Heart, ArrowRight, ShieldCheck, Users, BookOpen } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* --- NAVBAR --- */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 text-2xl font-bold text-blue-600">
          <Heart className="fill-current" />
          <span>ONG TSINJO AINA FIANARANTSOA</span>
        </div>
        
        <div className="flex gap-4">
          <Link 
            to="/login" 
            className="px-5 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition"
          >
            Se connecter
          </Link>
          <Link 
            to="/register" 
            className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md transition"
          >
            S'inscrire
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative py-20 px-8 text-center bg-gradient-to-b from-blue-50 to-white">
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
          Accompagner et Soutenir <br /> 
          <span className="text-blue-600">Pour un avenir meilleur</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10">
          L'ONG TSINJO AINA collabore avec vous pour le développement de la communauté 
          à travers l'éducation, la santé et la solidarité.
        </p>

      </header>


    </div>
  );
};

export default Home;