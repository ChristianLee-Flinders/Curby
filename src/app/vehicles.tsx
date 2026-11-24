import { router } from 'expo-router';
import { Car, Trash } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { useAddVehicle, useDeleteVehicle, useVehicles } from '@/api/queries';
import { Muted, Txt } from '@/components/txt';
import { Button, Card, CircleButton, Empty, Field, Loading, NavBar, Plate } from '@/components/ui';
import { formatReg } from '@/lib/format';
import { errorMessage } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import { useToast } from '@/providers/toast';

export default function Vehicles() {
  const toast = useToast();
  const vehicles = useVehicles();
  const add = useAddVehicle();
  const del = useDeleteVehicle();
  const [reg, setReg] = useState('');
  const [model, setModel] = useState('');
  const [colour, setColour] = useState('');

  const regOk = reg.replace(/\s/g, '').length >= 2 && reg.replace(/\s/g, '').length <= 8;

  const save = () =>
    add.mutate(
      { registration: formatReg(reg), make_model: model.trim(), colour: colour.trim() },
      {
        onSuccess: () => {
          toast(`${formatReg(reg)} added`);
          setReg('');
          setModel('');
          setColour('');
          if (router.canGoBack()) router.back();
        },
        onError: (e) => toast(errorMessage(e), 'error'),
      }
    );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NavBar title="Vehicles" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {vehicles.isLoading ? (
          <Loading />
        ) : vehicles.data?.length ? (
          vehicles.data.map((v) => (
            <Card key={v.id} style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Plate reg={v.registration} />
              <View style={{ flex: 1 }}>
                <Txt w="bold" size={14.5}>
                  {v.make_model || 'Vehicle'}
                </Txt>
                {!!v.colour && <Muted size={12.5}>{v.colour}</Muted>}
              </View>
              <CircleButton
                icon={Trash}
                label={`Remove ${v.registration}`}
                variant="soft"
                size={38}
                color={colors.bad}
                onPress={() => del.mutate(v.id, { onSuccess: () => toast('Vehicle removed'), onError: (e) => toast(errorMessage(e), 'error') })}
              />
            </Card>
          ))
        ) : (
          <Empty icon={Car} title="No vehicles yet" body="Add your car so hosts know what to expect." />
        )}

        <Txt w="extrabold" size={18} tracking={-0.4} style={{ marginTop: 14 }}>
          Add a vehicle
        </Txt>
        <Field label="Registration" value={reg} onChangeText={(t) => setReg(t.toUpperCase())} autoCapitalize="characters" autoCorrect={false} placeholder="e.g. LK21 XRT" maxLength={9} />
        <Field label="Make and model" value={model} onChangeText={setModel} placeholder="e.g. Volkswagen Golf" />
        <Field label="Colour" value={colour} onChangeText={setColour} placeholder="e.g. White" />
        <Button title="Save vehicle" onPress={save} loading={add.isPending} disabled={!regOk} style={{ marginTop: 6 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
