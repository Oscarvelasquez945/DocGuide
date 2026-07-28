import { useEffect, useState } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { Navigate, UserMode } from '../types/navigation';
import {
  BottomNav,
  colors,
  Header,
  Screen,
} from '../components/Ui';
import {
  addMessage,
  createConversation as createConversationRecord,
  listConversations,
  listMessages,
} from '../services/conversations';
import { askVitali, type SearchContext } from '../services/vitali';

export type Message = {
  id: number;
  from: 'bot' | 'user';
  text: string;
};

export type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
  messages: Message[];
};

const newConversationMessages: Message[] = [
  {
    id: 1,
    from: 'bot',
    text: '¡Hola! Soy Vitali. Puedo orientarte para encontrar el tipo de atención que necesitas.',
  },
  {
    id: 2,
    from: 'bot',
    text: 'Recuerda: no sustituyo la evaluación de un profesional ni atiendo emergencias.',
  },
];

export function ChatScreen({
  mode,
  navigate,
  searchContext,
}: {
  mode: UserMode;
  navigate: Navigate;
  searchContext: SearchContext;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeId) ?? null;
  const messages = activeConversation?.messages ?? [];

  const updateMessages = (
    conversationId: string,
    updater: (messages: Message[]) => Message[],
  ) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: updater(conversation.messages),
              updatedAt: 'Ahora',
            }
          : conversation,
      ),
    );
  };

  const hydrateConversation = async (conversationId: string) => {
    const rows = await listMessages(conversationId);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: rows.map((message) => ({
                id: message.id,
                from: message.sender === 'assistant' ? 'bot' : 'user',
                text: message.content,
              })),
            }
          : conversation,
      ),
    );
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listConversations()
      .then(async (rows) => {
        if (cancelled) return;
        const hasReusableEmptyConversation =
          rows[0]?.title === 'Nueva conversación';

        if (!rows.length || !hasReusableEmptyConversation) {
          const created = await createConversationRecord();
          const storedMessages = await Promise.all(
            newConversationMessages.map((message) =>
              addMessage(
                created.id,
                message.from === 'bot' ? 'assistant' : 'user',
                message.text,
              ),
            ),
          );
          if (cancelled) return;
          const previousConversations = rows.map((conversation) => ({
            id: conversation.id,
            title: conversation.title,
            updatedAt: formatConversationDate(conversation.updated_at),
            messages: [] as Message[],
          }));
          setConversations([
            {
              id: created.id,
              title: created.title,
              updatedAt: 'Ahora',
              messages: storedMessages.map((message) => ({
                id: message.id,
                from: message.sender === 'assistant' ? 'bot' : 'user',
                text: message.content,
              })),
            },
            ...previousConversations,
          ]);
          setActiveId(created.id);
          return;
        }

        const mapped = rows.map((conversation) => ({
          id: conversation.id,
          title: conversation.title,
          updatedAt: formatConversationDate(conversation.updated_at),
          messages: [] as Message[],
        }));
        setConversations(mapped);
        setActiveId(mapped[0].id);
        await hydrateConversation(mapped[0].id);
      })
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : 'No se pudo cargar el historial.'),
      )
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const createConversation = async () => {
    setLoading(true);
    setError('');
    try {
      const created = await createConversationRecord();
      const storedMessages = await Promise.all(
        newConversationMessages.map((message) =>
          addMessage(
            created.id,
            message.from === 'bot' ? 'assistant' : 'user',
            message.text,
          ),
        ),
      );
      setConversations((current) => [
        {
          id: created.id,
          title: created.title,
          updatedAt: 'Ahora',
          messages: storedMessages.map((message) => ({
            id: message.id,
            from: message.sender === 'assistant' ? 'bot' : 'user',
            text: message.content,
          })),
        },
        ...current,
      ]);
      setActiveId(created.id);
      setDraft('');
      setShowHistory(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo crear el chat.');
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (conversationId: string) => {
    setActiveId(conversationId);
    setShowHistory(false);
    setLoading(true);
    setError('');
    try {
      await hydrateConversation(conversationId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los mensajes.');
    } finally {
      setLoading(false);
    }
  };

  const send = async () => {
    const value = draft.trim();
    if (!value || typing || !activeId) return;

    setDraft('');
    setTyping(true);
    setError('');
    try {
      const result = await askVitali(activeId, value, searchContext);
      const storedUserMessage = result.userMessage;
      updateMessages(activeId, (current) => [
        ...current,
        { id: storedUserMessage.id, from: 'user', text: storedUserMessage.content },
      ]);
      if (activeConversation?.title === 'Nueva conversación') {
        const title = value.length > 28 ? `${value.slice(0, 28)}…` : value;
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === activeId ? { ...conversation, title } : conversation,
          ),
        );
      }

      const storedReply = result.assistantMessage;
      updateMessages(activeId, (current) => [
        ...current,
        { id: storedReply.id, from: 'bot', text: storedReply.content },
      ]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo enviar el mensaje.');
    } finally {
      setTyping(false);
    }
  };

  return (
    <Screen>
      <Header
        onBack={() => navigate(mode === 'doctor' ? 'doctor-home' : 'patient-map')}
        right={
          <Pressable
            onPress={() => setShowHistory((value) => !value)}
            style={[styles.headerAction, showHistory && styles.headerActionActive]}
          >
            <MaterialCommunityIcons
              color={showHistory ? colors.white : colors.blue}
              name="history"
              size={23}
            />
          </Pressable>
        }
        title={showHistory ? 'Historial' : 'Vitali'}
      />
      {showHistory ? (
        <View style={styles.historyContainer}>
          <View style={styles.historyHeading}>
            <View>
              <Text style={styles.historyTitle}>Tus conversaciones</Text>
              <Text style={styles.historySubtitle}>
                {conversations.length} guardadas en Supabase
              </Text>
            </View>
            <Pressable onPress={createConversation} style={styles.newChatButton}>
              <MaterialCommunityIcons color={colors.white} name="plus" size={22} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {conversations.map((conversation) => {
              const preview =
                conversation.messages[conversation.messages.length - 1]?.text ??
                'Sin mensajes';
              const active = conversation.id === activeId;

              return (
                <Pressable
                  key={conversation.id}
                  onPress={() => openConversation(conversation.id)}
                  style={[styles.historyCard, active && styles.historyCardActive]}
                >
                  <View style={[styles.historyIcon, active && styles.historyIconActive]}>
                    <MaterialCommunityIcons
                      color={active ? colors.white : colors.blue}
                      name="message-text-outline"
                      size={23}
                    />
                  </View>
                  <View style={styles.historyCopy}>
                    <View style={styles.historyCardTop}>
                      <Text numberOfLines={1} style={styles.historyCardTitle}>
                        {conversation.title}
                      </Text>
                      <Text style={styles.historyDate}>{conversation.updatedAt}</Text>
                    </View>
                    <Text numberOfLines={2} style={styles.historyPreview}>
                      {preview}
                    </Text>
                  </View>
                  <MaterialCommunityIcons color="#8498B0" name="chevron-right" size={22} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <>
      <View style={styles.chatIdentity}>
        <View style={styles.botAvatar}>
          <MaterialCommunityIcons color={colors.white} name="robot-happy-outline" size={28} />
        </View>
        <View>
          <Text style={styles.botName}>Asistente DocGuide</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Disponible ahora</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.messages}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.safety}>
          <MaterialCommunityIcons color="#9A6B17" name="shield-alert-outline" size={18} />
          <Text style={styles.safetyText}>
            Si es una emergencia, llama a los servicios locales de inmediato.
          </Text>
        </View>
        {loading && <Text style={styles.stateText}>Cargando conversación…</Text>}
        {!!error && <Text style={styles.errorText}>{error}</Text>}
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.bubble,
              message.from === 'user' ? styles.userBubble : styles.botBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                message.from === 'user' && styles.userMessageText,
              ]}
            >
              {message.text}
            </Text>
          </View>
        ))}
        {typing && (
          <View style={[styles.bubble, styles.botBubble]}>
            <Text style={styles.typing}>Vitali está escribiendo…</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          multiline
          onChangeText={setDraft}
          onSubmitEditing={send}
          placeholder="Escribe tu consulta…"
          placeholderTextColor="#8799AE"
          style={styles.composerInput}
          value={draft}
        />
        <Pressable
          disabled={!draft.trim()}
          onPress={send}
          style={[styles.send, !draft.trim() && styles.sendDisabled]}
        >
          <MaterialCommunityIcons color={colors.white} name="send" size={21} />
        </Pressable>
      </View>
        </>
      )}
      <View style={styles.navSpace} />
      <BottomNav current="chat" mode={mode} navigate={navigate} />
    </Screen>
  );
}

function formatConversationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-HN', {
    day: '2-digit',
    month: 'short',
  });
}

