import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { MapScreen } from '../screens/MapScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { DetailScreen } from '../screens/DetailScreen';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';

// Map Stack
type MapStackParamList = {
  MapMain: undefined;
  Detail: { shelterId: string };
};

const MapStack = createNativeStackNavigator<MapStackParamList>();

function MapStackScreen() {
  return (
    <MapStack.Navigator>
      <MapStack.Screen
        name="MapMain"
        component={MapScreen}
        options={{ headerShown: false }}
      />
      <MapStack.Screen
        name="Detail"
        component={DetailScreen}
        options={{
          title: 'Shelter Details',
          headerTintColor: Colors.primary,
        }}
      />
    </MapStack.Navigator>
  );
}

// Search Stack
type SearchStackParamList = {
  SearchMain: undefined;
  Detail: { shelterId: string };
};

const SearchStack = createNativeStackNavigator<SearchStackParamList>();

function SearchStackScreen() {
  return (
    <SearchStack.Navigator>
      <SearchStack.Screen
        name="SearchMain"
        component={SearchScreen}
        options={{ headerShown: false }}
      />
      <SearchStack.Screen
        name="Detail"
        component={DetailScreen}
        options={{
          title: 'Shelter Details',
          headerTintColor: Colors.primary,
        }}
      />
    </SearchStack.Navigator>
  );
}

// Tab Navigator
const Tab = createBottomTabNavigator();

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          height: Layout.tabBarHeight,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Map"
        component={MapStackScreen}
        options={{
          title: 'Shelter Finder',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🗺</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStackScreen}
        options={{
          title: 'Shelter Finder',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🔍</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
