import React from 'react';
import { USERS } from '../constants';
import type { User } from '../types';
import { Role } from '../types';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div className="bg-background min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm bg-surface p-8 rounded-2xl shadow-2xl text-center">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Ventes GRSO</h1>
        <p className="text-text-secondary mb-8">Veuillez sélectionner un utilisateur pour vous connecter.</p>
        <div className="space-y-4">
          {USERS.map((user) => (
            <button
              key={user.id}
              onClick={() => onLogin(user)}
              className="w-full text-left p-4 rounded-lg bg-border hover:bg-primary/20 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-text-primary">{user.name}</p>
                <p className="text-sm text-text-secondary">{user.role}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-surface">
                {user.role === Role.Admin ? '👑' : '👤'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};