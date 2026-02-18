import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/DesignTokens';

export type MaterialIconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface IconProps {
  name: MaterialIconName;
  size?: number;
  color?: string;
  style?: object;
}

export function Icon({ 
  name, 
  size = 24, 
  color = Colors.textDark,
  style 
}: IconProps) {
  return (
    <MaterialCommunityIcons 
      name={name} 
      size={size} 
      color={color}
      style={style}
    />
  );
}

export const IconNames = {
  search: 'magnify' as MaterialIconName,
  filter: 'filter-outline' as MaterialIconName,
  viewList: 'view-list-outline' as MaterialIconName,
  viewGrid: 'view-grid-outline' as MaterialIconName,
  check: 'check' as MaterialIconName,
  checkCircle: 'check-circle-outline' as MaterialIconName,
  close: 'close' as MaterialIconName,
  add: 'plus' as MaterialIconName,
  edit: 'pencil-outline' as MaterialIconName,
  delete: 'delete-outline' as MaterialIconName,
  chevronRight: 'chevron-right' as MaterialIconName,
  chevronLeft: 'chevron-left' as MaterialIconName,
  expandMore: 'chevron-down' as MaterialIconName,
  expandLess: 'chevron-up' as MaterialIconName,
  home: 'home-outline' as MaterialIconName,
  house: 'home-city-outline' as MaterialIconName,
  room: 'door-open' as MaterialIconName,
  camera: 'camera-outline' as MaterialIconName,
  image: 'image-outline' as MaterialIconName,
  person: 'account-outline' as MaterialIconName,
  settings: 'cog-outline' as MaterialIconName,
  menu: 'menu' as MaterialIconName,
  moreVert: 'dots-vertical' as MaterialIconName,
  moreHoriz: 'dots-horizontal' as MaterialIconName,
  location: 'map-marker-outline' as MaterialIconName,
  inventory: 'package-variant' as MaterialIconName,
  folder: 'folder-outline' as MaterialIconName,
  star: 'star-outline' as MaterialIconName,
  starFilled: 'star' as MaterialIconName,
  lock: 'lock-outline' as MaterialIconName,
  lockOpen: 'lock-open-outline' as MaterialIconName,
  kitchen: 'stove' as MaterialIconName,
};
