import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { THEME } from '../../constants/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: 1,
        title: 'onboarding.slide1.title',
        desc: 'onboarding.slide1.desc',
        icon: 'trending-up',
        color: THEME.primary
    },
    {
        id: 2,
        title: 'onboarding.slide2.title',
        desc: 'onboarding.slide2.desc',
        icon: 'award',
        color: '#2196F3'
    },
    {
        id: 3,
        title: 'onboarding.slide3.title',
        desc: 'onboarding.slide3.desc',
        icon: 'star',
        color: '#FFD700'
    }
];

const ProgressionOnboarding = ({ visible, onFinish }) => {
    const { t } = useTranslation();
    const [currentSlide, setCurrentSlide] = useState(0);

    const handleNext = () => {
        if (currentSlide < SLIDES.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            onFinish();
        }
    };

    if (!visible) return null;

    const slide = SLIDES[currentSlide];

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.container}>
                    <LinearGradient
                        colors={['#FFFFFF', '#F8F9FA']}
                        style={styles.content}
                    >
                        <Animated.View 
                            key={currentSlide}
                            entering={SlideInRight}
                            exiting={SlideOutLeft}
                            style={styles.slideContent}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: `${slide.color}15` }]}>
                                <Feather name={slide.icon} size={60} color={slide.color} />
                            </View>
                            
                            <Text style={styles.title}>{t(slide.title)}</Text>
                            <Text style={styles.desc}>{t(slide.desc)}</Text>
                        </Animated.View>

                        <View style={styles.footer}>
                            <View style={styles.pagination}>
                                {SLIDES.map((_, i) => (
                                    <View 
                                        key={i} 
                                        style={[
                                            styles.dot, 
                                            currentSlide === i && styles.activeDot,
                                            currentSlide === i && { backgroundColor: slide.color }
                                        ]} 
                                    />
                                ))}
                            </View>

                            <TouchableOpacity 
                                style={[styles.button, { backgroundColor: slide.color }]} 
                                onPress={handleNext}
                            >
                                <Text style={styles.buttonText}>
                                    {currentSlide === SLIDES.length - 1 ? t('onboarding.start') : t('onboarding.next')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: width * 0.85,
        borderRadius: 32,
        overflow: 'hidden',
    },
    content: {
        padding: 32,
        alignItems: 'center',
    },
    slideContent: {
        alignItems: 'center',
        width: '100%',
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 16,
    },
    desc: {
        fontSize: 16,
        color: '#757575',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    footer: {
        width: '100%',
        alignItems: 'center',
    },
    pagination: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 32,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E0E0E0',
    },
    activeDot: {
        width: 24,
    },
    button: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ProgressionOnboarding;
