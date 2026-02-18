import { useQuery } from '@tanstack/react-query';
import { House } from '@/types/house';
import { Room } from '@/types/room';

export const useHouses = () => {
  return useQuery<House[]>({
    queryKey: ['/houses'],
  });
};

export const useHouse = (id: number) => {
  return useQuery<House>({
    queryKey: [`/houses/${id}`],
    enabled: !!id,
  });
};

export const useRooms = () => {
  return useQuery<Room[]>({
    queryKey: ['/rooms'],
  });
};

export const useRoom = (id: number) => {
  return useQuery<Room>({
    queryKey: [`/rooms/${id}`],
    enabled: !!id,
  });
};
