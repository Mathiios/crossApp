import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/main/HomeScreen';
import WODScreen from '../screens/main/WODScreen';
import CheckinScreen from '../screens/main/CheckinScreen';
import RankingScreen from '../screens/main/RankingScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import AdminScreen from '../screens/main/AdminScreen';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();

const TabIcon = ({ label, focused, icon }) => (
  <View style={[iconStyles.container, focused && iconStyles.containerFocused]}>
    <View style={[iconStyles.iconBox, focused && iconStyles.iconBoxFocused]}>
      <Text style={[iconStyles.iconText, focused && iconStyles.iconTextFocused]}>
        {icon}
      </Text>
    </View>
    <Text style={[iconStyles.label, focused && iconStyles.labelFocused]}>{label}</Text>
  </View>
);

const iconStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingHorizontal: 8,
    minWidth: 60,
  },
  containerFocused: {},
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 3,
    backgroundColor: 'transparent',
  },
  iconBoxFocused: {
    backgroundColor: '#FFF0F0',
  },
  iconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#AAAAAA',
  },
  iconTextFocused: {
    color: '#CC0000',
  },
  label: {
    fontSize: 10,
    color: '#AAAAAA',
    fontWeight: '600',
  },
  labelFocused: {
    color: '#CC0000',
    fontWeight: '700',
  },
});

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="Admin" component={AdminScreen} />
    </ProfileStack.Navigator>
  );
}

export default function MainNavigator() {
  const { isAdmin } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#EBEBEB',
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 8,
          paddingTop: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="I" label="Inicio" focused={focused} /> }}
      />
      <Tab.Screen
        name="WOD"
        component={WODScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="W" label="Treino" focused={focused} /> }}
      />
      <Tab.Screen
        name="Checkin"
        component={CheckinScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="A" label="Aulas" focused={focused} /> }}
      />
      <Tab.Screen
        name="Ranking"
        component={RankingScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="R" label="Ranking" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{ tabBarIcon: ({ focused }) => <TabIcon icon="P" label="Perfil" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}
