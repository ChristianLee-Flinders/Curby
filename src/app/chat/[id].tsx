import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBooking, useMessages, useSendMessage } from '@/api/queries';
import { Muted, Txt } from '@/components/txt';
import { CircleButton, Loading, NavBar } from '@/components/ui';
import { dayLabel, time } from '@/lib/format';
import { errorMessage, supabase } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';
import type { Message } from '@/lib/types';
import { useUserId } from '@/providers/auth';
import { useToast } from '@/providers/toast';

/** Chat between a driver and host, scoped to one booking. Updates live via Supabase Realtime. */
export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const uid = useUserId();
  const toast = useToast();
  const qc = useQueryClient();
  const { data: b } = useBooking(id);
  const msgs = useMessages(id);
  const send = useSendMessage(id);
  const [text, setText] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    const ch = supabase
      .channel(`messages:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `booking_id=eq.${id}` }, (payload) => {
        const m = payload.new as Message;
        qc.setQueryData<Message[]>(['messages', id], (old = []) => (old.some((x) => x.id === m.id) ? old : [...old, m]));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [id, qc]);

  const isHost = !!b && b.driver_id !== uid;
  const title = b?.listing?.title ?? 'Messages';

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    setText('');
    send.mutate(t, {
      onError: (e) => {
        setText(t);
        toast(errorMessage(e), 'error');
      },
    });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NavBar title={isHost ? 'Message driver' : 'Message host'} />
      {msgs.isLoading ? (
        <Loading />
      ) : (
        <FlatList
          ref={listRef}
          data={msgs.data ?? []}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={
            <Muted size={11.5} w="semibold" style={{ textAlign: 'center', marginBottom: 8 }}>
              {title}
              {b ? ` · ${dayLabel(new Date(b.starts_at))}` : ''}
            </Muted>
          }
          ListEmptyComponent={
            <Muted style={{ textAlign: 'center', marginTop: 40, paddingHorizontal: 30, lineHeight: 20 }}>
              Say hello, ask about access, or let them know when you’re close.
            </Muted>
          }
          renderItem={({ item: m }) => {
            const me = m.sender_id === uid;
            return (
              <View style={[styles.msg, me ? styles.me : styles.them]}>
                <Txt size={14.5} color={me ? '#fff' : colors.navy} lh={21}>
                  {m.body}
                </Txt>
                <Txt size={10.5} color={me ? 'rgba(255,255,255,0.7)' : colors.grey2} style={{ marginTop: 3, alignSelf: 'flex-end' }}>
                  {time(new Date(m.created_at))}
                </Txt>
              </View>
            );
          }}
        />
      )}
      <View style={[styles.composer, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write a message…"
          placeholderTextColor={colors.grey2}
          style={styles.input}
          multiline
          maxLength={2000}
          accessibilityLabel="Message"
        />
        <CircleButton icon={Send} label="Send" variant="primary" onPress={submit} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  msg: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  me: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  them: { alignSelf: 'flex-start', backgroundColor: colors.card, borderBottomLeftRadius: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.navy,
  },
});
