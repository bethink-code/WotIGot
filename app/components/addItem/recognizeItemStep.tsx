import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ImagePickerAsset } from 'expo-image-picker';
import { AnalyzingOverlay } from '@/components/ui/AnalyzingOverlay';
import { Colors } from '@/constants/DesignTokens';
import { useRecognition } from '@/lib/mutations';
import { RecognitionResult } from '@/types/recognitionResult';

interface RecognizeItemStepProps {
  image: ImagePickerAsset;
  onReceivedData: (data: RecognitionResult) => void;
}

export default function RecognizeItemStep({
  image,
  onReceivedData,
}: RecognizeItemStepProps) {
  const { mutateAsync: recognizeImage } = useRecognition();
  const [currentStep, setCurrentStep] = useState<'recognizing' | 'estimating'>('recognizing');

  useEffect(() => {
    const recognize = async () => {
      setCurrentStep('recognizing');
      
      const result = await recognizeImage(image);
      
      setCurrentStep('estimating');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onReceivedData(result);
    };
    
    recognize();
  }, [image, onReceivedData, recognizeImage]);

  const steps = [
    { label: 'Photo captured', status: 'complete' as const },
    { 
      label: 'Recognizing item', 
      status: currentStep === 'recognizing' ? 'active' as const : 'complete' as const 
    },
    { 
      label: 'Estimating value', 
      status: currentStep === 'estimating' ? 'active' as const : 'pending' as const 
    },
  ];

  return (
    <View style={styles.container}>
      <AnalyzingOverlay
        visible={true}
        imageUri={image.uri}
        title="Identifying item"
        subtitle="AI is analyzing your photo"
        steps={steps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCanvas,
  },
});
