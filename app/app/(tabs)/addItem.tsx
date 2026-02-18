import { useState, useEffect } from 'react';
import MakePhotoStep from '@/components/addItem/makePhotoStep';
import RecognizeItemStep from '@/components/addItem/recognizeItemStep';
import { RecognitionResult } from '@/types/recognitionResult';
import AddItemFormStep from '@/components/addItem/addItemFormStep';
import { ImagePickerAsset } from 'expo-image-picker';
import { useNavigation } from '@/contexts/NavigationContext';

export default function AddItemScreen() {
  const { setNavigationMode } = useNavigation();
  const [image, setImage] = useState<ImagePickerAsset | null>(null);
  const [data, setData] = useState<RecognitionResult | null>(null);

  useEffect(() => {
    setNavigationMode('form');
    return () => setNavigationMode('shell');
  }, []);

  if (!image) {
    return <MakePhotoStep onSelectPhoto={setImage} />;
  }

  if (!data) {
    return <RecognizeItemStep image={image} onReceivedData={setData} />;
  }

  return <AddItemFormStep image={image} data={data} />;
}
