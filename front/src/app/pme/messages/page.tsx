"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  conversationsApi,
  usersApi,
  getImageUrl,
  Conversation,
  Message,
  ChatContact,
} from "@/lib/api-services";
import Icon from "@/components/ui/Icon";

export default function MessagesPage() {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  // On ne sélectionne PAS de conversation par défaut pour respecter le comportement mobile
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchContact, setSearchContact] = useState("");
  const [activeFilter, setActiveFilter] = useState<"tous" | "mentorat" | "collab">("tous");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [convs, cts] = await Promise.allSettled([
          conversationsApi.getMesConversations({ limit: 100 }),
          usersApi.getContacts(),
        ]);
        if (convs.status === "fulfilled") {
          setConversations(convs.value.data);
          // Sur PC on peut sélectionner la première par défaut, sur mobile le CSS masquera le chat
          if (convs.value.data.length > 0 && window.innerWidth >= 768) {
            setSelectedConv(convs.value.data[0]);
          }
        }
        if (cts.status === "fulfilled") setContacts(cts.value);
      } catch (error) {
        console.error("Erreur chargement:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!selectedConv) return;
    const load = async () => {
      setIsLoadingMessages(true);
      try {
        const res = await conversationsApi.getMessages(selectedConv.id, { limit: 200 });
        setMessages(res.data);
        try {
          await conversationsApi.marquerCommeLu(selectedConv.id);
        } catch {}
      } catch (error) {
        console.error("Erreur messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    load();
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStartConversation = async (contact: ChatContact) => {
    try {
      const existing = conversations.find(
        (c) =>
          (c.demandeurId === contact.id && c.destinataireId === user?.id) ||
          (c.destinataireId === contact.id && c.demandeurId === user?.id)
      );

      if (existing) {
        setSelectedConv(existing);
        setShowNewChatModal(false);
        return;
      }

      const type = contact.role === "MENTOR" ? "MENTORAT" : "COLLABORATION";
      const newConv = await conversationsApi.create({
        type,
        destinataireId: contact.id,
        sujet: `Conversation avec ${contact.prenom} ${contact.nom}`,
      });

      const res = await conversationsApi.getMesConversations({ limit: 100 });
      setConversations(res.data);

      const found = res.data.find((c) => c.id === newConv.id);
      if (found) setSelectedConv(found);
      setShowNewChatModal(false);
    } catch (error) {
      console.error("Erreur création conversation:", error);
      alert("Erreur lors de la création de la conversation");
    }
  };

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedConv || isSending) return;
    setIsSending(true);
    try {
      const newMsg = await conversationsApi.envoyerMessage(selectedConv.id, {
        contenu: messageInput,
        type: "TEXTE",
      });
      setMessages((prev) => [...prev, newMsg]);
      setMessageInput("");

      const res = await conversationsApi.getMesConversations({ limit: 100 });
      setConversations(res.data);
    } catch (error) {
      console.error("Erreur envoi:", error);
      alert("Erreur lors de l'envoi");
    } finally {
      setIsSending(false);
    }
  };

  const getInitials = (text: string) =>
    text.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const getOtherParticipant = (conv: Conversation) => {
    if (conv.demandeurId === user?.id) return conv.destinataire;
    return conv.demandeur;
  };

  const getNonLus = (conv: Conversation) => {
    if (conv.demandeurId === user?.id) return conv.nbNonLusA;
    return conv.nbNonLusB;
  };

  const filteredConversations = conversations.filter((c) => {
    if (activeFilter === "mentorat") return c.type === "MENTORAT";
    if (activeFilter === "collab") return c.type === "COLLABORATION";
    return true;
  });

  const filteredContacts = contacts.filter((c) => {
    if (c.id === user?.id) return false;
    if (c.role === "ADMIN") return false;
    if (!searchContact) return true;
    const search = searchContact.toLowerCase();
    return (
      c.nom.toLowerCase().includes(search) ||
      c.prenom.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search)
    );
  });

  if (isLoading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto">
        <div className="w-full bg-white/50 rounded-[2rem] border border-slate-200 h-[calc(100vh-120px)] animate-pulse" />
      </div>
    );
  }

  const other = selectedConv ? getOtherParticipant(selectedConv) : null;
  const otherPhoto = getImageUrl(other?.photoProfil);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] mx-auto relative overflow-hidden h-[calc(100vh-80px)] flex flex-col">
      
      {/* ================= BACKGROUND PREMIUM ================= */}
      <div className="absolute inset-0 top-0 h-full -z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-60" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] opacity-60" />
      </div>

      <div className="flex flex-col w-full h-full space-y-4 z-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/60 backdrop-blur-md border border-slate-200 text-slate-700 uppercase tracking-wider shadow-sm">
                Messagerie — Exercice 2026
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
              Espace d'Échanges
            </h1>
          </div>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors shadow-md self-start sm:self-auto"
          >
            <Icon name="plus" size={18} />
            <span>Nouvelle conversation</span>
          </button>
        </div>

        {/* ================= LAYOUT CONTENEUR FLOTTANT ================= */}
        <div className="w-full flex-1 min-h-0 bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[2rem] shadow-2xl shadow-slate-300/30 flex overflow-hidden relative">
          
          {/* Sidebar : Liste des conversations */}
          {/* Caché sur mobile si une conv est ouverte */}
          <section 
            className={`w-full md:w-[350px] shrink-0 bg-white/40 flex-col h-full border-r border-slate-200/60 
              ${selectedConv ? "hidden md:flex" : "flex"}`}
          >
            <div className="p-5 space-y-4 border-b border-slate-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-slate-900">Messages</span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    {conversations.length}
                  </span>
                </div>
              </div>

              <div className="flex p-1 bg-slate-100/50 border border-slate-200/50 rounded-xl gap-1">
                {[
                  { id: "tous", label: "Tous" },
                  { id: "mentorat", label: "Mentorat" },
                  { id: "collab", label: "Collab." },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id as any)}
                    className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition-all ${
                      activeFilter === f.id
                        ? "bg-white text-primary shadow-sm border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Icon name="chat" size={32} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-700 mb-1">Aucune conversation</p>
                  <p className="text-xs text-slate-500 mb-4">Démarrez un échange.</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const other = getOtherParticipant(conv);
                  const nonLus = getNonLus(conv);
                  const photo = getImageUrl(other?.photoProfil);
                  const isActive = selectedConv?.id === conv.id;
                  
                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConv(conv)}
                      className={`relative flex items-start gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 border ${
                        isActive
                          ? "bg-white shadow-sm border-slate-200/80"
                          : "border-transparent hover:bg-white/50"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full"></div>
                      )}
                      <div className="relative shrink-0 ml-1">
                        {photo ? (
                          <img src={photo} alt="" className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                        ) : (
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${conv.type === "MENTORAT" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
                            {other ? getInitials(`${other.prenom} ${other.nom}`) : "?"}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-sm font-bold truncate ${isActive ? "text-primary" : "text-slate-900"}`}>
                            {other ? `${other.prenom} ${other.nom}` : "—"}
                          </span>
                          {conv.dernierMessageAt && (
                            <span className="text-[10px] font-semibold text-slate-400 shrink-0 uppercase">
                              {new Date(conv.dernierMessageAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs truncate ${isActive ? "text-slate-600 font-medium" : "text-slate-500"}`}>
                            {conv.dernierMessage || "Aucun message"}
                          </p>
                          {nonLus > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold shrink-0 shadow-sm">
                              {nonLus}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Main : Zone de Chat */}
          {/* Sur mobile, caché si aucune conv n'est sélectionnée */}
          <main 
            className={`flex-1 flex-col h-full bg-slate-50/50 relative 
              ${!selectedConv ? "hidden md:flex" : "flex"}`}
          >
            {!selectedConv ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-24 h-24 rounded-[2rem] bg-white shadow-sm border border-slate-200 flex items-center justify-center">
                    <Icon name="chat" size={40} className="text-slate-300" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-700">Sélectionnez une conversation</h2>
                </div>
              </div>
            ) : (
              <>
                <header className="px-4 sm:px-6 py-4 bg-white/80 backdrop-blur-md flex items-center justify-between shadow-sm z-10 border-b border-slate-200/60">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    
                    {/* ✅ BOUTON RETOUR (Mobile uniquement) */}
                    <button 
                      onClick={() => setSelectedConv(null)}
                      className="md:hidden p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                      <Icon name="arrow-left" size={20} />
                    </button>

                    <div className="relative shrink-0">
                      {otherPhoto ? (
                        <img src={otherPhoto} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover shadow-sm ring-2 ring-white" />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white">
                          {other ? getInitials(`${other.prenom} ${other.nom}`) : "?"}
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
                        {other ? `${other.prenom} ${other.nom}` : "—"}
                      </h2>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] sm:text-xs text-emerald-600 font-bold uppercase tracking-wider">En ligne</span>
                      </div>
                    </div>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Icon name="refresh" size={40} className="text-primary animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex flex-col items-center gap-3 text-center bg-white/60 backdrop-blur-md px-8 py-6 rounded-3xl border border-slate-200/60 shadow-sm">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                          <Icon name="chat" size={32} className="text-slate-300" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700">Aucun message</p>
                          <p className="text-xs text-slate-500 mt-1">Envoyez votre premier message.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => {
                        const isMine = msg.expediteurId === user?.id;
                        const sender = msg.expediteur;
                        return (
                          <div
                            key={msg.id}
                            className={`flex items-end gap-2 sm:gap-3 max-w-[90%] sm:max-w-3xl ${isMine ? "ml-auto flex-row-reverse" : ""}`}
                          >
                            {!isMine && (
                              <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 text-primary flex items-center justify-center text-xs font-bold shrink-0 mb-1">
                                {sender ? getInitials(`${sender.prenom} ${sender.nom}`) : "?"}
                              </div>
                            )}
                            <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                              <div
                                className={`px-4 py-2.5 sm:px-5 sm:py-3 shadow-sm text-sm font-medium max-w-full sm:max-w-md leading-relaxed break-words ${
                                  isMine
                                    ? "bg-slate-900 text-white rounded-2xl rounded-br-sm"
                                    : "bg-white text-slate-800 border border-slate-200/60 rounded-2xl rounded-bl-sm"
                                }`}
                              >
                                {msg.contenu}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 mt-1.5 px-1 uppercase tracking-wider">
                                <span>
                                  {new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {isMine && msg.lu && (
                                  <Icon name="check" size={12} className="text-emerald-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                <footer className="p-3 sm:p-4 bg-white/60 backdrop-blur-md border-t border-slate-200/60">
                  <div className="flex items-end gap-2 sm:gap-3 bg-white p-1.5 sm:p-2 rounded-2xl border border-slate-200/80 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      disabled={isSending}
                      className="flex-1 bg-transparent resize-none text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none p-2 sm:p-2.5 max-h-32"
                      placeholder="Tapez un message..."
                      rows={1}
                    />
                    <button
                      onClick={handleSend}
                      disabled={isSending || !messageInput.trim()}
                      className="p-2.5 sm:p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 shrink-0 shadow-md"
                    >
                      <Icon name={isSending ? "refresh" : "send"} size={18} className={isSending ? "animate-spin" : ""} />
                    </button>
                  </div>
                </footer>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Modal Nouvelle Conversation */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-[2rem] border border-white shadow-2xl p-6 sm:p-8 flex flex-col gap-6 max-h-[85vh]">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900">Nouvelle conversation</h2>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Icon name="search" size={18} />
              </div>
              <input
                type="text"
                value={searchContact}
                onChange={(e) => setSearchContact(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Rechercher un utilisateur..."
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="user" size={40} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700">Aucun contact trouvé</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredContacts.map((contact) => {
                    const photo = getImageUrl(contact.photoProfil);
                    return (
                      <button
                        key={contact.id}
                        onClick={() => handleStartConversation(contact)}
                        className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 hover:shadow-sm transition-all text-left group"
                      >
                        {photo ? (
                          <img src={photo} alt="" className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-sm group-hover:scale-105 transition-transform">
                            {getInitials(`${contact.prenom} ${contact.nom}`)}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-base font-bold text-slate-900 truncate">
                            {contact.prenom} {contact.nom}
                          </span>
                          <span className="text-xs font-medium text-slate-500 truncate mt-0.5">
                            {contact.role === "MENTOR" ? `Mentor — ${contact.domaineMentor || "Expert"}` : contact.role === "DIRIGEANT" ? "Dirigeant PME" : contact.role}
                          </span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                          <Icon name="chat" size={18} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}