const contactOptions = [
  {
    icon: 'phone-outline' as const,
    title: 'Haz una llamada',
    subtitle: '+504 2234-5678',
    action: () => Linking.openURL('tel:+50422345678'),
  },
  {
    icon: 'email-outline' as const,
    title: 'Envíanos un correo',
    subtitle: 'soporte@docguide.hn',
    action: () => Linking.openURL('mailto:soporte@docguide.hn'),
  },
  {
    icon: 'frequently-asked-questions' as const,
    title: 'Preguntas frecuentes',
    subtitle: 'Encuentra respuestas rápidas',
    action: () => undefined,
  },
];

export function ContactScreen({
  mode,
  navigate,
}: {
  mode: UserMode;
  navigate: Navigate;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Screen scroll>
      <Header
        onBack={() => navigate(mode === 'doctor' ? 'doctor-home' : 'patient-map')}
        title="Contacto"
      />
      <View style={styles.contactIntro}>
        <View style={styles.contactIcon}>
          <MaterialCommunityIcons color={colors.blue} name="lifebuoy" size={44} />
        </View>
        <Text style={styles.contactTitle}>Estamos para ayudarte</Text>
        <Text style={styles.contactText}>
          Elige el canal que prefieras. Nuestro equipo responderá tan pronto como sea posible.
        </Text>
      </View>
      <View style={styles.contactList}>
        {contactOptions.map((option) => (
          <Pressable
            key={option.title}
            onPress={
              option.title === 'Preguntas frecuentes'
                ? () => setExpanded((value) => !value)
                : option.action
            }
            style={styles.contactCard}
          >
            <View style={styles.contactCardIcon}>
              <MaterialCommunityIcons color={colors.blue} name={option.icon} size={27} />
            </View>
            <View style={styles.contactCardCopy}>
              <Text style={styles.contactCardTitle}>{option.title}</Text>
              <Text style={styles.contactCardText}>{option.subtitle}</Text>
            </View>
            <MaterialCommunityIcons
              color="#7890AB"
              name={option.title === 'Preguntas frecuentes' && expanded ? 'chevron-up' : 'chevron-right'}
              size={25}
            />
          </Pressable>
        ))}
      </View>
      {expanded && (
        <View style={styles.faq}>
          <Text style={styles.faqQuestion}>¿Vitali reemplaza una consulta médica?</Text>
          <Text style={styles.faqAnswer}>
            No. Vitali brinda orientación general y no sustituye a un profesional.
          </Text>
          <Text style={styles.faqQuestion}>¿Se guarda mi ubicación?</Text>
          <Text style={styles.faqAnswer}>
            En el MVP solo se usa mientras exploras el mapa y no se almacena permanentemente.
          </Text>
        </View>
      )}
      <View style={styles.navSpace} />
      <BottomNav current="contact" mode={mode} navigate={navigate} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerAction: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerActionActive: { backgroundColor: colors.blue },
  historyContainer: { flex: 1, paddingTop: 24 },
  historyHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  historyTitle: { color: colors.navy, fontSize: 24, fontWeight: '900' },
  historySubtitle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  newChatButton: {
    alignItems: 'center',
    backgroundColor: colors.blue,
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  historyCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: 'transparent',
    borderRadius: 19,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 10,
    padding: 14,
  },
  historyCardActive: { backgroundColor: '#E7F0FF', borderColor: '#B8D1F7' },
  historyIcon: {
    alignItems: 'center',
    backgroundColor: '#E8F0FE',
    borderRadius: 14,
    height: 47,
    justifyContent: 'center',
    width: 47,
  },
  historyIconActive: { backgroundColor: colors.blue },
  historyCopy: { flex: 1, marginLeft: 12, marginRight: 6 },
  historyCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyCardTitle: { color: colors.navy, flex: 1, fontSize: 14, fontWeight: '800' },
  historyDate: { color: '#8294AA', fontSize: 9, marginLeft: 8 },
  historyPreview: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 5 },
  chatIdentity: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginTop: 13,
    paddingBottom: 13,
  },
  botAvatar: {
    alignItems: 'center',
    backgroundColor: colors.blue,
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    marginRight: 11,
    width: 52,
  },
  botName: { color: colors.navy, fontSize: 15, fontWeight: '800' },
  onlineRow: { alignItems: 'center', flexDirection: 'row', marginTop: 3 },
  onlineDot: { backgroundColor: colors.success, borderRadius: 4, height: 8, marginRight: 5, width: 8 },
  onlineText: { color: colors.muted, fontSize: 11 },
  messages: { paddingBottom: 14, paddingTop: 14 },
  safety: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFF2D8',
    borderRadius: 13,
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '95%',
    padding: 11,
  },
  safetyText: { color: '#765215', flex: 1, fontSize: 11, lineHeight: 16, marginLeft: 7 },
  bubble: { borderRadius: 18, marginBottom: 10, maxWidth: '84%', paddingHorizontal: 15, paddingVertical: 12 },
  botBubble: { alignSelf: 'flex-start', backgroundColor: colors.white, borderBottomLeftRadius: 5 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.blue, borderBottomRightRadius: 5 },
  messageText: { color: colors.navy, fontSize: 14, lineHeight: 20 },
  userMessageText: { color: colors.white },
  typing: { color: colors.muted, fontSize: 12, fontStyle: 'italic' },
  stateText: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  composer: {
    alignItems: 'flex-end',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 7,
  },
  composerInput: { color: colors.navy, flex: 1, fontSize: 14, maxHeight: 90, minHeight: 43, paddingHorizontal: 10, paddingVertical: 11 },
  send: { alignItems: 'center', backgroundColor: colors.blue, borderRadius: 15, height: 43, justifyContent: 'center', width: 43 },
  sendDisabled: { opacity: 0.35 },
  navSpace: { height: 78 },
  contactIntro: { alignItems: 'center', marginBottom: 28, marginTop: 32 },
  contactIcon: { alignItems: 'center', backgroundColor: '#DDEAFF', borderRadius: 33, height: 76, justifyContent: 'center', width: 76 },
  contactTitle: { color: colors.navy, fontSize: 27, fontWeight: '900', marginTop: 16 },
  contactText: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8, textAlign: 'center' },
  contactList: { gap: 11 },
  contactCard: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 20, flexDirection: 'row', padding: 15 },
  contactCardIcon: { alignItems: 'center', backgroundColor: '#E7F0FF', borderRadius: 15, height: 52, justifyContent: 'center', width: 52 },
  contactCardCopy: { flex: 1, marginLeft: 13 },
  contactCardTitle: { color: colors.navy, fontSize: 15, fontWeight: '800' },
  contactCardText: { color: colors.muted, fontSize: 12, marginTop: 3 },
  faq: { backgroundColor: '#E2ECFF', borderRadius: 20, marginTop: 12, padding: 18 },
  faqQuestion: { color: colors.navy, fontSize: 14, fontWeight: '800', marginTop: 4 },
  faqAnswer: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 13, marginTop: 4 },
});
