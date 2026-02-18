import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { User } from '@/types/user';
import { FloatingToolbar } from '@/components/ui/FloatingToolbar';
import { AddMenu } from '@/components/ui/AddMenu';
import { useNavigation } from '@/contexts/NavigationContext';
import { Colors } from '@/constants/DesignTokens';

export default function TabLayout() {
  const { data: me } = useQuery<User>({
    queryKey: ['/auth/me'],
    retry: 0,
  });

  const {
    activeTab,
    addMenuOpen,
    currentLevel,
    currentContext,
    properties,
    rooms,
    showToolbar,
    navigateToPortfolio,
    navigateToInventory,
    navigateToReports,
    navigateToSettings,
    handleAddPress,
    handleAddProperty,
    handleAddRoom,
    handleScanItem,
    setAddMenuOpen,
    setCurrentContext,
  } = useNavigation();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          unmountOnBlur: true,
          tabBarStyle: { display: 'none' },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Portfolio',
          }}
        />
        <Tabs.Screen
          name="rooms"
          options={{
            title: 'Rooms',
            href: null,
          }}
        />
        <Tabs.Screen
          name="items"
          options={{
            title: 'Items',
          }}
        />
        <Tabs.Screen
          name="addItem"
          options={{
            title: 'Add',
            href: null,
          }}
        />
        <Tabs.Screen
          name="editItem"
          options={{
            title: 'Update',
            href: null,
          }}
        />
        <Tabs.Screen
          name="users"
          options={{
            title: 'Users',
            href: me?.role === 'admin' ? '/users' : null,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
          }}
        />
        <Tabs.Screen
          name="addHouse"
          options={{
            title: 'Add Property',
            href: null,
          }}
        />
        <Tabs.Screen
          name="addRoom"
          options={{
            title: 'Add Room',
            href: null,
          }}
        />
        <Tabs.Screen
          name="house"
          options={{
            title: 'Property',
            href: null,
          }}
        />
        <Tabs.Screen
          name="room"
          options={{
            title: 'Room',
            href: null,
          }}
        />
        <Tabs.Screen
          name="item"
          options={{
            title: 'Item',
            href: null,
          }}
        />
        <Tabs.Screen
          name="addUser"
          options={{
            title: 'Add User',
            href: null,
          }}
        />
        <Tabs.Screen
          name="editHouse"
          options={{
            title: 'Edit Property',
            href: null,
          }}
        />
        <Tabs.Screen
          name="editRoom"
          options={{
            title: 'Edit Room',
            href: null,
          }}
        />
        <Tabs.Screen
          name="editProfile"
          options={{
            title: 'Edit Profile',
            href: null,
          }}
        />
        <Tabs.Screen
          name="changePassword"
          options={{
            title: 'Change Password',
            href: null,
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reports',
          }}
        />
      </Tabs>

      {showToolbar && (
        <>
          <FloatingToolbar
            activeTab={activeTab}
            addMenuOpen={addMenuOpen}
            onPortfolioPress={navigateToPortfolio}
            onInventoryPress={navigateToInventory}
            onAddPress={handleAddPress}
            onReportsPress={navigateToReports}
            onSettingsPress={navigateToSettings}
          />

          <AddMenu
            visible={addMenuOpen}
            onClose={() => setAddMenuOpen(false)}
            currentLevel={currentLevel}
            currentContext={currentContext}
            properties={properties}
            rooms={rooms}
            onAddProperty={handleAddProperty}
            onAddRoom={handleAddRoom}
            onScanItem={handleScanItem}
            onContextChange={setCurrentContext}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCanvas,
  },
});
