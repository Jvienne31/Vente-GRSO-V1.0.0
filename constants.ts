import { Role, User } from './types';

export const USERS: User[] = [
  { id: 1, name: 'Compte Administrateur', role: Role.Admin },
  { id: 2, name: 'Compte Vendeur', role: Role.Seller },
];
