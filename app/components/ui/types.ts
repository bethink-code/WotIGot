export type HierarchyLevel = 'portfolio' | 'property' | 'room';

export type SelectorState = 'default' | 'selected' | 'unselectable';

export type ViewMode = 'list' | 'grid';

export const getLevelColors = (level: HierarchyLevel = 'portfolio') => {
  const colors = {
    portfolio: {
      primary: '#00B894',
      soft: '#E0F9F4',
      border: '#00B894',
    },
    property: {
      primary: '#F7B731',
      soft: '#FFF5D8',
      border: '#F7B731',
    },
    room: {
      primary: '#FA8231',
      soft: '#FFF0E6',
      border: '#FA8231',
    },
  };
  return colors[level];
};

export const MaterialStateLayer = {
  hoverOpacity: 0.08,
  focusOpacity: 0.12,
  pressedOpacity: 0.12,
  dragOpacity: 0.16,
};
