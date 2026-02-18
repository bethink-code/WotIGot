import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Platform, Pressable } from 'react-native';
import { useFonts } from 'expo-font';
import { 
  Poppins_100Thin, 
  Poppins_300Light, 
  Poppins_400Regular, 
  Poppins_500Medium, 
  Poppins_600SemiBold,
  Poppins_700Bold, 
  Poppins_800ExtraBold,
  Poppins_900Black 
} from '@expo-google-fonts/poppins';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { Colors, Radii, Shadows, Typography, Spacing } from '../constants/DesignTokens';
import { 
  Icon, 
  IconNames,
  Logo,
  IconButton,
  DenseCard, 
  SimpleCard, 
  SelectorCard, 
  CardList, 
  CardListItem,
  NoticeBanner,
  PageHeader,
  PortfolioHeader,
  FloatingToolbar,
  AddMenu,
  Avatar,
  IconCircle,
  OnboardingSlide,
  OnboardingPagination,
  TextInput,
  PrimaryButton,
  SecondaryButton,
  AuthToggleLink,
} from '../components/ui';
import type { ViewMode } from '../components/ui';

export default function DesignPreview() {
  const [fontsLoaded] = useFonts({
    Poppins_100Thin,
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  const [searchValue, setSearchValue] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProperty, setSelectedProperty] = useState<string | null>('main-house');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [addMenuLevel, setAddMenuLevel] = useState<'portfolio' | 'property' | 'room'>('portfolio');

  const demoProperties = [
    { id: 'main-house', name: 'Main House', address: '15 Kromhout Rd', icon: 'home-city-outline' as const },
    { id: 'holiday-home', name: 'Holiday Home', address: 'Plettenberg Bay', icon: 'home-city-outline' as const },
  ];

  const demoRooms = [
    { id: 'living-room', name: 'Living Room', itemCount: 42, propertyId: 'main-house', icon: 'sofa-outline' as const },
    { id: 'kitchen', name: 'Kitchen', itemCount: 28, propertyId: 'main-house', icon: 'silverware-fork-knife' as const },
    { id: 'beach-lounge', name: 'Beach Lounge', itemCount: 15, propertyId: 'holiday-home', icon: 'sofa-outline' as const },
  ];

  const getContextForLevel = (level: 'portfolio' | 'property' | 'room') => {
    switch (level) {
      case 'portfolio':
        return {
          propertyId: undefined,
          propertyName: undefined,
          propertyAddress: undefined,
          roomId: undefined,
          roomName: undefined,
          roomItemCount: undefined,
        };
      case 'property':
        return {
          propertyId: 'main-house',
          propertyName: 'Main House',
          propertyAddress: '15 Kromhout Rd',
          roomId: undefined,
          roomName: undefined,
          roomItemCount: undefined,
        };
      case 'room':
        return {
          propertyId: 'main-house',
          propertyName: 'Main House',
          propertyAddress: '15 Kromhout Rd',
          roomId: 'living-room',
          roomName: 'Living Room',
          roomItemCount: 42,
        };
    }
  };

  const demoContext = getContextForLevel(addMenuLevel);

  const filters = [
    { id: 'all', label: 'All', active: true },
    { id: 'recent', label: 'Recent' },
    { id: 'high-value', label: 'High Value' },
    { id: 'insured', label: 'Insured' },
  ];

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <Text>Loading fonts...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="dark-content" />
      
      <Logo size="xl" />
      <Text style={styles.pageSubtitle}>Poppins headlines + DM Sans body text</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Logo - Brand Identity</Text>
        <Text style={styles.sectionDescription}>
          The "i" is green (action/growth) and the "." is orange (warmth/completion)
        </Text>
        
        <Text style={styles.subsectionTitle}>Light Background</Text>
        <View style={styles.logoGrid}>
          <View style={styles.logoItem}>
            <Logo size="sm" variant="light" />
            <Text style={styles.logoLabel}>Small</Text>
          </View>
          <View style={styles.logoItem}>
            <Logo size="md" variant="light" />
            <Text style={styles.logoLabel}>Medium</Text>
          </View>
          <View style={styles.logoItem}>
            <Logo size="lg" variant="light" />
            <Text style={styles.logoLabel}>Large</Text>
          </View>
          <View style={styles.logoItem}>
            <Logo size="xl" variant="light" />
            <Text style={styles.logoLabel}>Extra Large</Text>
          </View>
        </View>
        
        <Text style={styles.subsectionTitle}>Dark Background</Text>
        <View style={styles.logoDarkBg}>
          <View style={styles.logoGrid}>
            <View style={styles.logoItem}>
              <Logo size="sm" variant="dark" />
              <Text style={styles.logoLabelDark}>Small</Text>
            </View>
            <View style={styles.logoItem}>
              <Logo size="md" variant="dark" />
              <Text style={styles.logoLabelDark}>Medium</Text>
            </View>
            <View style={styles.logoItem}>
              <Logo size="lg" variant="dark" />
              <Text style={styles.logoLabelDark}>Large</Text>
            </View>
            <View style={styles.logoItem}>
              <Logo size="xl" variant="dark" />
              <Text style={styles.logoLabelDark}>Extra Large</Text>
            </View>
          </View>
        </View>

        <Text style={styles.subsectionTitle}>On Color Backgrounds (Inverted Accents)</Text>
        <View style={styles.logoColorBgRow}>
          <View style={[styles.logoColorBg, { backgroundColor: Colors.green }]}>
            <Logo size="md" background="green" />
            <Text style={styles.logoLabelDark}>white + dark i/.</Text>
          </View>
          <View style={[styles.logoColorBg, { backgroundColor: Colors.yellow }]}>
            <Logo size="md" background="yellow" />
            <Text style={styles.logoLabel}>dark + white i/.</Text>
          </View>
          <View style={[styles.logoColorBg, { backgroundColor: Colors.orange }]}>
            <Logo size="md" background="orange" />
            <Text style={styles.logoLabelDark}>white + dark i/.</Text>
          </View>
        </View>
        
        <Text style={styles.subsectionTitle}>With Tagline</Text>
        <View style={styles.logoWithTagline}>
          <Logo size="lg" variant="light" showTagline tagline="Snap, track, prove it." />
        </View>
      </View>

      <View style={styles.divider} />
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Icons - Material Outline</Text>
        <View style={styles.iconGrid}>
          <View style={styles.iconItem}>
            <Icon name={IconNames.home} size={28} color={Colors.green} />
            <Text style={styles.iconLabel}>home</Text>
          </View>
          <View style={styles.iconItem}>
            <Icon name={IconNames.room} size={28} color={Colors.orange} />
            <Text style={styles.iconLabel}>room</Text>
          </View>
          <View style={styles.iconItem}>
            <Icon name={IconNames.camera} size={28} color={Colors.textDark} />
            <Text style={styles.iconLabel}>camera</Text>
          </View>
          <View style={styles.iconItem}>
            <Icon name={IconNames.search} size={28} color={Colors.textGrey} />
            <Text style={styles.iconLabel}>search</Text>
          </View>
          <View style={styles.iconItem}>
            <Icon name={IconNames.filter} size={28} color={Colors.textGrey} />
            <Text style={styles.iconLabel}>filter</Text>
          </View>
          <View style={styles.iconItem}>
            <Icon name={IconNames.viewList} size={28} color={Colors.textDark} />
            <Text style={styles.iconLabel}>list</Text>
          </View>
          <View style={styles.iconItem}>
            <Icon name={IconNames.viewGrid} size={28} color={Colors.textDark} />
            <Text style={styles.iconLabel}>grid</Text>
          </View>
          <View style={styles.iconItem}>
            <Icon name={IconNames.checkCircle} size={28} color={Colors.green} />
            <Text style={styles.iconLabel}>check</Text>
          </View>
          <View style={styles.iconItem}>
            <Icon name={IconNames.lock} size={28} color={Colors.greyMid} />
            <Text style={styles.iconLabel}>lock</Text>
          </View>
          <View style={styles.iconItem}>
            <Icon name={IconNames.add} size={28} color={Colors.green} />
            <Text style={styles.iconLabel}>add</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Typography - Poppins</Text>
        <View style={styles.typographyList}>
          <Text style={[styles.typeSample, { fontFamily: Typography.fontFamily.thin, fontSize: 24 }]}>
            Thin 100 - wotigot.
          </Text>
          <Text style={[styles.typeSample, { fontFamily: Typography.fontFamily.light, fontSize: 24 }]}>
            Light 300 - wotigot.
          </Text>
          <Text style={[styles.typeSample, { fontFamily: Typography.fontFamily.regular, fontSize: 24 }]}>
            Regular 400 - wotigot.
          </Text>
          <Text style={[styles.typeSample, { fontFamily: Typography.fontFamily.medium, fontSize: 24 }]}>
            Medium 500 - wotigot.
          </Text>
          <Text style={[styles.typeSample, { fontFamily: Typography.fontFamily.semiBold, fontSize: 24 }]}>
            SemiBold 600 - wotigot.
          </Text>
          <Text style={[styles.typeSample, { fontFamily: Typography.fontFamily.bold, fontSize: 24 }]}>
            Bold 700 - wotigot.
          </Text>
          <Text style={[styles.typeSample, { fontFamily: Typography.fontFamily.extraBold, fontSize: 24 }]}>
            ExtraBold 800 - wotigot.
          </Text>
          <Text style={[styles.typeSample, { fontFamily: Typography.fontFamily.black, fontSize: 24 }]}>
            Black 900 - wotigot.
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Card List - Search, Filters, View Toggle</Text>
        <CardList
          searchPlaceholder="Search properties..."
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          showSearch={true}
          filters={filters}
          showFilters={true}
          onFilterPress={(id) => console.log('Filter:', id)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showViewToggle={true}
        >
          <View />
        </CardList>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dense Cards</Text>
        <Text style={styles.subsectionTitle}>Default State</Text>
        <CardListItem>
          <DenseCard
            title="Main House"
            subtitle="15 Kromhout Rd"
            badge={{ text: '8 Rooms', level: 'portfolio' }}
            valueBadge={{ text: 'R 4.5m', level: 'portfolio' }}
            thumbnailIcon="home-outline"
            onPress={() => console.log('Pressed')}
          />
        </CardListItem>
        
        <Text style={styles.subsectionTitle}>With Action Button</Text>
        <CardListItem>
          <DenseCard
            title="Holiday Home"
            subtitle="Plettenberg Bay"
            badge={{ text: '5 Rooms', level: 'property' }}
            valueBadge={{ text: 'R 2.1m', level: 'property' }}
            thumbnailIcon="home-city-outline"
            onPress={() => console.log('Pressed')}
            onActionPress={() => console.log('Action')}
            actionIcon="dots-vertical"
          />
        </CardListItem>

        <Text style={styles.subsectionTitle}>Disabled State</Text>
        <CardListItem>
          <DenseCard
            title="Storage Unit"
            subtitle="Cape Town CBD"
            badge={{ text: '1 Room', level: 'room' }}
            thumbnailIcon="package-variant"
            disabled={true}
          />
        </CardListItem>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Simple Cards</Text>
        <Text style={styles.sectionDescription}>
          Room cards with solid icon backgrounds and value badges
        </Text>
        
        <Text style={styles.subsectionTitle}>Solid Icon Backgrounds (Room Level)</Text>
        <CardListItem>
          <SimpleCard
            title="Living Room"
            subtitle="42 Items"
            icon="door-open"
            level="room"
            useSolidIconBg
            valueBadge={{ text: 'R 1.2m', level: 'room' }}
            onPress={() => console.log('Pressed')}
          />
        </CardListItem>
        <CardListItem>
          <SimpleCard
            title="Kitchen"
            subtitle="28 Items"
            icon="stove"
            level="room"
            useSolidIconBg
            valueBadge={{ text: 'R 500k', level: 'room' }}
            onPress={() => console.log('Pressed')}
          />
        </CardListItem>

        <Text style={styles.subsectionTitle}>Soft Icon Backgrounds (Default)</Text>
        <CardListItem>
          <SimpleCard
            title="Living Room"
            subtitle="42 Items"
            icon="door-open"
            level="room"
            valueBadge={{ text: 'R 1.2m', level: 'room' }}
            onPress={() => console.log('Pressed')}
          />
        </CardListItem>

        <Text style={styles.subsectionTitle}>With Action Label</Text>
        <CardListItem>
          <SimpleCard
            title="Living Room"
            subtitle="Main House"
            icon="door-open"
            level="room"
            useSolidIconBg
            actionLabel="Change"
            onActionPress={() => console.log('Change')}
          />
        </CardListItem>

        <Text style={styles.subsectionTitle}>Property Level (Yellow)</Text>
        <CardListItem>
          <SimpleCard
            title="Main House"
            subtitle="8 Rooms"
            icon="home-outline"
            level="property"
            useSolidIconBg
            valueBadge={{ text: 'R 4.5m', level: 'property' }}
            onPress={() => console.log('Add')}
          />
        </CardListItem>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Selector Cards</Text>
        
        <Text style={styles.subsectionTitle}>Property Level Selection</Text>
        <Text style={styles.stepLabel}>1. SELECT PROPERTY</Text>
        <CardListItem>
          <SelectorCard
            title="Main House"
            subtitle="15 Kromhout Rd"
            icon="home-outline"
            level="property"
            state={selectedProperty === 'main-house' ? 'selected' : 'default'}
            onPress={() => setSelectedProperty('main-house')}
          />
        </CardListItem>
        <CardListItem>
          <SelectorCard
            title="Holiday Home"
            subtitle="Plettenberg Bay"
            icon="home-city-outline"
            level="property"
            state={selectedProperty === 'holiday-home' ? 'selected' : 'default'}
            onPress={() => setSelectedProperty('holiday-home')}
          />
        </CardListItem>

        <Text style={styles.subsectionTitle}>Room Level Selection</Text>
        <Text style={styles.stepLabel}>2. SELECT ROOM</Text>
        <CardListItem>
          <SelectorCard
            title="Living Room"
            subtitle="42 Items"
            icon="door-open"
            level="room"
            state={selectedRoom === 'living-room' ? 'selected' : 'default'}
            onPress={() => setSelectedRoom('living-room')}
          />
        </CardListItem>
        <CardListItem>
          <SelectorCard
            title="Kitchen"
            subtitle="28 Items"
            icon="stove"
            level="room"
            state={selectedRoom === 'kitchen' ? 'selected' : 'default'}
            onPress={() => setSelectedRoom('kitchen')}
          />
        </CardListItem>

        <Text style={styles.subsectionTitle}>Unselectable State</Text>
        <CardListItem>
          <SelectorCard
            title="Shared Storage"
            subtitle="Requires premium"
            icon="package-variant"
            level="room"
            state="unselectable"
          />
        </CardListItem>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Color Palette</Text>
        <View style={styles.colorRow}>
          <View style={styles.colorItem}>
            <View style={[styles.colorSwatch, { backgroundColor: Colors.green }]} />
            <Text style={styles.colorName}>Portfolio</Text>
          </View>
          <View style={styles.colorItem}>
            <View style={[styles.colorSwatch, { backgroundColor: Colors.yellow }]} />
            <Text style={styles.colorName}>Property</Text>
          </View>
          <View style={styles.colorItem}>
            <View style={[styles.colorSwatch, { backgroundColor: Colors.orange }]} />
            <Text style={styles.colorName}>Room/Item</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notice Banners</Text>
        <Text style={styles.sectionDescription}>
          Notification banners for normal states using hierarchy colors
        </Text>
        
        <Text style={styles.subsectionTitle}>Portfolio Level (Green)</Text>
        <NoticeBanner
          text="3 New scans to review"
          icon="auto-fix"
          level="portfolio"
          onPress={() => console.log('Review scans')}
        />
        
        <Text style={styles.subsectionTitle}>Property Level (Yellow)</Text>
        <NoticeBanner
          text="2 Properties need attention"
          icon="alert-circle-outline"
          level="property"
          onPress={() => console.log('View properties')}
        />
        
        <Text style={styles.subsectionTitle}>Room Level (Orange)</Text>
        <NoticeBanner
          text="5 Items updated recently"
          icon="update"
          level="room"
          onPress={() => console.log('View items')}
        />

        <Text style={styles.subsectionTitle}>No Action (Static)</Text>
        <NoticeBanner
          text="All items are up to date"
          icon="check-circle-outline"
          level="portfolio"
          showArrow={false}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Icon Buttons</Text>
        <Text style={styles.sectionDescription}>
          Reusable button pattern with semi-transparent background
        </Text>
        
        <Text style={styles.subsectionTitle}>On Colored Backgrounds</Text>
        <View style={styles.iconButtonRow}>
          <View style={[styles.iconButtonDemo, { backgroundColor: Colors.green }]}>
            <IconButton icon="arrow-left" iconColor={Colors.white} />
            <IconButton icon="cog-outline" iconColor={Colors.white} />
            <IconButton icon="plus" iconColor={Colors.white} />
          </View>
          <View style={[styles.iconButtonDemo, { backgroundColor: Colors.yellow }]}>
            <IconButton icon="arrow-left" iconColor={Colors.white} />
            <IconButton icon="pencil-outline" iconColor={Colors.white} />
          </View>
          <View style={[styles.iconButtonDemo, { backgroundColor: Colors.orange }]}>
            <IconButton icon="arrow-left" iconColor={Colors.white} />
            <IconButton icon="tune-variant" iconColor={Colors.white} />
          </View>
        </View>

        <Text style={styles.subsectionTitle}>Sizes</Text>
        <View style={[styles.iconButtonDemo, { backgroundColor: Colors.green }]}>
          <IconButton icon="home-outline" size="sm" iconColor={Colors.white} />
          <IconButton icon="home-outline" size="md" iconColor={Colors.white} />
          <IconButton icon="home-outline" size="lg" iconColor={Colors.white} />
        </View>

        <Text style={styles.subsectionTitle}>Transparent Variant</Text>
        <View style={styles.iconButtonRowLight}>
          <IconButton icon="magnify" variant="transparent" iconColor={Colors.textDark} />
          <IconButton icon="filter-outline" variant="transparent" iconColor={Colors.textDark} />
          <IconButton icon="dots-vertical" variant="transparent" iconColor={Colors.textDark} />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Portfolio Header</Text>
        <Text style={styles.sectionDescription}>
          Home screen header with logo, user avatar, and portfolio value
        </Text>
        
        <View style={styles.headerPreview}>
          <PortfolioHeader
            portfolioValue="R 15,500,000"
            userName="John Doe"
            onAvatarPress={() => console.log('Profile')}
          />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Page Headers</Text>
        <Text style={styles.sectionDescription}>
          Colored headers with back button, title, and action icons
        </Text>
        
        <Text style={styles.subsectionTitle}>Property Level (Yellow)</Text>
        <View style={styles.headerPreview}>
          <PageHeader
            title="Main House"
            subtitle="15 Kromhout Rd • 8 Rooms"
            level="property"
            onBackPress={() => console.log('Back')}
            actionIcon="pencil-outline"
            onActionPress={() => console.log('Edit')}
          />
        </View>
        
        <Text style={styles.subsectionTitle}>Room Level (Orange)</Text>
        <View style={styles.headerPreview}>
          <PageHeader
            title="Living Room"
            subtitle="42 Items • R 1,200,000"
            level="room"
            onBackPress={() => console.log('Back')}
            actionIcon="pencil-outline"
            onActionPress={() => console.log('Edit')}
          />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Floating Toolbar + Add Menu</Text>
        <Text style={styles.sectionDescription}>
          Bottom navigation with central FAB. Tap the + button to open the Add Menu.
          The menu shows different options based on hierarchy level.
        </Text>

        <Text style={styles.subsectionTitle}>Select Context Level</Text>
        <View style={styles.levelSelector}>
          <Pressable 
            style={[
              styles.levelButton, 
              addMenuLevel === 'portfolio' && styles.levelButtonActive,
              addMenuLevel === 'portfolio' && { backgroundColor: Colors.greenSoft }
            ]}
            onPress={() => setAddMenuLevel('portfolio')}
          >
            <Text style={[
              styles.levelButtonText,
              addMenuLevel === 'portfolio' && { color: Colors.green }
            ]}>Portfolio</Text>
            <Text style={styles.levelButtonHint}>+Property, Room, Scan</Text>
          </Pressable>
          <Pressable 
            style={[
              styles.levelButton, 
              addMenuLevel === 'property' && styles.levelButtonActive,
              addMenuLevel === 'property' && { backgroundColor: Colors.yellowSoft }
            ]}
            onPress={() => setAddMenuLevel('property')}
          >
            <Text style={[
              styles.levelButtonText,
              addMenuLevel === 'property' && { color: Colors.yellow }
            ]}>Property</Text>
            <Text style={styles.levelButtonHint}>+Room, Scan</Text>
          </Pressable>
          <Pressable 
            style={[
              styles.levelButton, 
              addMenuLevel === 'room' && styles.levelButtonActive,
              addMenuLevel === 'room' && { backgroundColor: Colors.orangeSoft }
            ]}
            onPress={() => setAddMenuLevel('room')}
          >
            <Text style={[
              styles.levelButtonText,
              addMenuLevel === 'room' && { color: Colors.orange }
            ]}>Room</Text>
            <Text style={styles.levelButtonHint}>+Scan only</Text>
          </Pressable>
        </View>
        
        <View style={styles.toolbarPreview}>
          <FloatingToolbar
            activeTab="portfolio"
            addMenuOpen={addMenuOpen}
            onPortfolioPress={() => console.log('Portfolio')}
            onInventoryPress={() => console.log('Inventory')}
            onAddPress={() => setAddMenuOpen(!addMenuOpen)}
            onReportsPress={() => console.log('Reports')}
            onSettingsPress={() => console.log('Settings')}
          />
        </View>

        <AddMenu
          visible={addMenuOpen}
          onClose={() => setAddMenuOpen(false)}
          currentLevel={addMenuLevel}
          currentContext={demoContext}
          properties={demoProperties}
          rooms={demoRooms}
          onAddProperty={() => { setAddMenuOpen(false); console.log('Add Property'); }}
          onAddRoom={() => { setAddMenuOpen(false); console.log('Add Room'); }}
          onScanItem={() => { setAddMenuOpen(false); console.log('Scan Item'); }}
          onContextChange={(ctx) => console.log('Context changed:', ctx)}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Avatars</Text>
        <Text style={styles.sectionDescription}>
          User profile circles with images or initials
        </Text>
        
        <View style={styles.avatarRow}>
          <View style={styles.avatarItem}>
            <Avatar size="sm" name="John Doe" />
            <Text style={styles.avatarLabel}>Small</Text>
          </View>
          <View style={styles.avatarItem}>
            <Avatar size="md" name="Jane Smith" />
            <Text style={styles.avatarLabel}>Medium</Text>
          </View>
          <View style={styles.avatarItem}>
            <Avatar size="lg" name="Bob Wilson" />
            <Text style={styles.avatarLabel}>Large</Text>
          </View>
        </View>

        <Text style={styles.subsectionTitle}>With Border</Text>
        <View style={styles.avatarRow}>
          <Avatar size="md" name="A B" showBorder borderColor={Colors.green} />
          <Avatar size="md" name="C D" showBorder borderColor={Colors.yellow} />
          <Avatar size="md" name="E F" showBorder borderColor={Colors.orange} />
        </View>

        <Text style={styles.subsectionTitle}>Empty State</Text>
        <View style={styles.avatarRow}>
          <Avatar size="md" />
          <Avatar size="md" backgroundColor={Colors.greenSoft} />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Onboarding Components</Text>
        <Text style={styles.sectionDescription}>
          Animated components for the onboarding wizard flow
        </Text>
        
        <Text style={styles.subsectionTitle}>Icon Circles (Floating Animation)</Text>
        <View style={styles.iconCircleRow}>
          <View style={styles.iconCircleItem}>
            <IconCircle icon="clipboard-check-outline" level="portfolio" size="md" />
            <Text style={styles.iconCircleLabel}>Portfolio</Text>
          </View>
          <View style={styles.iconCircleItem}>
            <IconCircle icon="camera-outline" level="room" size="md" />
            <Text style={styles.iconCircleLabel}>Room</Text>
          </View>
          <View style={styles.iconCircleItem}>
            <IconCircle icon="trending-up" level="property" size="md" />
            <Text style={styles.iconCircleLabel}>Property</Text>
          </View>
        </View>

        <Text style={styles.subsectionTitle}>Onboarding Slide</Text>
        <View style={styles.slidePreview}>
          <OnboardingSlide
            icon="clipboard-check-outline"
            level="portfolio"
            titleLine1="Always"
            titleLine2="Accurate."
            description="Keep a living, detailed list of your belongings. Never lose track of what you own again."
          />
        </View>

        <Text style={styles.subsectionTitle}>Pagination Controls</Text>
        <View style={styles.paginationPreview}>
          <OnboardingPagination
            totalSteps={3}
            currentStep={onboardingStep}
            onNext={() => setOnboardingStep((onboardingStep + 1) % 3)}
          />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Auth Components</Text>
        <Text style={styles.sectionDescription}>
          Form inputs and buttons for login/registration screens
        </Text>

        <Text style={styles.subsectionTitle}>Text Inputs</Text>
        <View style={styles.inputsContainer}>
          <TextInput 
            placeholder="Email Address" 
            value={emailValue}
            onChangeText={setEmailValue}
          />
          <View style={{ height: Spacing.md }} />
          <TextInput 
            placeholder="Password" 
            secureTextEntry 
            value={passwordValue}
            onChangeText={setPasswordValue}
          />
        </View>

        <Text style={styles.subsectionTitle}>Primary Buttons</Text>
        <View style={styles.buttonsContainer}>
          <PrimaryButton
            label="Let's Go"
            icon="arrow-right"
            onPress={() => console.log('Pressed')}
          />
          <View style={{ height: Spacing.md }} />
          <PrimaryButton
            label="Sign In"
            variant="dark"
            onPress={() => console.log('Sign In')}
          />
          <View style={{ height: Spacing.md }} />
          <PrimaryButton
            label="Create Account"
            variant="green"
            onPress={() => console.log('Create')}
          />
        </View>

        <Text style={styles.subsectionTitle}>Secondary Buttons</Text>
        <View style={styles.buttonsContainer}>
          <SecondaryButton
            label="Continue with Google"
            googleIcon
            onPress={() => console.log('Google')}
          />
        </View>

        <Text style={styles.subsectionTitle}>Auth Toggle Links</Text>
        <AuthToggleLink
          message="Already have an account?"
          linkText="Log In"
          onPress={() => console.log('Log In')}
        />
        <View style={{ height: Spacing.sm }} />
        <AuthToggleLink
          message="Don't have an account?"
          linkText="Create one"
          onPress={() => console.log('Create')}
        />
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCanvas,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Platform.OS === 'web' ? Spacing.xl : 60,
  },
  pageTitle: {
    fontSize: Typography.fontSize.display1,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textDark,
    marginBottom: Spacing.xs,
  },
  pageSubtitle: {
    fontSize: Typography.fontSize.subhead,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
    marginBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.title,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textDark,
    marginBottom: Spacing.md,
  },
  subsectionTitle: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textGrey,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  stepLabel: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textGrey,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.greyBorder,
    marginVertical: Spacing.xl,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  iconItem: {
    alignItems: 'center',
    width: 60,
  },
  iconLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
    marginTop: 4,
  },
  typographyList: {
    gap: Spacing.sm,
  },
  typeSample: {
    color: Colors.textDark,
  },
  colorRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  colorItem: {
    alignItems: 'center',
  },
  colorSwatch: {
    width: 60,
    height: 60,
    borderRadius: Radii.lg,
    marginBottom: Spacing.xs,
  },
  colorName: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textGrey,
  },
  sectionDescription: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  logoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xl,
    alignItems: 'flex-end',
    marginBottom: Spacing.lg,
  },
  logoItem: {
    alignItems: 'flex-start',
  },
  logoLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
    marginTop: Spacing.xs,
  },
  logoWithTagline: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.greyBorder,
  },
  logoDarkBg: {
    backgroundColor: Colors.textDark,
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    marginBottom: Spacing.md,
  },
  logoLabelDark: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: 'rgba(255,255,255,0.6)',
    marginTop: Spacing.xs,
  },
  logoColorBgRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  logoColorBg: {
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    marginVertical: Spacing.xl,
  },
  iconCircleItem: {
    alignItems: 'center',
  },
  iconCircleLabel: {
    fontSize: Typography.fontSize.caption,
    fontFamily: Typography.fontFamily.bodyMedium,
    color: Colors.textGrey,
    marginTop: Spacing.md,
  },
  slidePreview: {
    height: 350,
    backgroundColor: Colors.bgCanvas,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.greyBorder,
    overflow: 'hidden',
    marginVertical: Spacing.md,
  },
  paginationPreview: {
    backgroundColor: Colors.bgCanvas,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.greyBorder,
    paddingTop: Spacing.lg,
    marginVertical: Spacing.md,
  },
  inputsContainer: {
    marginVertical: Spacing.md,
  },
  buttonsContainer: {
    marginVertical: Spacing.md,
  },
  headerPreview: {
    marginVertical: Spacing.md,
    marginHorizontal: -Spacing.lg,
    borderRadius: 0,
    overflow: 'hidden',
  },
  toolbarPreview: {
    height: 120,
    backgroundColor: Colors.bgCanvas,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.greyBorder,
    marginVertical: Spacing.md,
    position: 'relative',
    overflow: 'visible',
  },
  iconButtonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  iconButtonDemo: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    alignItems: 'center',
  },
  iconButtonRowLight: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.greyBorder,
    borderRadius: Radii.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginVertical: Spacing.md,
  },
  avatarItem: {
    alignItems: 'center',
  },
  avatarLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
    marginTop: Spacing.xs,
  },
  levelSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  levelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.greyBorder,
    alignItems: 'center',
  },
  levelButtonActive: {
    borderWidth: 2,
  },
  levelButtonText: {
    fontSize: Typography.fontSize.body2,
    fontFamily: Typography.fontFamily.bodySemiBold,
    color: Colors.textDark,
  },
  levelButtonHint: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textGrey,
    marginTop: 2,
  },
});
