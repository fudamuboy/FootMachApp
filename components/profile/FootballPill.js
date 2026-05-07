import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, interpolateColor } from 'react-native-reanimated';
import { THEME } from '../../constants/theme';

const FootballPill = ({ label, selected, onSelect }) => {
    const animatedStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: withSpring(selected ? THEME.primary : '#F5F5F5'),
            transform: [{ scale: withSpring(selected ? 1.05 : 1) }],
        };
    });

    const textStyle = useAnimatedStyle(() => {
        return {
            color: withSpring(selected ? '#FFFFFF' : '#757575'),
        };
    });

    return (
        <TouchableOpacity activeOpacity={0.8} onPress={onSelect}>
            <Animated.View style={[styles.pill, animatedStyle]}>
                <Animated.Text style={[styles.pillText, textStyle]}>
                    {label}
                </Animated.Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 25,
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        minWidth: 60,
        alignItems: 'center',
    },
    pillText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default FootballPill;
