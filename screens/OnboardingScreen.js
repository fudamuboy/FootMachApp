import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    interpolate,
    Extrapolate,
    FadeIn,
    FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useSharedValue(0);
    const flatListRef = useRef(null);

    const slides = [
        {
            id: '1',
            title: t('onboarding.slide1.title'),
            desc: t('onboarding.slide1.desc'),
            icon: 'users',
            colors: ['#4CAF50', '#2E7D32'],
        },
        {
            id: '2',
            title: t('onboarding.slide2.title'),
            desc: t('onboarding.slide2.desc'),
            icon: 'award',
            colors: ['#FFD700', '#B8860B'],
        },
        {
            id: '3',
            title: t('onboarding.slide3.title'),
            desc: t('onboarding.slide3.desc'),
            icon: 'message-circle',
            colors: ['#2196F3', '#1976D2'],
        },
    ];

    const handleNext = async () => {
        if (currentIndex < slides.length - 1) {
            flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
        } else {
            await completeOnboarding();
        }
    };

    const completeOnboarding = async () => {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        navigation.replace('Auth');
    };

    const renderItem = ({ item, index }) => {
        return (
            <View style={styles.slide}>
                <LinearGradient
                    colors={['#FFFFFF00', '#00000080']}
                    style={StyleSheet.absoluteFill}
                />
                <Animated.View 
                    entering={FadeInDown.delay(200).duration(800)}
                    style={styles.iconContainer}
                >
                    <View style={[styles.iconCircle, { backgroundColor: item.colors[0] + '20' }]}>
                        <Feather name={item.icon} size={80} color={item.colors[0]} />
                    </View>
                </Animated.View>
                
                <View style={styles.textContainer}>
                    <Animated.Text 
                        entering={FadeInDown.delay(400).duration(800)}
                        style={styles.title}
                    >
                        {item.title}
                    </Animated.Text>
                    <Animated.Text 
                        entering={FadeInDown.delay(600).duration(800)}
                        style={styles.desc}
                    >
                        {item.desc}
                    </Animated.Text>
                </View>
            </View>
        );
    };

    const Pagination = () => {
        return (
            <View style={styles.paginationContainer}>
                {slides.map((_, index) => {
                    const animatedStyle = useAnimatedStyle(() => {
                        const w = interpolate(
                            scrollX.value,
                            [(index - 1) * width, index * width, (index + 1) * width],
                            [8, 24, 8],
                            Extrapolate.CLAMP
                        );
                        const opacity = interpolate(
                            scrollX.value,
                            [(index - 1) * width, index * width, (index + 1) * width],
                            [0.3, 1, 0.3],
                            Extrapolate.CLAMP
                        );
                        return { width: w, opacity };
                    });

                    return (
                        <Animated.View 
                            key={index} 
                            style={[styles.dot, animatedStyle]} 
                        />
                    );
                })}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <TouchableOpacity 
                style={styles.skipButton} 
                onPress={completeOnboarding}
            >
                <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
            </TouchableOpacity>

            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                    scrollX.value = e.nativeEvent.contentOffset.x;
                }}
                onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
                keyExtractor={(item) => item.id}
            />

            <View style={styles.footer}>
                <Pagination />
                
                <TouchableOpacity 
                    style={styles.nextButton} 
                    onPress={handleNext}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={[THEME.primary, THEME.dark]}
                        style={styles.nextGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.nextText}>
                            {currentIndex === slides.length - 1 
                                ? t('onboarding.getStarted') 
                                : t('onboarding.continue')}
                        </Text>
                        <Feather 
                            name={currentIndex === slides.length - 1 ? 'check' : 'arrow-right'} 
                            size={20} 
                            color="white" 
                        />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    slide: {
        width,
        height: height * 0.75,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    iconContainer: {
        marginBottom: 40,
    },
    iconCircle: {
        width: 180,
        height: 180,
        borderRadius: 90,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#1A1A1A',
        textAlign: 'center',
        marginBottom: 20,
    },
    desc: {
        fontSize: 16,
        color: '#757575',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    skipButton: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    skipText: {
        fontSize: 16,
        color: '#9ca3af',
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    paginationContainer: {
        flexDirection: 'row',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        height: 8,
        borderRadius: 4,
        backgroundColor: THEME.primary,
        marginHorizontal: 4,
    },
    nextButton: {
        width: '100%',
        marginTop: 20,
    },
    nextGradient: {
        flexDirection: 'row',
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    nextText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
    },
});

export default OnboardingScreen;
