export interface DirectorProfile {
  id: string; 
  email: string;
  password: string; 
  full_name: string;
  sector: string; 
}

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
]