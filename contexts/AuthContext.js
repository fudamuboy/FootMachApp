import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (session?.user) {
                setUser(session.user);
                await fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }

            // Listen to auth changes
            const { data: listener } = supabase.auth.onAuthStateChange(
                async (_event, session) => {
                    if (session?.user) {
                        setUser(session.user);
                        await fetchProfile(session.user.id);
                    } else {
                        setUser(null);
                        setProfile(null);
                        setLoading(false);
                    }
                }
            );

            return () => {
                listener?.subscription?.unsubscribe?.();
            };
        };

        init();
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                console.warn('Aucun profil trouvé pour cet utilisateur.');
                setProfile(null);
            } else {
                setProfile(data);
            }
        } catch (error) {
            console.error('❌ Error fetching profile:', error.message);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email, password, displayName, region) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) throw error;

        const userId = data?.user?.id;

        if (!userId) {
            throw new Error("Impossible de récupérer l'ID utilisateur après inscription");
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                username: displayName,
                region: region,
                email: email,
            });

        if (profileError) {
            console.error('Erreur profil:', profileError.message);
            throw profileError;
        } else {
            console.log('✅ Profil inséré avec succès');
        }

    };

    const signIn = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    const value = {
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
