import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from 'react-native-paper';
import { AboutDeveloperScreen } from '../screens/AboutDeveloperScreen';
import { MapScreen } from '../screens/MapScreen';
import { MySheltersScreen } from '../screens/MySheltersScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { DetailScreen } from '../screens/DetailScreen';
import { useTheme } from '../theme/useTheme';

// Map Stack
type MapStackParamList = {
  MapMain: undefined;
  Detail: { shelterId: string };
};

const MapStack = createNativeStackNavigator<MapStackParamList>();

function MapStackScreen() {
  const theme = useTheme();
  return (
    <MapStack.Navigator>
      <MapStack.Screen
        name="MapMain"
        component={MapScreen}
        options={{
          title: 'Shelter Aid',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.surface,
          headerTitleStyle: { color: theme.colors.surface, fontWeight: '600' },
        }}
      />
      <MapStack.Screen
        name="Detail"
        component={DetailScreen}
        options={{
          title: 'Shelter Details',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.surface,
          headerTitleStyle: { color: theme.colors.surface, fontWeight: '600' },
          headerBackButtonDisplayMode: 'minimal',
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
  const theme = useTheme();
  return (
    <SearchStack.Navigator>
      <SearchStack.Screen
        name="SearchMain"
        component={SearchScreen}
        options={{
          title: 'Shelter Aid',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.surface,
          headerTitleStyle: { color: theme.colors.surface, fontWeight: '600' },
        }}
      />
      <SearchStack.Screen
        name="Detail"
        component={DetailScreen}
        options={{
          title: 'Shelter Details',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.surface,
          headerTitleStyle: { color: theme.colors.surface, fontWeight: '600' },
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
    </SearchStack.Navigator>
  );
}

// My Shelter Stack
type MyStackParamList = {
  MyMain: undefined;
  Detail: { shelterId: string };
};

const MyStack = createNativeStackNavigator<MyStackParamList>();

function MyStackScreen() {
  const theme = useTheme();
  return (
    <MyStack.Navigator>
      <MyStack.Screen
        name="MyMain"
        component={MySheltersScreen}
        options={{
          title: 'My Shelter',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.surface,
          headerTitleStyle: { color: theme.colors.surface, fontWeight: '600' },
        }}
      />
      <MyStack.Screen
        name="Detail"
        component={DetailScreen}
        options={{
          title: 'Shelter Details',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.surface,
          headerTitleStyle: { color: theme.colors.surface, fontWeight: '600' },
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
    </MyStack.Navigator>
  );
}

// About stack
type AboutStackParamList = {
  AboutMain: undefined;
};

const AboutStack = createNativeStackNavigator<AboutStackParamList>();

function AboutStackScreen() {
  const theme = useTheme();
  return (
    <AboutStack.Navigator>
      <AboutStack.Screen
        name="AboutMain"
        component={AboutDeveloperScreen}
        options={{
          title: 'About',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.surface,
          headerTitleStyle: { color: theme.colors.surface, fontWeight: '600' },
        }}
      />
    </AboutStack.Navigator>
  );
}

// Tab Navigator
const Tab = createBottomTabNavigator();

export function RootNavigator() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const baseTabBarHeight = Platform.OS === 'ios' ? 58 : 56;
  const bottomInset = Platform.OS === 'ios' ? Math.max(insets.bottom, 10) : 0;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.surface,
        headerTitleStyle: {
          color: theme.colors.surface,
          fontWeight: '600',
        },
        tabBarActiveTintColor: theme.colors.surface,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.65)',
        tabBarStyle: {
          height: baseTabBarHeight + bottomInset,
          paddingBottom: Math.max(bottomInset, 8),
          paddingTop: 6,
          backgroundColor: theme.colors.primary,
          borderTopColor: theme.colors.primary,
          borderTopWidth: 1,
        },
        tabBarItemStyle: {
          flex: 1,
          minHeight: 40,
          justifyContent: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          lineHeight: 14,
          fontWeight: '600',
          marginBottom: 1,
        },
        tabBarHideOnKeyboard: Platform.OS === 'ios',
      }}
    >
      <Tab.Screen
        name="Map"
        component={MapStackScreen}
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center', width: 48 }}>
              <View
                style={{
                  height: 3,
                  width: 22,
                  borderRadius: 999,
                  marginBottom: 4,
                  backgroundColor: focused ? theme.colors.surface : 'transparent',
                }}
              />
              <Icon
                source={focused ? 'map-marker' : 'map-marker-outline'}
                size={size}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStackScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center', width: 48 }}>
              <View
                style={{
                  height: 3,
                  width: 22,
                  borderRadius: 999,
                  marginBottom: 4,
                  backgroundColor: focused ? theme.colors.surface : 'transparent',
                }}
              />
              <Icon source="magnify" size={focused ? size + 1 : size} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="MyShelter"
        component={MyStackScreen}
        options={{
          tabBarLabel: 'My Shelter',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center', width: 48 }}>
              <View
                style={{
                  height: 3,
                  width: 22,
                  borderRadius: 999,
                  marginBottom: 4,
                  backgroundColor: focused ? theme.colors.surface : 'transparent',
                }}
              />
              <Icon
                source={focused ? 'bookmark' : 'bookmark-outline'}
                size={size}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="AboutDeveloper"
        component={AboutStackScreen}
        options={{
          tabBarLabel: 'About',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center', width: 48 }}>
              <View
                style={{
                  height: 3,
                  width: 22,
                  borderRadius: 999,
                  marginBottom: 4,
                  backgroundColor: focused ? theme.colors.surface : 'transparent',
                }}
              />
              <Icon source={focused ? 'school' : 'school-outline'} size={size} color={color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
