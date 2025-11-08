// src/lib/userDatabase.ts

// Esta é a interface do nosso "Perfil"
export interface DirectorProfile {
  id: string; 
  email: string;
  password: string; // <-- CORRIGIDO AQUI (era um ponto e vírgula)
  full_name: string;
  sector: string; 
}

// ESTE É O SEU NOVO "BANCO DE DADOS" DE LOGINS
export const directorLogins: DirectorProfile[] = [
  {
    id: 'dir_carlos',
    email: 'carlos.diretor@ej.com',
    password: 'senha123', 
    full_name: 'Carlos Diretor',
    sector: 'Computação', 
  },
  {
    id: 'dir_ana',
    email: 'ana.diretora@ej.com',
    password: 'senha456',
    full_name: 'Ana Diretora',
    sector: 'Marketing',
  },
  // Adicione quantos diretores precisar
]