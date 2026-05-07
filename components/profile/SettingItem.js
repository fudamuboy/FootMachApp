import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

const SettingItem = ({ icon, label, onPress, rightElement, color = '#1A1A1A', destructive = false }) => {
    return (
        <TouchableOpacity 
            style={styles.container} 
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconWrapper, { backgroundColor: destructive ? '#FFEBEE' : '#F5F5F5' }]}>
                <Feather name={icon} size={20} color={destructive ? '#D32F2F' : color} />
            </View>
            <Text style={[styles.label, destructive && { color: '#D32F2F' }]}>{label}</Text>
            {rightElement ? rightElement : (
                <Feather name="chevron-right" size={20} color="#BDBDBD" />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#FFF',
    },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    label: {
        fontSize: 16,
        color: '#1A1A1A',
        flex: 1,
        fontWeight: '500',
    },
});

export default SettingItem;
