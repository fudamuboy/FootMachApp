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
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                setUser(session.user);
                await fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }

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

    useEffect(() => {
        // console.log("✅ Profil chargé dans le context:", profile);
    }, [profile]);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                console.warn('⚠️ Aucun profil trouvé pour cet utilisateur.');
                setProfile(null);
                setUser(null); // <- ajoute ça
                setLoading(false); // <- ajoute ça
            } else {
                setProfile(data);
                setLoading(false); // <- s'assure que ça s'arrête ici aussi
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement du profil:', error.message);
            setProfile(null);
            setUser(null); // <- évite de rester bloqué
            setLoading(false); // <- très important
        }
    };


    const signUp = async (email, password, displayName, region) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) throw error;

        const userId = data?.user?.id;
        if (!userId) throw new Error("❌ Impossible de récupérer l'ID utilisateur");

        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                username: displayName,
                region,
                email,
            });

        if (profileError) {
            console.error('❌ Erreur lors de la création du profil:', profileError.message);
            throw profileError;
        }

        console.log('✅ Profil inséré avec succès');
    };

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        const user = data?.user;
        if (user) {
            setUser(user); // indispensable
            await fetchProfile(user.id); // indispensable
        }
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
