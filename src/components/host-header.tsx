import { Image } from 'expo-image';
import { ArrowLeftRight } from 'lucide-react-native';
import { View } from 'react-native';

import { Muted, Txt } from '@/components/txt';
import { CircleButton } from '@/components/ui';
import { colors } from '@/lib/theme';
import { useAppState } from '@/providers/app-state';

export function HostHeader({ title, sub }: { title: string; sub?: string }) {
  const { setMode } = useAppState();
  return (
    <>
      <View style={{ paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Image source={require('@/assets/images/logo.png')} style={{ height: 31, width: 96 }} contentFit="contain" accessibilityLabel="Curby" />
          <View style={{ height: 24, paddingHorizontal: 9, borderRadius: 12, backgroundColor: colors.navy, justifyContent: 'center' }}>
            <Txt w="extrabold" size={11} color="#fff" tracking={0.8}>
              HOST
            </Txt>
          </View>
        </View>
        <CircleButton icon={ArrowLeftRight} label="Switch to parking" onPress={() => setMode('driver')} />
      </View>
      <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
        {!!sub && (
          <Muted w="semibold" size={14}>
            {sub}
          </Muted>
        )}
        <Txt w="extrabold" size={30} tracking={-1} lh={36} accessibilityRole="header">
          {title}
        </Txt>
      </View>
    </>
  );
}
