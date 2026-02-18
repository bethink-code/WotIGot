import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { router } from 'expo-router';
import { HierarchyLevel } from '../components/ui/types';
import { LocationContext, PropertyOption, RoomOption } from '../components/ui/AddMenu';

export type NavigationMode = 'shell' | 'form' | 'detail';

interface NavigationContextType {
  activeTab: 'portfolio' | 'inventory' | 'reports' | 'settings';
  setActiveTab: (tab: 'portfolio' | 'inventory' | 'reports' | 'settings') => void;
  addMenuOpen: boolean;
  setAddMenuOpen: (open: boolean) => void;
  currentLevel: HierarchyLevel;
  setCurrentLevel: (level: HierarchyLevel) => void;
  currentContext: LocationContext;
  setCurrentContext: (context: LocationContext) => void;
  properties: PropertyOption[];
  setProperties: (properties: PropertyOption[]) => void;
  rooms: RoomOption[];
  setRooms: (rooms: RoomOption[]) => void;
  navigationMode: NavigationMode;
  setNavigationMode: (mode: NavigationMode) => void;
  showToolbar: boolean;
  navigateToPortfolio: () => void;
  navigateToInventory: () => void;
  navigateToReports: () => void;
  navigateToSettings: () => void;
  handleAddPress: () => void;
  handleAddProperty: () => void;
  handleAddRoom: () => void;
  handleScanItem: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'inventory' | 'reports' | 'settings'>('portfolio');
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<HierarchyLevel>('portfolio');
  const [currentContext, setCurrentContext] = useState<LocationContext>({});
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [navigationMode, setNavigationMode] = useState<NavigationMode>('shell');

  const showToolbar = navigationMode === 'shell';

  const navigateToPortfolio = useCallback(() => {
    setActiveTab('portfolio');
    setCurrentLevel('portfolio');
    setCurrentContext({});
    router.push('/(tabs)/');
  }, []);

  const navigateToInventory = useCallback(() => {
    setActiveTab('inventory');
    router.push('/(tabs)/items');
  }, []);

  const navigateToReports = useCallback(() => {
    setActiveTab('reports');
    router.push('/(tabs)/reports');
  }, []);

  const navigateToSettings = useCallback(() => {
    setActiveTab('settings');
    router.push('/(tabs)/settings');
  }, []);

  const handleAddPress = useCallback(() => {
    setAddMenuOpen(!addMenuOpen);
  }, [addMenuOpen]);

  const handleAddProperty = useCallback(() => {
    setAddMenuOpen(false);
    router.push('/(tabs)/addHouse');
  }, []);

  const handleAddRoom = useCallback(() => {
    setAddMenuOpen(false);
    if (currentContext.propertyId) {
      router.push({
        pathname: '/(tabs)/addRoom',
        params: { house_id: currentContext.propertyId },
      });
    } else {
      router.push('/(tabs)/addRoom');
    }
  }, [currentContext.propertyId]);

  const handleScanItem = useCallback(() => {
    setAddMenuOpen(false);
    if (currentContext.roomId) {
      router.push({
        pathname: '/(tabs)/addItem',
        params: { room_id: currentContext.roomId },
      });
    } else {
      router.push('/(tabs)/addItem');
    }
  }, [currentContext.roomId]);

  return (
    <NavigationContext.Provider
      value={{
        activeTab,
        setActiveTab,
        addMenuOpen,
        setAddMenuOpen,
        currentLevel,
        setCurrentLevel,
        currentContext,
        setCurrentContext,
        properties,
        setProperties,
        rooms,
        setRooms,
        navigationMode,
        setNavigationMode,
        showToolbar,
        navigateToPortfolio,
        navigateToInventory,
        navigateToReports,
        navigateToSettings,
        handleAddPress,
        handleAddProperty,
        handleAddRoom,
        handleScanItem,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
